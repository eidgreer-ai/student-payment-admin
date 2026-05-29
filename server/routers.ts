import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

// Custom procedure for password authentication
const passwordProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const settings = await db.getSettings();
  if (!settings) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Settings not found" });
  }
  return next({ ctx: { ...ctx, settings } });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    login: publicProcedure
      .input(z.object({ password: z.string() }))
      .mutation(async ({ input }) => {
        const settings = await db.getSettings();
        if (!settings || settings.adminPassword !== input.password) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "كلمة المرور غير صحيحة" });
        }
        return { success: true };
      }),
  }),

  // ===== المجموعات =====
  groups: router({
    list: publicProcedure.query(async () => {
      return await db.getGroups();
    }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getGroupById(input.id);
      }),
    create: publicProcedure
      .input(z.object({ name: z.string().min(1), description: z.string().optional() }))
      .mutation(async ({ input }) => {
        return await db.createGroup({
          name: input.name,
          description: input.description,
        });
      }),
    update: publicProcedure
      .input(z.object({ id: z.number(), name: z.string().min(1), description: z.string().optional() }))
      .mutation(async ({ input }) => {
        return await db.updateGroup(input.id, {
          name: input.name,
          description: input.description,
        });
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteGroup(input.id);
        return { success: true };
      }),
  }),

  // ===== الطلاب =====
  students: router({
    listByGroup: publicProcedure
      .input(z.object({ groupId: z.number() }))
      .query(async ({ input }) => {
        return await db.getStudentsByGroupId(input.groupId);
      }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getStudentById(input.id);
      }),
    create: publicProcedure
      .input(z.object({
        groupId: z.number(),
        serialNumber: z.number(),
        name: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        return await db.createStudent({
          groupId: input.groupId,
          serialNumber: input.serialNumber,
          name: input.name,
        });
      }),
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        serialNumber: z.number().optional(),
        name: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateStudent(id, data);
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteStudent(input.id);
        return { success: true };
      }),
  }),

  // ===== المدفوعات =====
  payments: router({
    listByStudent: publicProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPaymentsByStudentId(input.studentId);
      }),
    getByStudentAndMonth: publicProcedure
      .input(z.object({ studentId: z.number(), month: z.number(), year: z.number() }))
      .query(async ({ input }) => {
        return await db.getPaymentByStudentAndMonth(input.studentId, input.month, input.year);
      }),
    createOrUpdate: publicProcedure
      .input(z.object({
        studentId: z.number(),
        month: z.number(),
        year: z.number(),
        amount: z.string(),
        isPaid: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        return await db.createOrUpdatePayment({
          studentId: input.studentId,
          month: input.month,
          year: input.year,
          amount: input.amount,
          isPaid: input.isPaid,
          paidDate: input.isPaid ? new Date() : null,
        });
      }),
    monthlyTotal: publicProcedure
      .input(z.object({ month: z.number(), year: z.number() }))
      .query(async ({ input }) => {
        return await db.getMonthlyTotalByMonth(input.month, input.year);
      }),
    unpaidStudents: publicProcedure
      .input(z.object({ year: z.number() }))
      .query(async ({ input }) => {
        return await db.getUnpaidStudents(input.year);
      }),
  }),

  // ===== الإعدادات =====
  settings: router({
    get: publicProcedure.query(async () => {
      const settings = await db.getSettings();
      if (!settings) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Settings not found" });
      }
      return { theme: settings.theme };
    }),
    updatePassword: publicProcedure
      .input(z.object({ currentPassword: z.string(), newPassword: z.string().min(1) }))
      .mutation(async ({ input }) => {
        const settings = await db.getSettings();
        if (!settings || settings.adminPassword !== input.currentPassword) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "كلمة المرور الحالية غير صحيحة" });
        }
        return await db.updateSettings({ adminPassword: input.newPassword });
      }),
    updateTheme: publicProcedure
      .input(z.object({ theme: z.enum(["light", "dark"]) }))
      .mutation(async ({ input }) => {
        return await db.updateSettings({ theme: input.theme });
      }),
  }),
});

export type AppRouter = typeof appRouter;
