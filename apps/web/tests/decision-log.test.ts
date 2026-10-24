/**
 * The head's decision log, read from the audit rows the decisions write:
 * a ZZ head approves a leave with cover and applies a record change, the
 * log lists both as sentences, newest first; another school's head sees
 * none of it; the office reads the head's; a teacher is refused; the kind
 * and month filters narrow it; a cursor pages it. Every row is this file's
 * own, under two ZZ schools it deletes afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { applyForLeave, decideLeave } from "@/lib/leave";
import { fileRecordChange, decideRecordChange } from "@/lib/record-changes";
import { listDecisions } from "@/lib/decision-log";
import { GET as decisionsGet } from "@/app/api/v1/principal/decisions/route";
import type { ActiveContext } from "@/lib/session";

const db = new PrismaClient();
const STAMP = Date.now();
let schoolId = "";
let otherSchoolId = "";
const users: Record<string, string> = {};
const memberships: Record<string, string> = {};
let pupil = "";

function as(who: string, role: NonNullable<ActiveContext["role"]>, school = schoolId): ActiveContext {
  return {
    sessionId: "t",
    membershipId: memberships[who] ?? null,
    schoolId: school,
    role,
    user: { id: users[who]!, name: `ZZ DL ${who}`, preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: {} as never },
  };
}

beforeAll(async () => {
  const suffix = String(STAMP).slice(-6);
  const school = (tag: string, code: string) =>
    db.school.create({ data: { name: `ZZ DecisionLog ${tag} ${STAMP}`, slug: `zz-dl-${tag}-${STAMP}`, code: `${code}${suffix}`, contactEmail: `zz-dl-${tag}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } });
  schoolId = (await school("a", "ZD")).id;
  otherSchoolId = (await school("b", "ZE")).id;
  const mk = async (who: string, role: string, school: string, extra: Record<string, unknown> = {}) => {
    users[who] = (await db.user.create({ data: { name: who === "Asha" ? "Asha Patil" : who === "Desai" ? "R. Desai" : `ZZ DL ${who}`, email: `zz-dl-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } })).id;
    memberships[who] = (await db.membership.create({ data: { userId: users[who]!, schoolId: school, role, status: "ACTIVE", ...extra }, select: { id: true } })).id;
  };
  await mk("Head", "PRINCIPAL", schoolId);
  await mk("Admin", "ADMIN", schoolId);
  await mk("Asha", "TEACHER", schoolId);
  await mk("Desai", "TEACHER", schoolId);
  await mk("Teacher", "TEACHER", schoolId);
  await mk("Pupil", "STUDENT", schoolId, { studentCode: `ZDL${suffix}` });
  await mk("OtherHead", "PRINCIPAL", otherSchoolId);
  users.Parent = (await db.user.create({ data: { name: "ZZ DL Parent", email: `zz-dl-parent-${STAMP}@test.invalid` }, select: { id: true } })).id;
  pupil = memberships.Pupil!;
  await db.guardianship.create({ data: { parentUserId: users.Parent!, studentMembershipId: pupil, studentSchoolId: schoolId, status: "ACTIVE" } });
  await db.pupilRecord.create({ data: { schoolId, studentMembershipId: pupil, city: "Pune" } });
  // Asha marks a register, so approving her leave arranges a cover.
  const klass = await db.class.create({ data: { schoolId, name: `ZZ DL Class ${suffix}`, gradeLevel: "6", joinCode: `ZDL${suffix}` }, select: { id: true } });
  await db.classTeacher.create({ data: { classId: klass.id, teacherMembershipId: memberships.Asha!, schoolId, canTakeAttendance: true } });
});

afterAll(async () => {
  __resetCookies();
  const ids = Object.values(users);
  await db.session.deleteMany({ where: { userId: { in: ids } } });
  await db.school.deleteMany({ where: { id: { in: [schoolId, otherSchoolId] } } });
  await db.user.deleteMany({ where: { id: { in: ids } } });
  await db.$disconnect();
});

describe("the head's decision log", () => {
  it("lists a leave approved with cover and a record change applied, as sentences, newest first", async () => {
    const applied = await applyForLeave(as("Asha", "TEACHER"), { fromDateKey: "2026-10-03", toDateKey: "2026-10-05", kind: "CASUAL", reason: "ZZ family wedding" });
    expect(applied.ok).toBe(true);
    const leave = await db.leaveRequest.findFirstOrThrow({ where: { schoolId, teacherMembershipId: memberships.Asha }, select: { id: true } });
    const decided = await decideLeave(as("Head", "PRINCIPAL"), leave.id, "APPROVED", { coverMembershipId: memberships.Desai });
    expect(decided.ok).toBe(true);

    const ask = await fileRecordChange(as("Parent", "PARENT", null as never), pupil, { changes: { city: "Nashik" }, reason: "ZZ we moved" });
    await decideRecordChange(as("Head", "PRINCIPAL"), ask.id, { approve: true });

    const log = await listDecisions(as("Head", "PRINCIPAL"), { limit: 30 });
    expect(log.own).toBe(true);
    expect(log.total).toBe(2);
    expect(log.nextCursor).toBeNull();
    expect(log.items.map((i) => i.sentence)).toEqual(["Applied the record change for ZZ DL Pupil (1 fields)", "Approved Asha Patil's leave, 03/10/2026–05/10/2026, cover: R. Desai"]);
    expect(log.items.map((i) => [i.kind, i.action, i.approved])).toEqual([["record", "pupilRecord.change.apply", true], ["leave", "leave.approve", true]]);
  });

  it("another school's head sees nothing of it, and the office reads the head's", async () => {
    expect((await listDecisions(as("OtherHead", "PRINCIPAL", otherSchoolId), { limit: 30 })).items).toEqual([]);
    const office = await listDecisions(as("Admin", "ADMIN"), { limit: 30 });
    expect(office.own).toBe(false);
    expect(office.items).toHaveLength(2);
  });

  it("narrows by kind and by month, and pages by cursor", async () => {
    const head = as("Head", "PRINCIPAL");
    expect((await listDecisions(head, { kind: "leave", limit: 30 })).items.map((i) => i.kind)).toEqual(["leave"]);
    expect((await listDecisions(head, { kind: "admission", limit: 30 })).total).toBe(0);
    expect((await listDecisions(head, { from: "2000-01-01", to: "2000-01-31", limit: 30 })).total).toBe(0);
    const first = await listDecisions(head, { limit: 1 });
    expect(first.items).toHaveLength(1);
    expect(first.total).toBe(2);
    expect(first.nextCursor).toBe(first.items[0]!.id);
    const second = await listDecisions(head, { limit: 1, cursor: first.nextCursor! });
    expect(second.items).toHaveLength(1);
    expect(second.items[0]!.id).not.toBe(first.items[0]!.id);
    expect(second.nextCursor).toBeNull();
  });

  it("over the API: the head and the office are answered, a teacher is 403", async () => {
    const get = (query = "") => decisionsGet(new Request(`http://localhost/api/v1/principal/decisions${query}`));
    __resetCookies();
    await createSession(users.Head!, { schoolId, role: "PRINCIPAL" });
    const mine = await get();
    expect(mine.status).toBe(200);
    const body = (await mine.json()) as { items: { sentence: string }[]; total: number; own: boolean };
    expect(body.total).toBe(2);
    expect(body.own).toBe(true);
    expect((await get("?kind=nope")).status).toBe(422);
    // QA-55: a day that does not exist, or a window that runs backwards, is refused naming the field; it was a 200 with
    // every decision, the impossible date passing the pattern and the filter dropped.
    const unreal = await get("?from=2026-13-01");
    expect(unreal.status).toBe(422);
    expect(((await unreal.json()) as { issues?: Record<string, string> }).issues?.from).toBeTruthy();
    const backwards = await get("?from=2026-10-24&to=2026-04-01");
    expect(backwards.status).toBe(422);
    expect(((await backwards.json()) as { issues?: Record<string, string> }).issues?.to).toBeTruthy();
    expect((await get("?from=2024-02-29&to=2028-02-29")).status).toBe(200);

    __resetCookies();
    await createSession(users.Admin!, { schoolId, role: "ADMIN" });
    const office = await get("?kind=leave");
    expect(office.status).toBe(200);
    expect(((await office.json()) as { items: unknown[]; own: boolean }).own).toBe(false);

    __resetCookies();
    await createSession(users.Teacher!, { schoolId, role: "TEACHER" });
    expect((await get()).status).toBe(403);
  });
});
