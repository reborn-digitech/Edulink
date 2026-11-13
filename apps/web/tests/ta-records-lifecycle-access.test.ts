/**
 * Who may still touch a pupil's papers after the pupil has gone: findings
 * TA-204 and TA-205 of the testing analysis of 13 November 2026, held by cases
 * that FAIL while the defect stands and pass once it is fixed.
 *
 *   TA-204  A school the pupil has left could still rewrite the pupil's legal
 *           name, date of birth and PEN: correctLegalName, setMemberBirthdate
 *           and proposePenChange found the membership by id and school with no
 *           leftAt condition, and wrote the shared User row the pupil's new
 *           school prints. A PEN proposal made before the leaving stayed
 *           PENDING, and the head's (or a guardian's) approval afterwards
 *           still wrote the number through decidePenChange.
 *   TA-205  certificateFor read the leaving record by its id alone for anybody
 *           but an admin, so (under the row policy) any member of the issuing
 *           school holding the id read it: a classmate, a teacher, another
 *           family.
 *
 * Two scratch ZZ schools of this suite's own (its stamp in every name and
 * address), made through the owner connection and removed in afterAll: the
 * pupil left the first and is on the second's roll now.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import type { Role } from "@/lib/constants";
import { certificateFor, recordDeparture, undoDeparture } from "@/lib/school-record";
import { correctLegalName } from "@/lib/legal-name";
import { setMemberBirthdate } from "@/lib/birthdate";
import { decidePenChange, proposePenChange } from "@/lib/pen-changes";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-ta-rl-access-${who}-${STAMP}@test.invalid`;
const PEN = `7${String(STAMP).slice(-10)}`;
const ids: Record<string, string> = {};

function ctx(who: string, role: Role, school: "a" | "b" | null): ActiveContext {
  return {
    sessionId: `zz-ta-rl-${who}`,
    membershipId: school ? (ids[`${who}M`] ?? null) : null,
    schoolId: school ? ids[school]! : null,
    role,
    user: {
      id: ids[who]!, name: who, preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false,
      prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null },
    },
  };
}

async function user(who: string, name: string, extra: object = {}): Promise<string> {
  ids[who] = (await db.user.create({ data: { name, email: MAIL(who), prefs: "{}", ...extra }, select: { id: true } })).id;
  return ids[who]!;
}

async function member(who: string, school: "a" | "b", role: string, key = `${who}M`): Promise<void> {
  ids[key] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: ids[school]!, role, status: "ACTIVE", joinedAt: new Date(Date.now() - 400 * 86_400_000) }, select: { id: true } })).id;
}

async function settle<T>(run: () => Promise<T>): Promise<{ value: T } | { error: unknown }> {
  try {
    return { value: await run() };
  } catch (error) {
    return { error };
  }
}

let recordId = "";
let closedRecordId = "";

beforeAll(async () => {
  for (const s of ["a", "b"] as const) {
    ids[s] = (await db.school.create({ data: { name: `ZZ TA-RL Access ${s.toUpperCase()} ${STAMP}`, slug: `zz-ta-rl-access-${s}-${STAMP}`, code: `ZZRLA${s.toUpperCase()}${STAMP}`, contactEmail: MAIL(`office-${s}`), timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } })).id;
  }
  await user("adminA", "ZZ RL Admin A");
  await member("adminA", "a", "ADMIN");
  await user("headA", "ZZ RL Head A");
  await member("headA", "a", "PRINCIPAL");
  await user("adminB", "ZZ RL Admin B");
  await member("adminB", "b", "ADMIN");
  await user("teacherA", "ZZ RL Teacher A");
  await member("teacherA", "a", "TEACHER");
  await user("teacherB", "ZZ RL Teacher B");
  await member("teacherB", "b", "TEACHER");
  // The leaver: on A's roll, then B's; a PEN and a date of birth on the account.
  await user("leaver", "ZZ RL Leaver", { penNumber: PEN, birthdate: new Date("2014-03-04T00:00:00Z"), isMinor: true });
  await member("leaver", "a", "STUDENT");
  await user("mother", "ZZ RL Mother");
  await db.guardianship.create({ data: { parentUserId: ids.mother!, studentMembershipId: ids.leaverM!, studentSchoolId: ids.a!, relation: "PARENT", status: "ACTIVE" } });
  // A classmate who stays, and that classmate's father.
  await user("classmate", "ZZ RL Classmate");
  await member("classmate", "a", "STUDENT");
  await user("otherParent", "ZZ RL Other Parent");
  await db.guardianship.create({ data: { parentUserId: ids.otherParent!, studentMembershipId: ids.classmateM!, studentSchoolId: ids.a!, relation: "PARENT", status: "ACTIVE" } });

  // A record that is later undone, then the real leaving.
  const first = await recordDeparture(ctx("adminA", "ADMIN", "a"), ids.leaverM!, { reason: "TRANSFERRED", destination: "ZZ RL B", note: "ZZ office note" });
  if (!first.ok) throw new Error(first.errorKey);
  closedRecordId = first.recordId;
  const undone = await undoDeparture(ctx("adminA", "ADMIN", "a"), ids.leaverM!);
  if (!undone.ok) throw new Error(undone.errorKey);
  const left = await recordDeparture(ctx("adminA", "ADMIN", "a"), ids.leaverM!, { reason: "TRANSFERRED", destination: "ZZ RL B", note: "ZZ office note" });
  if (!left.ok) throw new Error(left.errorKey);
  recordId = left.recordId;
  // Now on B's roll.
  await member("leaver", "b", "STUDENT", "leaverAtB");
});

afterAll(async () => {
  const users = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  const userIds = users.map((u) => u.id);
  const schools = [ids.a, ids.b].filter((x): x is string => Boolean(x));
  await db.notification.deleteMany({ where: { userId: { in: userIds } } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId: { in: schools } }, { actorUserId: { in: userIds } }] } });
  await db.school.deleteMany({ where: { id: { in: schools } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("TA-204: the school a pupil has left cannot rewrite the pupil's legal name, date of birth or PEN", () => {
  it("TA-204: the former school's office is refused all three on the old membership, and the account is unchanged", async () => {
    const adminA = ctx("adminA", "ADMIN", "a");
    const name = await correctLegalName(adminA, ids.leaverM!, "ZZ RL Renamed", "SPELLING");
    const birth = await setMemberBirthdate(adminA, ids.leaverM!, "2013-01-01");
    const pen = await settle(() => proposePenChange(adminA, ids.leaverM!, { toPen: null, reason: "ZZ remove" }));
    expect(name.ok).toBe(false);
    expect(birth.ok).toBe(false);
    expect("error" in pen, "the PEN proposal went through").toBe(true);
    const account = await db.user.findUniqueOrThrow({ where: { id: ids.leaver }, select: { name: true, birthdate: true, penNumber: true } });
    expect({ name: account.name, birthdate: account.birthdate?.toISOString().slice(0, 10), penNumber: account.penNumber }).toEqual({ name: "ZZ RL Leaver", birthdate: "2014-03-04", penNumber: PEN });
    expect(await db.penChangeRequest.count({ where: { studentMembershipId: ids.leaverM } })).toBe(0);
    expect(await db.auditLog.count({ where: { schoolId: ids.a, action: { in: ["user.legalname.set", "user.birthdate.set", "pen.propose"] } } })).toBe(0);
  });

  it("TA-204: a PEN proposal made before the leaving is not approved after it, by the head or a guardian, and a refusal still settles it", async () => {
    const adminA = ctx("adminA", "ADMIN", "a");
    const headA = ctx("headA", "PRINCIPAL", "a");
    // Two pupils with a PEN, both proposed for removal while on A's roll: one with no family (the head's word alone
    // applies it), one whose mother approves after the head has.
    const pens: Record<string, string> = { alone: `8${String(STAMP).slice(-10)}`, family: `9${String(STAMP).slice(-10)}` };
    const requests: Record<string, string> = {};
    for (const who of ["alone", "family"] as const) {
      await user(who, `ZZ RL Pen ${who}`, { penNumber: pens[who], isMinor: true });
      await member(who, "a", "STUDENT");
      if (who === "family") await db.guardianship.create({ data: { parentUserId: ids.mother!, studentMembershipId: ids.familyM!, studentSchoolId: ids.a!, relation: "PARENT", status: "ACTIVE" } });
      requests[who] = (await proposePenChange(adminA, ids[`${who}M`]!, { toPen: null, reason: "ZZ remove" })).id;
    }
    await decidePenChange(headA, requests.family!, { approve: true });
    for (const who of ["alone", "family"] as const) {
      const left = await recordDeparture(adminA, ids[`${who}M`]!, { reason: "TRANSFERRED", destination: "ZZ RL B", note: "" });
      if (!left.ok) throw new Error(left.errorKey);
    }
    const byHead = await settle(() => decidePenChange(headA, requests.alone!, { approve: true }));
    const byMother = await settle(() => decidePenChange(ctx("mother", "PARENT", null), requests.family!, { approve: true }));
    expect("error" in byHead ? byHead.error : null, "the head's approval went through").toMatchObject({ key: "pupilRecord.penChangePupilLeft", status: 409 });
    expect("error" in byMother ? byMother.error : null, "the mother's approval went through").toMatchObject({ key: "pupilRecord.penChangePupilLeft", status: 409 });
    for (const who of ["alone", "family"] as const) {
      expect((await db.user.findUniqueOrThrow({ where: { id: ids[who] }, select: { penNumber: true } })).penNumber).toBe(pens[who]);
      expect((await db.penChangeRequest.findUniqueOrThrow({ where: { id: requests[who] }, select: { status: true } })).status).toBe("PENDING");
    }
    expect(await db.auditLog.count({ where: { schoolId: ids.a, action: "pen.apply" } })).toBe(0);
    // Saying no is still the head's to say: it writes nothing on the account and settles the proposal.
    const rejected = await decidePenChange(headA, requests.alone!, { approve: false, reason: "ZZ the pupil has left" });
    expect(rejected.status).toBe("REJECTED");
    expect((await db.user.findUniqueOrThrow({ where: { id: ids.alone }, select: { penNumber: true } })).penNumber).toBe(pens.alone);
  });

  it("TA-204: the school that has the pupil now still corrects the name", async () => {
    const result = await correctLegalName(ctx("adminB", "ADMIN", "b"), ids.leaverAtB!, "ZZ RL Leaver Corrected", "SPELLING");
    expect(result).toEqual({ ok: true, changed: true });
    expect((await db.user.findUniqueOrThrow({ where: { id: ids.leaver }, select: { name: true } })).name).toBe("ZZ RL Leaver Corrected");
  });
});

describe("TA-205: the transfer certificate opens to the child, the family and the offices, not to anybody of the issuing school holding the id", () => {
  it("TA-205: a classmate, a teacher who never taught the child and another child's parent at the issuing school read nothing", async () => {
    expect(await certificateFor(ctx("classmate", "STUDENT", "a"), recordId)).toBeNull();
    expect(await certificateFor(ctx("teacherA", "TEACHER", "a"), recordId)).toBeNull();
    expect(await certificateFor(ctx("otherParent", "PARENT", null), recordId)).toBeNull();
  });

  it("TA-205: the child, the child's mother, the issuing office and the office and staff of the school the child is at now still read it", async () => {
    expect((await certificateFor(ctx("leaver", "STUDENT", "b"), recordId))?.id).toBe(recordId);
    expect((await certificateFor(ctx("mother", "PARENT", null), recordId))?.id).toBe(recordId);
    expect((await certificateFor(ctx("adminA", "ADMIN", "a"), recordId))?.issuedHere).toBe(true);
    expect((await certificateFor(ctx("adminB", "ADMIN", "b"), recordId))?.issuedHere).toBe(false);
    expect((await certificateFor(ctx("teacherB", "TEACHER", "b"), recordId))?.id).toBe(recordId);
  });

  it("TA-205: a closed record (the departure undone) is the issuing office's alone", async () => {
    expect(await certificateFor(ctx("leaver", "STUDENT", "b"), closedRecordId)).toBeNull();
    expect(await certificateFor(ctx("adminB", "ADMIN", "b"), closedRecordId)).toBeNull();
    expect((await certificateFor(ctx("adminA", "ADMIN", "a"), closedRecordId))?.id).toBe(closedRecordId);
  });
});
