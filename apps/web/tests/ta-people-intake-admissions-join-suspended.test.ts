/**
 * TA-178 (testing analysis of 13 November 2026, Medium, Security): a
 * teacher's approval of a join request lifted a pupil's suspension.
 *
 * Restoring a paused membership is the admin's alone (reinstateMembership,
 * membership.ts). But a suspended pupil keeps a session, could type a class's
 * code, and the class's teacher saw an ordinary request (the queue's "on the
 * roll" flag reads ACTIVE only); approving it ran admit(), which wrote the
 * membership ACTIVE, cleared the stamp and the reason and issued a new code,
 * audited as student.join with no membership.reinstate row.
 *
 * Now a pupil paused at a school cannot file a join request there (a sentence
 * sends them to the office), a teacher's approval of a request filed before
 * the pause is refused with the admin-only sentence and leaves the pause as it
 * is, and the office's approval, which still brings them back as before, is
 * written down as a reinstatement too.
 *
 * One ZZ school of this suite's own with a class, its teacher, an admin and a
 * paused pupil; removed afterwards with the people made here.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { joinWithAccount } from "@/lib/join";
import { decideJoin, requestToJoin } from "@/lib/join-requests";
import { AccessError } from "@/lib/access-error";
import { translator } from "@/lib/i18n/dictionary";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-tapia-join-${who}-${STAMP}@test.invalid`;
const t = translator("en");
const ids: Record<string, string> = {};
const CLASS_CODE = `ZZJ${String(STAMP).slice(-7)}`;

async function as(who: string, role: string | null): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids[who]!, role ? { schoolId: ids.school!, role: role as never } : { schoolId: null, role: null });
  const ctx = await getSession();
  if (!ctx) throw new Error(`no session for ${who}`);
  return ctx;
}

async function pause(): Promise<void> {
  await db.membership.update({ where: { id: ids.pupilM! }, data: { status: "SUSPENDED", suspendedAt: new Date(), suspendedReason: "ZZ TAPIA paused by the office" } });
}

beforeAll(async () => {
  ids.school = (
    await db.school.create({
      data: { name: `ZZ TAPIA Join ${STAMP}`, slug: `zz-tapia-join-${STAMP}`, code: `ZPJ${String(STAMP).slice(-6)}`, contactEmail: MAIL("contact"), timezone: "Asia/Kolkata", isTestFixture: true },
      select: { id: true },
    })
  ).id;
  const user = async (who: string) => {
    ids[who] = (await db.user.create({ data: { name: `ZZ TAPIA ${who}`, email: MAIL(who), prefs: "{}", birthdate: who === "pupil" ? new Date("2014-04-04T00:00:00Z") : null }, select: { id: true } })).id;
  };
  const member = async (who: string, role: string) => {
    ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: ids.school!, role, status: "ACTIVE", studentCode: role === "STUDENT" ? `STU-ZZPJ-${String(STAMP).slice(-6)}` : null }, select: { id: true } })).id;
  };
  await user("admin");
  await member("admin", "ADMIN");
  await user("teacher");
  await member("teacher", "TEACHER");
  await user("pupil");
  await member("pupil", "STUDENT");
  ids.class = (await db.class.create({ data: { schoolId: ids.school!, name: `ZZ TAPIA Class ${STAMP}`, gradeLevel: "5", joinCode: CLASS_CODE }, select: { id: true } })).id;
  await db.classTeacher.create({ data: { classId: ids.class!, schoolId: ids.school!, teacherMembershipId: ids.teacherM!, role: "LEAD" } });
  await pause();
}, 60_000);

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = await db.user.findMany({ where: { email: { startsWith: "zz-tapia-join-", endsWith: `-${STAMP}@test.invalid` } }, select: { id: true } });
  const userIds = users.map((u) => u.id);
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.notification.deleteMany({ where: { userId: { in: userIds } } });
  if (ids.school) {
    await db.joinRequest.deleteMany({ where: { schoolId: ids.school } });
    await db.guardianship.deleteMany({ where: { studentSchoolId: ids.school } });
    await db.auditLog.deleteMany({ where: { OR: [{ schoolId: ids.school }, { actorUserId: { in: userIds } }] } });
    await db.school.deleteMany({ where: { id: ids.school } });
  }
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("TA-178: a paused pupil's way back is the office's", () => {
  it("TA-178: a paused pupil typing the class's code is refused with a sentence, and nothing is filed", async () => {
    const result = await joinWithAccount(await as("pupil", null), CLASS_CODE, t);
    expect(result.ok).toBe(false);
    expect(await db.joinRequest.count({ where: { userId: ids.pupil! } })).toBe(0);
    await expect(requestToJoin(ids.pupil!, { kind: "class", schoolId: ids.school!, classId: ids.class! })).rejects.toMatchObject({ key: "join.pausedHere" });
    expect(await db.joinRequest.count({ where: { userId: ids.pupil! } })).toBe(0);
  });

  it("TA-178: the class teacher's approval of a request filed before the pause is refused, and the pause stands", async () => {
    await db.joinRequest.deleteMany({ where: { userId: ids.pupil!, schoolId: ids.school! } });
    const request = await db.joinRequest.create({ data: { schoolId: ids.school!, userId: ids.pupil!, classId: ids.class!, via: "CLASS" }, select: { id: true } });
    const refused = await decideJoin(await as("teacher", "TEACHER"), request.id, "APPROVE").then(
      () => null,
      (error: unknown) => error,
    );
    expect(refused).toBeInstanceOf(AccessError);
    expect((refused as AccessError).key).toBe("access.onlyAnAdminCanRestoreAccess");
    const m = await db.membership.findUniqueOrThrow({ where: { id: ids.pupilM! }, select: { status: true, suspendedAt: true, suspendedReason: true } });
    expect(m.status).toBe("SUSPENDED");
    expect(m.suspendedAt).not.toBeNull();
    expect(m.suspendedReason).toBe("ZZ TAPIA paused by the office");
    expect((await db.joinRequest.findUniqueOrThrow({ where: { id: request.id } })).status).toBe("PENDING");
  });

  it("TA-178: the office's approval still brings the pupil back, and is written down as a reinstatement", async () => {
    const request = await db.joinRequest.findFirstOrThrow({ where: { userId: ids.pupil!, status: "PENDING" }, select: { id: true } });
    await decideJoin(await as("admin", "ADMIN"), request.id, "APPROVE");
    const m = await db.membership.findUniqueOrThrow({ where: { id: ids.pupilM! }, select: { status: true, suspendedAt: true, suspendedReason: true } });
    expect(m).toEqual({ status: "ACTIVE", suspendedAt: null, suspendedReason: null });
    expect(await db.auditLog.count({ where: { schoolId: ids.school!, action: "membership.reinstate", targetId: ids.pupilM!, actorUserId: ids.admin! } })).toBe(1);
  });

  it("TA-178: the teacher still approves a pupil who is not paused (unchanged)", async () => {
    const request = await requestToJoin(ids.pupil!, { kind: "class", schoolId: ids.school!, classId: ids.class! });
    await decideJoin(await as("teacher", "TEACHER"), request.requestId, "APPROVE");
    expect((await db.joinRequest.findUniqueOrThrow({ where: { id: request.requestId } })).status).toBe("APPROVED");
  });
});
