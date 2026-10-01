/**
 * The directory's row menu, as the phone reaches it: six doors to rules the
 * web already had as server actions (admin/people/actions.ts). What is
 * proved here is the door — who is let through, what a body that does not
 * parse gets, another school's id — and that each act is the library's: a
 * legal name corrected and the audit row written, a date of birth set and
 * cleared, a teacher's subjects replaced as a set, access paused and
 * restored, a pupil removed only when nothing was recorded against them,
 * with what stood in the way named as issues. Every row is a ZZ row made
 * here and deleted afterwards.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { POST as legalNamePost } from "@/app/api/v1/admin/people/[membershipId]/legal-name/route";
import { POST as birthdatePost } from "@/app/api/v1/admin/people/[membershipId]/birthdate/route";
import { POST as subjectsPost } from "@/app/api/v1/admin/people/[membershipId]/subjects/route";
import { POST as pausePost } from "@/app/api/v1/admin/people/[membershipId]/pause/route";
import { POST as restorePost } from "@/app/api/v1/admin/people/[membershipId]/restore/route";
import { POST as removePost } from "@/app/api/v1/admin/people/[membershipId]/remove/route";

vi.mock("next/cache", () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined }));

const db = new PrismaClient();
const STAMP = Date.now();
let schoolId = "";
let otherSchoolId = "";
let classId = "";
const who: Record<string, { userId: string; membershipId: string }> = {};

const json = (body: unknown) => new Request("http://localhost/api/v1/admin/people/x", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const bare = () => new Request("http://localhost/api/v1/admin/people/x", { method: "POST" });
const p = (membershipId: string) => ({ params: Promise.resolve({ membershipId }) });

async function as(name: "admin" | "admin2" | "head" | "teacher" | "pupil" | "elsewhere" | null) {
  __resetCookies();
  if (!name) return;
  const role = { admin: "ADMIN", admin2: "ADMIN", head: "PRINCIPAL", teacher: "TEACHER", pupil: "STUDENT", elsewhere: "ADMIN" }[name] as "ADMIN" | "PRINCIPAL" | "TEACHER" | "STUDENT";
  await createSession(who[name]!.userId, { schoolId: name === "elsewhere" ? otherSchoolId : schoolId, role });
}

beforeAll(async () => {
  const make = (n: string) => db.school.create({ data: { name: `ZZ Actions ${n} ${STAMP}`, slug: `zz-actions-${n}-${STAMP}`, code: `ZA${n}${String(STAMP).slice(-6)}`, contactEmail: `zz-actions-${n}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } });
  schoolId = (await make("a")).id;
  otherSchoolId = (await make("b")).id;
  for (const [name, role, school] of [["admin", "ADMIN", schoolId], ["admin2", "ADMIN", schoolId], ["head", "PRINCIPAL", schoolId], ["teacher", "TEACHER", schoolId], ["pupil", "STUDENT", schoolId], ["attended", "STUDENT", schoolId], ["elsewhere", "ADMIN", otherSchoolId]] as const) {
    const user = await db.user.create({ data: { name: `ZZ Actions ${name}`, email: `zz-actions-${name}-${STAMP}@test.invalid`, prefs: "{}", ...(role === "STUDENT" ? { birthdate: new Date("2015-02-02T00:00:00Z"), isMinor: true } : {}) }, select: { id: true } });
    const membership = await db.membership.create({ data: { userId: user.id, schoolId: school, role, status: "ACTIVE", ...(role === "STUDENT" ? { studentCode: `STU-ZZA${name[0]!.toUpperCase()}-${String(STAMP).slice(-4)}` } : {}) }, select: { id: true } });
    who[name] = { userId: user.id, membershipId: membership.id };
  }
  const klass = await db.class.create({ data: { schoolId, name: `ZZ Actions 4A ${STAMP}`, gradeLevel: "4", joinCode: `ZAC-${String(STAMP).slice(-4)}` }, select: { id: true } });
  classId = klass.id;
  for (const name of ["pupil", "attended"]) await db.enrollment.create({ data: { classId, schoolId, studentMembershipId: who[name]!.membershipId, status: "ACTIVE" } });
  // One register mark: the pupil who attended was here, and cannot be removed.
  const session = await db.attendanceSession.create({ data: { schoolId, classId, dateKey: "2026-09-01", takenByMembershipId: who.teacher!.membershipId }, select: { id: true } });
  await db.attendanceRecord.create({ data: { sessionId: session.id, schoolId, studentMembershipId: who.attended!.membershipId, status: "PRESENT", clientId: `zz-actions-${STAMP}` } });
});

afterAll(async () => {
  __resetCookies();
  const userIds = Object.values(who).map((row) => row.userId);
  const schools = [schoolId, otherSchoolId].filter(Boolean);
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.notification.deleteMany({ where: { schoolId: { in: schools } } });
  await db.auditLog.deleteMany({ where: { schoolId: { in: schools } } });
  await db.school.deleteMany({ where: { id: { in: schools } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("the gates", () => {
  it("signed out is a 401 on all six", async () => {
    await as(null);
    const id = who.pupil!.membershipId;
    for (const res of [await legalNamePost(json({ name: "ZZ X", reason: "SPELLING" }), p(id)), await birthdatePost(json({ dateKey: null }), p(id)), await subjectsPost(json({ subjects: [] }), p(id)), await pausePost(json({ reason: "zz" }), p(id)), await restorePost(bare(), p(id)), await removePost(bare(), p(id))]) {
      expect(res.status).toBe(401);
    }
  });

  it("the head, a teacher and a pupil reach none of them; a body that does not parse is a 422", async () => {
    const id = who.pupil!.membershipId;
    for (const name of ["head", "teacher", "pupil"] as const) {
      await as(name);
      for (const res of [await legalNamePost(json({ name: "ZZ X", reason: "SPELLING" }), p(id)), await birthdatePost(json({ dateKey: null }), p(id)), await subjectsPost(json({ subjects: [] }), p(who.teacher!.membershipId)), await pausePost(json({ reason: "zz" }), p(id)), await restorePost(bare(), p(id)), await removePost(bare(), p(id))]) {
        expect(res.status, name).toBe(403);
      }
    }
    await as("admin");
    for (const res of [await legalNamePost(bare(), p(id)), await legalNamePost(json({ name: "ZZ X", reason: "BECAUSE" }), p(id)), await birthdatePost(json({ dateKey: "02/02/2015" }), p(id)), await subjectsPost(json({ subjects: "Maths" }), p(id)), await pausePost(bare(), p(id))]) {
      expect(res.status).toBe(422);
    }
    expect((await db.membership.findUniqueOrThrow({ where: { id } })).status).toBe("ACTIVE");
  });

  it("another school's office finds nobody, and changes nothing", async () => {
    await as("elsewhere");
    const pupil = who.pupil!.membershipId;
    for (const res of [await legalNamePost(json({ name: "ZZ Elsewhere", reason: "SPELLING" }), p(pupil)), await birthdatePost(json({ dateKey: "2014-01-01" }), p(pupil)), await subjectsPost(json({ subjects: ["ZZ Art"] }), p(who.teacher!.membershipId)), await pausePost(json({ reason: "zz probe" }), p(pupil)), await restorePost(bare(), p(pupil)), await removePost(bare(), p(pupil))]) {
      expect(res.status).toBe(422);
    }
    expect((await db.user.findUniqueOrThrow({ where: { id: who.pupil!.userId } })).name).toBe("ZZ Actions pupil");
    expect((await db.membership.findUniqueOrThrow({ where: { id: pupil } })).status).toBe("ACTIVE");
  });
});

describe("the acts", () => {
  it("a legal name is corrected for a coded reason and the audit row keeps the reason; a name that is not one is a 422", async () => {
    await as("admin");
    const id = who.pupil!.membershipId;
    expect((await legalNamePost(json({ name: "  ZZ  Actions   Pupil-Corrected ", reason: "ADMISSION_RECORD" }), p(id))).status).toBe(200);
    expect((await db.user.findUniqueOrThrow({ where: { id: who.pupil!.userId } })).name).toBe("ZZ Actions Pupil-Corrected");
    const row = await db.auditLog.findFirst({ where: { schoolId, action: "user.legalname.set", targetId: id }, orderBy: { createdAt: "desc" } });
    expect(row).not.toBeNull();
    expect(String(row!.meta)).toContain("ADMISSION_RECORD");
    const bad = await legalNamePost(json({ name: "ZZ 123", reason: "SPELLING" }), p(id));
    expect(bad.status).toBe(422);
    expect((await bad.json()).error).toBe("Enter the name in letters, 2 to 120 characters, with no numbers or symbols.");
  });

  it("a date of birth is set, refused in the future, and cleared with null", async () => {
    await as("admin");
    const id = who.pupil!.membershipId;
    expect((await birthdatePost(json({ dateKey: "2014-11-30" }), p(id))).status).toBe(200);
    expect((await db.user.findUniqueOrThrow({ where: { id: who.pupil!.userId } })).birthdate?.toISOString().slice(0, 10)).toBe("2014-11-30");
    expect((await birthdatePost(json({ dateKey: "2999-01-01" }), p(id))).status).toBe(422);
    expect((await birthdatePost(json({ dateKey: null }), p(id))).status).toBe(200);
    expect((await db.user.findUniqueOrThrow({ where: { id: who.pupil!.userId } })).birthdate).toBeNull();
  });

  it("a teacher's subjects are replaced as a set, trimmed and de-duplicated; a pupil has none to set", async () => {
    await as("admin");
    const id = who.teacher!.membershipId;
    expect((await subjectsPost(json({ subjects: [" Mathematics ", "Mathematics", "", "Physics"] }), p(id))).status).toBe(200);
    expect(JSON.parse((await db.membership.findUniqueOrThrow({ where: { id } })).subjects ?? "[]")).toEqual(["Mathematics", "Physics"]);
    expect((await subjectsPost(json({ subjects: ["Maths"] }), p(who.pupil!.membershipId))).status).toBe(422);
  });

  it("access is paused with a reason and restored; a blank reason, the office's own access and somebody not paused are 422s", async () => {
    await as("admin");
    const id = who.pupil!.membershipId;
    expect((await pausePost(json({ reason: "  " }), p(id))).status).toBe(422);
    expect((await pausePost(json({ reason: "ZZ fees unpaid" }), p(who.admin!.membershipId))).status).toBe(422);
    expect((await restorePost(bare(), p(id))).status).toBe(422);
    expect((await pausePost(json({ reason: "ZZ fees unpaid" }), p(id))).status).toBe(200);
    expect(await db.membership.findUniqueOrThrow({ where: { id } })).toMatchObject({ status: "SUSPENDED", suspendedReason: "ZZ fees unpaid" });
    expect((await restorePost(bare(), p(id))).status).toBe(200);
    expect((await db.membership.findUniqueOrThrow({ where: { id } })).status).toBe("ACTIVE");
  });

  it("⚠ a pupil with a register mark is not removed, and the 422 names the mark; a teacher is never removed; a pupil nothing was recorded against is", async () => {
    await as("admin");
    const attended = who.attended!.membershipId;
    const refused = await removePost(bare(), p(attended));
    expect(refused.status).toBe(422);
    const body = (await refused.json()) as { error: string; issues?: Record<string, string> };
    expect(body.issues).toEqual({ attendance: "1 day of attendance" });
    expect(await db.membership.count({ where: { id: attended } })).toBe(1);
    expect((await removePost(bare(), p(who.teacher!.membershipId))).status).toBe(422);
    expect(await db.membership.count({ where: { id: who.teacher!.membershipId } })).toBe(1);
    const pupil = who.pupil!.membershipId;
    expect((await removePost(bare(), p(pupil))).status).toBe(200);
    expect(await db.membership.count({ where: { id: pupil } })).toBe(0);
  });
});
