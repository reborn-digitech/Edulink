/**
 * TA-407, the owner's decision of 14 November 2026 (option 1), the two paths a second reader found still open: the
 * cancel of a recorded advance (which wipes the debt) and a salary structure rewritten in place (which changes the
 * gross of everyone paid on it). Own pay is refused where a second person keeps payroll; in a one-person office the
 * write goes ahead and the head is told; the member of staff is told when their salary changes; the audit carries the
 * amounts before and after.
 *
 * Two scratch ZZ schools of this suite's own, PAYROLL on: Duo has an ADMIN and an ACCOUNTS clerk (two writers), a
 * head and a teacher; Solo has one ADMIN, a head and a teacher. Both removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { cancelAdvance, recordAdvance, saveSalary, saveStructure, savePayrollSettings } from "@/lib/payroll";
import { POST as cancelPost } from "@/app/api/v1/admin/payroll/advances/cancel/route";
import { POST as structurePost } from "@/app/api/v1/admin/payroll/structures/route";
import type { SalaryStructureSave } from "@edulink/contracts";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-5);
const ids = {
  duo: "", solo: "",
  dAdmin: "", dAdminM: "", dAccounts: "", dAccountsM: "", dHead: "", dTeacher: "", dTeacherM: "", dStructure: "",
  sAdmin: "", sAdminM: "", sHead: "", sTeacher: "", sTeacherM: "", sStructure: "",
};

async function as(userId: string, role: string, schoolId: string) {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, { schoolId, role: role as never });
  return (await getSession())!;
}
const req = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const salary = (membershipId: string, structureId: string, basicPaise: number) => ({
  membershipId,
  structureId,
  effectiveFrom: "2026-04-01",
  basicPaise,
  overrides: {},
  pfUan: "",
  esiNumber: "",
  pan: "",
  bankAccount: "",
  bankIfsc: "",
  bankName: "",
  paymentMode: "CASH" as const,
});
/** The structure with its house rent at `hraBasisPoints` of basic (1000 = 10 %). */
const shape = (id: string, hraBasisPoints: number, hraLabel = ""): SalaryStructureSave => ({
  id,
  name: `ZZ TA407b ${STAMP}`,
  components: [
    { code: "BASIC", label: "", formula: "FIXED", value: 0 },
    { code: "HRA", label: hraLabel, formula: "PERCENT_OF_BASIC", value: hraBasisPoints },
    { code: "TDS", label: "", formula: "FIXED", value: 0 },
  ],
});
const hraOf = async (structureId: string) => (await db.salaryComponent.findFirstOrThrow({ where: { structureId, code: "HRA" }, select: { value: true } })).value;
const notes = (userId: string, schoolId: string, titleKey: string) => db.notification.findMany({ where: { userId, schoolId, titleKey }, orderBy: { createdAt: "asc" }, select: { body: true, bodyKey: true } });
const lastAudit = async (schoolId: string, action: string) => {
  const row = await db.auditLog.findFirstOrThrow({ where: { schoolId, action }, orderBy: { createdAt: "desc" }, select: { meta: true } });
  return (typeof row.meta === "string" ? JSON.parse(row.meta) : row.meta) as Record<string, unknown>;
};

