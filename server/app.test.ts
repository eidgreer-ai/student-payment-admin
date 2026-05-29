import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";

// Mock context
const createMockContext = () => ({
  user: null,
  req: { protocol: "https", headers: {} } as any,
  res: { clearCookie: () => {} } as any,
});

describe("App Router Tests", () => {
  let caller: any;

  beforeAll(() => {
    caller = appRouter.createCaller(createMockContext());
  });

  describe("Auth Routes", () => {
    it("should handle login with correct password", async () => {
      const result = await caller.auth.login({ password: "admin123" });
      expect(result).toBeDefined();
    });

    it("should reject login with incorrect password", async () => {
      try {
        await caller.auth.login({ password: "wrongpassword" });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });

    it("should get current user", async () => {
      const result = await caller.auth.me();
      expect(result).toBeNull();
    });
  });

  describe("Groups Routes", () => {
    let groupId: number;

    it("should list groups", async () => {
      const groups = await caller.groups.list();
      expect(Array.isArray(groups)).toBe(true);
    });

    it("should create a new group", async () => {
      const group = await caller.groups.create({
        name: "المجموعة الأولى",
        description: "وصف المجموعة",
      });
      groupId = group.id;
      expect(group.name).toBe("المجموعة الأولى");
      expect(group.id).toBeGreaterThan(0);
    });

    it("should get group by id", async () => {
      const group = await caller.groups.getById({ id: groupId });
      expect(group?.name).toBe("المجموعة الأولى");
    });

    it("should update group", async () => {
      const updated = await caller.groups.update({
        id: groupId,
        name: "المجموعة المحدثة",
        description: "وصف محدث",
      });
      expect(updated.name).toBe("المجموعة المحدثة");
    });

    it("should delete group", async () => {
      await caller.groups.delete({ id: groupId });
      const group = await caller.groups.getById({ id: groupId });
      expect(group).toBeUndefined();
    });
  });

  describe("Students Routes", () => {
    let groupId: number;
    let studentId: number;

    beforeAll(async () => {
      const group = await caller.groups.create({
        name: "مجموعة الطلاب",
        description: "لاختبار الطلاب",
      });
      groupId = group.id;
    });

    it("should create a new student", async () => {
      const student = await caller.students.create({
        groupId,
        serialNumber: 1,
        name: "أحمد محمد",
      });
      studentId = student.id;
      expect(student.name).toBe("أحمد محمد");
      expect(student.serialNumber).toBe(1);
    });

    it("should list students by group", async () => {
      const students = await caller.students.listByGroup({ groupId });
      expect(Array.isArray(students)).toBe(true);
      expect(students.length).toBeGreaterThan(0);
    });

    it("should get student by id", async () => {
      const student = await caller.students.getById({ id: studentId });
      expect(student?.name).toBe("أحمد محمد");
    });

    it("should update student", async () => {
      const updated = await caller.students.update({
        id: studentId,
        name: "أحمد علي",
      });
      expect(updated.name).toBe("أحمد علي");
    });

    it("should delete student", async () => {
      await caller.students.delete({ id: studentId });
      const student = await caller.students.getById({ id: studentId });
      expect(student).toBeUndefined();
    });

    afterAll(async () => {
      await caller.groups.delete({ id: groupId });
    });
  });

  describe("Payments Routes", () => {
    let groupId: number;
    let studentId: number;
    const currentYear = new Date().getFullYear();

    beforeAll(async () => {
      const group = await caller.groups.create({
        name: "مجموعة المدفوعات",
      });
      groupId = group.id;

      const student = await caller.students.create({
        groupId,
        serialNumber: 1,
        name: "فاطمة أحمد",
      });
      studentId = student.id;
    });

    it("should create or update payment", async () => {
      const payment = await caller.payments.createOrUpdate({
        studentId,
        month: 8,
        year: currentYear,
        amount: "100",
        isPaid: true,
      });
      expect(payment.isPaid).toBe(true);
      expect(payment.amount).toBe("100.00");
    });

    it("should get payment by student and month", async () => {
      const payment = await caller.payments.getByStudentAndMonth({
        studentId,
        month: 8,
        year: currentYear,
      });
      expect(payment?.isPaid).toBe(true);
    });

    it("should list payments by student", async () => {
      const payments = await caller.payments.listByStudent({ studentId });
      expect(Array.isArray(payments)).toBe(true);
    });

    it("should get monthly total", async () => {
      const total = await caller.payments.monthlyTotal({
        month: 8,
        year: currentYear,
      });
      expect(total.total).toBeGreaterThanOrEqual(0);
      expect(total.count).toBeGreaterThanOrEqual(0);
    });

    afterAll(async () => {
      await caller.students.delete({ id: studentId });
      await caller.groups.delete({ id: groupId });
    });
  });

  describe("Settings Routes", () => {
    it("should get settings", async () => {
      const settings = await caller.settings.get();
      expect(settings.theme).toBeDefined();
    });

    it("should update theme", async () => {
      const updated = await caller.settings.updateTheme({ theme: "dark" });
      expect(updated.theme).toBe("dark");

      const updated2 = await caller.settings.updateTheme({ theme: "light" });
      expect(updated2.theme).toBe("light");
    });

    it("should update password", async () => {
      try {
        await caller.settings.updatePassword({
          currentPassword: "admin123",
          newPassword: "newpassword123",
        });
        // Verify new password works
        await caller.auth.login({ password: "newpassword123" });
        // Reset to original
        await caller.settings.updatePassword({
          currentPassword: "newpassword123",
          newPassword: "admin123",
        });
      } catch (error: any) {
        expect.fail(`Password update failed: ${error.message}`);
      }
    });
  });
});
