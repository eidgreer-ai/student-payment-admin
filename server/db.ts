import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, groups, students, payments, settings, Group, Student, Payment, Setting, InsertGroup, InsertStudent, InsertPayment, InsertSetting } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ===== المجموعات =====
export async function getGroups(): Promise<Group[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(groups).orderBy(desc(groups.createdAt));
}

export async function getGroupById(id: number): Promise<Group | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(groups).where(eq(groups.id, id)).limit(1);
  return result[0];
}

export async function createGroup(data: InsertGroup): Promise<Group> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(groups).values(data);
  const groupId = result[0].insertId;
  const created = await getGroupById(groupId);
  if (!created) throw new Error("Failed to create group");
  return created;
}

export async function updateGroup(id: number, data: Partial<InsertGroup>): Promise<Group> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(groups).set(data).where(eq(groups.id, id));
  const updated = await getGroupById(id);
  if (!updated) throw new Error("Failed to update group");
  return updated;
}

export async function deleteGroup(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(groups).where(eq(groups.id, id));
}

// ===== الطلاب =====
export async function getStudentsByGroupId(groupId: number): Promise<Student[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(students).where(eq(students.groupId, groupId)).orderBy(students.serialNumber);
}

export async function getStudentById(id: number): Promise<Student | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(students).where(eq(students.id, id)).limit(1);
  return result[0];
}

export async function createStudent(data: InsertStudent): Promise<Student> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(students).values(data);
  const studentId = result[0].insertId;
  const created = await getStudentById(studentId);
  if (!created) throw new Error("Failed to create student");
  return created;
}

export async function updateStudent(id: number, data: Partial<InsertStudent>): Promise<Student> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(students).set(data).where(eq(students.id, id));
  const updated = await getStudentById(id);
  if (!updated) throw new Error("Failed to update student");
  return updated;
}

export async function deleteStudent(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(students).where(eq(students.id, id));
}

// ===== المدفوعات =====
export async function getPaymentsByStudentId(studentId: number): Promise<Payment[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(payments).where(eq(payments.studentId, studentId)).orderBy(payments.month);
}

export async function getPaymentByStudentAndMonth(studentId: number, month: number, year: number): Promise<Payment | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(payments).where(
    and(eq(payments.studentId, studentId), eq(payments.month, month), eq(payments.year, year))
  ).limit(1);
  return result[0];
}

export async function createOrUpdatePayment(data: InsertPayment): Promise<Payment> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getPaymentByStudentAndMonth(data.studentId, data.month, data.year);
  
  if (existing) {
    await db.update(payments).set(data).where(eq(payments.id, existing.id));
    const updated = await db.select().from(payments).where(eq(payments.id, existing.id)).limit(1);
    return updated[0];
  } else {
    const result = await db.insert(payments).values(data);
    const paymentId = result[0].insertId;
    const created = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
    return created[0];
  }
}

export async function getMonthlyTotalByMonth(month: number, year: number): Promise<{ total: number; count: number }> {
  const db = await getDb();
  if (!db) return { total: 0, count: 0 };
  
  const result = await db.select({
    total: sql<number>`SUM(CAST(${payments.amount} AS DECIMAL(10,2)))`,
    count: sql<number>`COUNT(*)`,
  }).from(payments).where(
    and(eq(payments.month, month), eq(payments.year, year), eq(payments.isPaid, true))
  );
  
  return {
    total: result[0]?.total ? Number(result[0].total) : 0,
    count: result[0]?.count ? Number(result[0].count) : 0,
  };
}

export async function getUnpaidStudents(year: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select({
    student: students,
    group: groups,
    unpaidMonths: sql<number>`COUNT(*)`,
  }).from(students)
    .innerJoin(groups, eq(students.groupId, groups.id))
    .innerJoin(payments, eq(students.id, payments.studentId))
    .where(and(eq(payments.isPaid, false), eq(payments.year, year)))
    .groupBy(students.id);
}

// ===== الإعدادات =====
export async function getSettings(): Promise<Setting | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(settings).limit(1);
  return result[0];
}

export async function updateSettings(data: Partial<InsertSetting>): Promise<Setting> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getSettings();
  if (existing) {
    await db.update(settings).set(data).where(eq(settings.id, existing.id));
    const updated = await getSettings();
    if (!updated) throw new Error("Failed to update settings");
    return updated;
  } else {
    const result = await db.insert(settings).values(data as InsertSetting);
    const settingId = result[0].insertId;
    const created = await db.select().from(settings).where(eq(settings.id, settingId)).limit(1);
    if (!created[0]) throw new Error("Failed to create settings");
    return created[0];
  }
}