beforeAll(async () => {
  const mk = (tag: string) => db.school.create({ data: { name: `ZZ TA407b ${tag} ${STAMP}`, slug: `zz-ta407b-${tag.toLowerCase()}-${STAMP}`, code: `Z4B${tag[0]}${SUFFIX}`, contactEmail: `zz-ta407b-${tag.toLowerCase()}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } });
  ids.duo = (await mk("Duo")).id;
  ids.solo = (await mk("Solo")).id;
  await db.schoolModule.createMany({ data: [{ schoolId: ids.duo, module: "PAYROLL" }, { schoolId: ids.solo, module: "PAYROLL" }] });
  const user = (who: string) => db.user.create({ data: { name: `ZZ TA407b ${who}`, email: `zz-ta407b-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
  const mem = (userId: string, schoolId: string, role: string) => db.membership.create({ data: { userId, schoolId, role, status: "ACTIVE" }, select: { id: true } });
  const [da, dc, dh, dt, sa, sh, st] = await Promise.all(["DuoAdmin", "DuoAccounts", "DuoHead", "DuoTeacher", "SoloAdmin", "SoloHead", "SoloTeacher"].map(user));
  Object.assign(ids, { dAdmin: da!.id, dAccounts: dc!.id, dHead: dh!.id, dTeacher: dt!.id, sAdmin: sa!.id, sHead: sh!.id, sTeacher: st!.id });
  ids.dAdminM = (await mem(ids.dAdmin, ids.duo, "ADMIN")).id;
  ids.dAccountsM = (await mem(ids.dAccounts, ids.duo, "ACCOUNTS")).id;
  await mem(ids.dHead, ids.duo, "PRINCIPAL");
  ids.dTeacherM = (await mem(ids.dTeacher, ids.duo, "TEACHER")).id;
  ids.sAdminM = (await mem(ids.sAdmin, ids.solo, "ADMIN")).id;
  await mem(ids.sHead, ids.solo, "PRINCIPAL");
  ids.sTeacherM = (await mem(ids.sTeacher, ids.solo, "TEACHER")).id;
  const structure = async (ctx: Awaited<ReturnType<typeof as>>) => {
    await savePayrollSettings(ctx, { pfEnabled: false, pfOnFullBasic: false, esiEnabled: false, ptState: "NONE", employerName: "ZZ TA407b Trust", pfEstablishmentCode: "", esiEmployerCode: "" });
    const made = await saveStructure(ctx, { name: `ZZ TA407b ${STAMP}`, components: [{ code: "BASIC", label: "", formula: "FIXED", value: 0 }, { code: "HRA", label: "", formula: "PERCENT_OF_BASIC", value: 1000 }, { code: "TDS", label: "", formula: "FIXED", value: 0 }] });
    return made.id;
  };
  ids.dStructure = await structure(await as(ids.dAdmin, "ADMIN", ids.duo));
  ids.sStructure = await structure(await as(ids.sAdmin, "ADMIN", ids.solo));
  // Duo: the clerk sets the admin's salary (the admin may not), the admin the teacher's; Solo: the lone admin both.
  await saveSalary(await as(ids.dAccounts, "ACCOUNTS", ids.duo), salary(ids.dAdminM, ids.dStructure, 3_000_000));
  await saveSalary(await as(ids.dAdmin, "ADMIN", ids.duo), salary(ids.dTeacherM, ids.dStructure, 2_000_000));
  await saveSalary(await as(ids.sAdmin, "ADMIN", ids.solo), salary(ids.sAdminM, ids.sStructure, 3_000_000));
  await saveSalary(await as(ids.sAdmin, "ADMIN", ids.solo), salary(ids.sTeacherM, ids.sStructure, 1_000_000));
}, 60_000);

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const people = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  const userIds = people.map((p) => p.id);
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.notification.deleteMany({ where: { OR: [{ schoolId: { in: [ids.duo, ids.solo] } }, { userId: { in: userIds } }] } });
  await db.school.deleteMany({ where: { id: { in: [ids.duo, ids.solo] } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("TA-407: cancelling a recorded advance is a write to it", () => {
  it("TA-407: the ADMIN cannot cancel the advance the clerk recorded for them (403 through the door, the advance still recorded) while the clerk can", async () => {
    const adv = await recordAdvance(await as(ids.dAccounts, "ACCOUNTS", ids.duo), { membershipId: ids.dAdminM, amountPaise: 1_000_000, monthlyRecoveryPaise: 100_000, reason: "ZZ TA-407 cancel" });
    await as(ids.dAdmin, "ADMIN", ids.duo);
    const res = await cancelPost(req("/api/v1/admin/payroll/advances/cancel", { advanceId: adv.id, note: "ZZ TA-407 entered by mistake" }));
    expect(res.status).toBe(403);
    expect((await db.staffAdvance.findUniqueOrThrow({ where: { id: adv.id }, select: { status: true } })).status).toBe("RECORDED");
    await expect(cancelAdvance(await as(ids.dAdmin, "ADMIN", ids.duo), { advanceId: adv.id, note: "ZZ TA-407" })).rejects.toMatchObject({ message: "payroll.refuseOwnPay" });
    const done = await cancelAdvance(await as(ids.dAccounts, "ACCOUNTS", ids.duo), { advanceId: adv.id, note: "ZZ TA-407 entered by mistake" });
    expect(done.status).toBe("CANCELLED");
    expect(await lastAudit(ids.duo, "payroll.advance.cancel")).toMatchObject({ amountPaise: 1_000_000, ownPay: false });
  });

  it("TA-407: the lone ADMIN cancels their own advance, and the head is told with the amount", async () => {
    const adv = await recordAdvance(await as(ids.sAdmin, "ADMIN", ids.solo), { membershipId: ids.sAdminM, amountPaise: 400_000, monthlyRecoveryPaise: 100_000, reason: "ZZ TA-407 solo cancel" });
    const done = await cancelAdvance(await as(ids.sAdmin, "ADMIN", ids.solo), { advanceId: adv.id, note: "ZZ TA-407 entered by mistake" });
    expect(done.status).toBe("CANCELLED");
    const told = await notes(ids.sHead, ids.solo, "payroll.notifyOwnPayTitle");
    expect(told.at(-1)!.bodyKey).toBe("payroll.notifyOwnAdvanceCancelBody");
    expect(told.at(-1)!.body).toContain("4,000");
    expect(await lastAudit(ids.solo, "payroll.advance.cancel")).toMatchObject({ amountPaise: 400_000, ownPay: true });
  });
});

describe("TA-407: a salary structure rewritten in place", () => {
  it("TA-407: the ADMIN paid on a structure cannot raise its amounts (403 through the door, nothing changed) while the clerk can; a change of label alone is not a change of pay", async () => {
    await as(ids.dAdmin, "ADMIN", ids.duo);
    const res = await structurePost(req("/api/v1/admin/payroll/structures", shape(ids.dStructure, 5000)));
    expect(res.status).toBe(403);
    expect(await hraOf(ids.dStructure)).toBe(1000);
    await expect(saveStructure(await as(ids.dAdmin, "ADMIN", ids.duo), shape(ids.dStructure, 5000))).rejects.toMatchObject({ message: "payroll.refuseOwnPay" });
    const before = (await notes(ids.dTeacher, ids.duo, "payroll.notifyPayChangedTitle")).length;
    const relabelled = await saveStructure(await as(ids.dAdmin, "ADMIN", ids.duo), shape(ids.dStructure, 1000, "Rent"));
    expect(relabelled.components.find((c) => c.code === "HRA")?.label).toBe("Rent");
    expect((await notes(ids.dTeacher, ids.duo, "payroll.notifyPayChangedTitle")).length).toBe(before);
  });

  it("TA-407: the clerk's change of the structure tells everyone paid on it the gross before and after, and the audit carries the amounts before and after", async () => {
    const teacherBefore = (await notes(ids.dTeacher, ids.duo, "payroll.notifyPayChangedTitle")).length;
    const adminBefore = (await notes(ids.dAdmin, ids.duo, "payroll.notifyPayChangedTitle")).length;
    await saveStructure(await as(ids.dAccounts, "ACCOUNTS", ids.duo), shape(ids.dStructure, 2000));
    expect(await hraOf(ids.dStructure)).toBe(2000);
    const teacher = await notes(ids.dTeacher, ids.duo, "payroll.notifyPayChangedTitle");
    expect(teacher.length).toBe(teacherBefore + 1);
    expect(teacher.at(-1)!.bodyKey).toBe("payroll.notifyPayStructureBody");
    // ₹20,000 basic: 10 % house rent made ₹22,000 a month, 20 % makes ₹24,000.
    expect(teacher.at(-1)!.body).toContain("22,000");
    expect(teacher.at(-1)!.body).toContain("24,000");
    const admin = await notes(ids.dAdmin, ids.duo, "payroll.notifyPayChangedTitle");
    expect(admin.length).toBe(adminBefore + 1);
    expect(admin.at(-1)!.body).toContain("36,000");
    // The clerk is on no structure here and is told nothing of their own write.
    expect(await notes(ids.dAccounts, ids.duo, "payroll.notifyPayChangedTitle")).toHaveLength(0);
    const meta = await lastAudit(ids.duo, "payroll.structure.save");
    expect(meta).toMatchObject({ created: false, staffChanged: 2, ownPay: false });
    expect(meta.componentsBefore).toEqual(expect.arrayContaining([{ code: "HRA", formula: "PERCENT_OF_BASIC", value: 1000 }]));
    expect(meta.componentsAfter).toEqual(expect.arrayContaining([{ code: "HRA", formula: "PERCENT_OF_BASIC", value: 2000 }]));
  });

  it("TA-407: the lone ADMIN changes the structure they are paid on; the head is told of their own pay and the teacher of theirs", async () => {
    await saveStructure(await as(ids.sAdmin, "ADMIN", ids.solo), shape(ids.sStructure, 2000));
    const head = await notes(ids.sHead, ids.solo, "payroll.notifyOwnPayTitle");
    expect(head.at(-1)!.bodyKey).toBe("payroll.notifyOwnStructureBody");
    // ₹30,000 basic: ₹33,000 a month before, ₹36,000 now.
    expect(head.at(-1)!.body).toContain("33,000");
    expect(head.at(-1)!.body).toContain("36,000");
    const teacher = await notes(ids.sTeacher, ids.solo, "payroll.notifyPayChangedTitle");
    expect(teacher.at(-1)!.bodyKey).toBe("payroll.notifyPayStructureBody");
    expect(teacher.at(-1)!.body).toContain("11,000");
    expect(teacher.at(-1)!.body).toContain("12,000");
    // The admin is not told of their own write; the head is.
    expect((await notes(ids.sAdmin, ids.solo, "payroll.notifyPayChangedTitle")).map((n) => n.bodyKey)).not.toContain("payroll.notifyPayStructureBody");
    expect(await lastAudit(ids.solo, "payroll.structure.save")).toMatchObject({ staffChanged: 2, ownPay: true });
  });
});
