import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { hasRecord, myChildren, myRecord, recordFor } from "@/lib/student-record";
import { recordDeparture } from "@/lib/school-record";
import type { ActiveContext } from "@/lib/session";

/**
 * A child's record, which belongs to the child rather than to a school.
 *
 * THE SITUATION UNDER TEST is the one the app had no answer for: a pupil who
 * has left, whose next school is not on this platform. They have no active
 * membership, so no tenant, so every school-scoped page correctly shows them
 * nothing — and until now that included their own report cards, their own
 * attendance and the badges they earned. A record that disappears when you
 * change school is not a record.
 *
 * WHAT THIS FILE CAN AND CANNOT SHOW. The suite connects as the database OWNER,
 * so row-level security is NOT in force: every read below would come back the
 * same with the policies deleted. The central claim — that Postgres opens these
 * rows to the child and their guardians with NO SCHOOL BOUND, and to nobody
 * else — is made live in `npm run rls:verify`, where 21 checks hold it
 * including every negative.
 *
 * So what is left for this file is what the APPLICATION decides, and it is not
 * nothing: whose memberships a reader may build a record from, that a draft
 * report card never appears in one, that LATE counts as present, that unmarked
 * is null rather than zero, and that one child at two schools is one child.
 */

const db = new PrismaClient();

const OLD_SLUG = "zz-record-old";
const OLD_NAME = "ZZ Record Old School";
const NEW_SLUG = "zz-record-new";
const NEW_NAME = "ZZ Record New School";
const ADMIN_EMAIL = "record.admin@zzrecord.test";
const PUPIL_EMAIL = "record.pupil@zzrecord.test";
const OTHER_EMAIL = "record.other@zzrecord.test";
const PARENT_EMAIL = "record.parent@zzrecord.test";

let oldSchoolId: string;
let newSchoolId: string;
let oldClassId: string;
let admin: ActiveContext;

let pupilUserId: string;
let oldMembershipId: string;
let newMembershipId: string;
let otherUserId: string;
let otherMembershipId: string;
let parentUserId: string;

function ctx(over: Partial<ActiveContext> & { userId: string }): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId: over.membershipId ?? null,
    schoolId: over.schoolId ?? null,
    role: over.role ?? null,
    user: {
      id: over.userId,
      name: "Test",
      preferredName: null,
      email: null,
      avatarKey: null,
      isMinor: false,
      isSuperuser: false,
      isAppAdmin: false,
      prefs: {
        theme: "system",
        contrast: "normal",
        font: "default",
        motion: "full",
        locale: "en",
        channels: { push: false, email: false },
        quietHours: null,
      },
    },
  };
}

beforeAll(async () => {
  const oldSchool = await db.school.upsert({
    where: { slug: OLD_SLUG },
    create: { name: OLD_NAME, slug: OLD_SLUG, code: "ZZREC-OLD", contactEmail: "a@zzrecord.test" },
    update: { name: OLD_NAME },
  });
  const newSchool = await db.school.upsert({
    where: { slug: NEW_SLUG },
    create: { name: NEW_NAME, slug: NEW_SLUG, code: "ZZREC-NEW", contactEmail: "b@zzrecord.test" },
    update: { name: NEW_NAME },
  });
  oldSchoolId = oldSchool.id;
  newSchoolId = newSchool.id;

  oldClassId = (
    await db.class.upsert({
      where: { joinCode: "ZZZ-REC-OLD" },
      create: { schoolId: oldSchoolId, name: "ZZ Rec Old", gradeLevel: "5", joinCode: "ZZZ-REC-OLD" },
      update: {},
    })
  ).id;
  await db.class.upsert({
    where: { joinCode: "ZZZ-REC-NEW" },
    create: { schoolId: newSchoolId, name: "ZZ Rec New", gradeLevel: "6", joinCode: "ZZZ-REC-NEW" },
    update: {},
  });

  const adminUser = await db.user.upsert({
    where: { email: ADMIN_EMAIL },
    create: { email: ADMIN_EMAIL, name: "Record Admin", prefs: "{}" },
    update: {},
  });
  const adminMembership = await db.membership.upsert({
    where: { userId_schoolId_role: { userId: adminUser.id, schoolId: oldSchoolId, role: "ADMIN" } },
    create: { userId: adminUser.id, schoolId: oldSchoolId, role: "ADMIN", status: "ACTIVE" },
    update: { status: "ACTIVE", leftAt: null },
  });
  admin = ctx({
    userId: adminUser.id,
    membershipId: adminMembership.id,
    schoolId: oldSchoolId,
    role: "ADMIN",
  });
});

/**
 * A pupil with a term behind them at the old school and a place at the new one,
 * a guardian linked at BOTH, and an unrelated classmate at the old school.
 */
async function makeHistory(): Promise<void> {
  await wipe();

  const pupil = await db.user.create({
    data: { email: PUPIL_EMAIL, name: "Asha Kapoor", preferredName: "Asha", prefs: "{}" },
  });
  pupilUserId = pupil.id;

  const oldMembership = await db.membership.create({
    data: {
      userId: pupil.id,
      schoolId: oldSchoolId,
      role: "STUDENT",
      status: "ACTIVE",
      gradeLevel: "5",
      joinedAt: new Date("2024-04-01T00:00:00Z"),
    },
  });
  oldMembershipId = oldMembership.id;

  const newMembership = await db.membership.create({
    data: {
      userId: pupil.id,
      schoolId: newSchoolId,
      role: "STUDENT",
      status: "ACTIVE",
      gradeLevel: "6",
      joinedAt: new Date("2026-04-01T00:00:00Z"),
    },
  });
  newMembershipId = newMembership.id;

  const other = await db.user.create({
    data: { email: OTHER_EMAIL, name: "Someone Else", prefs: "{}" },
  });
  otherUserId = other.id;
  otherMembershipId = (
    await db.membership.create({
      data: { userId: other.id, schoolId: oldSchoolId, role: "STUDENT", status: "ACTIVE" },
    })
  ).id;

  const parent = await db.user.create({
    data: { email: PARENT_EMAIL, name: "Ravi Kapoor", prefs: "{}" },
  });
  parentUserId = parent.id;
  for (const [membershipId, schoolId] of [
    [oldMembershipId, oldSchoolId],
    [newMembershipId, newSchoolId],
  ] as const) {
    await db.guardianship.create({
      data: {
        parentUserId: parent.id,
        studentMembershipId: membershipId,
        studentSchoolId: schoolId,
        relation: "PARENT",
        status: "ACTIVE",
      },
    });
  }

  // Four days at the old school: present, LATE, absent, present. LATE counts as
  // present everywhere else in this codebase and must here too.
  const days = ["2026-03-02", "2026-03-03", "2026-03-04", "2026-03-05"] as const;
  const statuses = ["PRESENT", "LATE", "ABSENT", "PRESENT"] as const;
  for (let i = 0; i < days.length; i += 1) {
    const session = await db.attendanceSession.upsert({
      where: { classId_dateKey: { classId: oldClassId, dateKey: days[i]! } },
      create: { schoolId: oldSchoolId, classId: oldClassId, dateKey: days[i]!, takenAt: new Date() },
      update: {},
    });
    await db.attendanceRecord.create({
      data: {
        schoolId: oldSchoolId,
        sessionId: session.id,
        studentMembershipId: oldMembershipId,
        status: statuses[i]!,
      },
    });
    // The classmate is marked on the same days, so any leak shows up as a
    // number that is too big rather than as nothing at all.
    await db.attendanceRecord.create({
      data: {
        schoolId: oldSchoolId,
        sessionId: session.id,
        studentMembershipId: otherMembershipId,
        status: "PRESENT",
      },
    });
  }

  // One published card and one draft, at the old school.
  const published = await db.reportCard.create({
    data: {
      schoolId: oldSchoolId,
      classId: oldClassId,
      studentMembershipId: oldMembershipId,
      title: "Term 1",
      status: "PUBLISHED",
      publishedAt: new Date("2026-03-10T00:00:00Z"),
      fromDateKey: "2026-01-05",
      toDateKey: "2026-03-01",
      attendancePresent: 3,
      attendanceTotal: 4,
      overallPercentMilli: 84_200,
      remark: "A pleasure to teach.",
    },
  });
  await db.reportCardItem.create({
    data: { schoolId: oldSchoolId, reportCardId: published.id, title: "Maths", scoreMilli: 90_000, position: 0 },
  });
  await db.reportCard.create({
    data: {
      schoolId: oldSchoolId,
      classId: oldClassId,
      studentMembershipId: oldMembershipId,
      title: "Term 2 (draft)",
      status: "DRAFT",
      fromDateKey: "2026-03-02",
      toDateKey: "2026-04-01",
    },
  });

  await db.earnedBadge.create({
    data: {
      schoolId: oldSchoolId,
      studentMembershipId: oldMembershipId,
      badgeId: "abhyaas:fractions",
      label: "Fractions",
      description: "Finished the fractions ladder",
      permanent: true,
    },
  });
}

async function wipe(): Promise<void> {
  const users = await db.user.findMany({
    where: { email: { in: [PUPIL_EMAIL, OTHER_EMAIL, PARENT_EMAIL] } },
    select: { id: true },
  });
  const ids = users.map((u) => u.id);
  if (ids.length === 0) return;
  await db.schoolRecord.deleteMany({ where: { studentUserId: { in: ids } } });
  await db.user.deleteMany({ where: { id: { in: ids } } });
}

afterEach(wipe);

afterAll(async () => {
  await wipe();
  await db.school.deleteMany({ where: { slug: { in: [OLD_SLUG, NEW_SLUG] } } });
  await db.user.deleteMany({ where: { email: ADMIN_EMAIL } });
  await db.$disconnect();
});

/* -------------------------------------------------------------------------- */

describe("an alumnus with no school at all", () => {
  it("⚠ still has their record, with no active membership anywhere", async () => {
    await makeHistory();
    // They leave BOTH schools — the case the whole feature is for. Their next
    // school is not on this platform, so there is no tenant to bind, ever again.
    expect((await recordDeparture(admin, oldMembershipId, { reason: "TRANSFERRED" })).ok).toBe(true);
    await db.membership.update({
      where: { id: newMembershipId },
      data: { leftAt: new Date("2027-03-20T00:00:00Z") },
    });

    // A session with no school and no role, which is exactly what `getSession`
    // hands back once the last membership ends.
    const alumnus = ctx({ userId: pupilUserId });
    const record = await myRecord(alumnus);

    expect(record).not.toBeNull();
    expect(record!.schools).toHaveLength(2);
    expect(record!.totals.cards).toBe(1);
    expect(record!.totals.badges).toBe(1);
    expect(record!.schools.every((s) => s.current === false)).toBe(true);
  });

  it("keeps the figures, the card and the badge attached to the right school", async () => {
    await makeHistory();
    const record = await myRecord(ctx({ userId: pupilUserId }));
    const old = record!.schools.find((s) => s.schoolId === oldSchoolId)!;
    const fresh = record!.schools.find((s) => s.schoolId === newSchoolId)!;

    expect(old.attendanceMarked).toBe(4);
    // LATE counts as present: 2 present + 1 late.
    expect(old.attendancePresent).toBe(3);
    expect(old.attendancePercent).toBe(75);
    expect(old.cards).toHaveLength(1);
    expect(old.cards[0]!.items).toHaveLength(1);
    expect(old.badges).toHaveLength(1);

    // Nothing has happened at the new school yet, and NOTHING is not zero.
    expect(fresh.attendanceMarked).toBe(0);
    expect(fresh.attendancePercent).toBeNull();
    expect(fresh.cards).toHaveLength(0);
  });

  it("⚠ never includes a DRAFT report card", async () => {
    await makeHistory();
    const record = await myRecord(ctx({ userId: pupilUserId }));
    const titles = record!.schools.flatMap((s) => s.cards.map((c) => c.title));

    // A draft is a teacher's working copy. A record read years later, by
    // somebody with no school left to ask, must not be the one place it leaks.
    expect(titles).toEqual(["Term 1"]);
  });

  it("carries the leaving certificate onto the school it was issued for", async () => {
    await makeHistory();
    await recordDeparture(admin, oldMembershipId, {
      reason: "TRANSFERRED",
      destination: "A school not on this platform",
    });

    const record = await myRecord(ctx({ userId: pupilUserId }));
    const old = record!.schools.find((s) => s.schoolId === oldSchoolId)!;
    expect(old.certificate?.reason).toBe("TRANSFERRED");
    expect(old.certificate?.destination).toBe("A school not on this platform");
    expect(old.leftAt).not.toBeNull();
  });

  it("says nothing at all for somebody who was never a pupil", async () => {
    await makeHistory();
    expect(await myRecord(ctx({ userId: parentUserId }))).toBeNull();
  });
});

describe("⚠ whose record a reader may build", () => {
  it("refuses another pupil's record, as 'no record' rather than 'not yours'", async () => {
    await makeHistory();
    const asPupil = ctx({ userId: pupilUserId });

    // Same answer as a person who does not exist. Distinguishing them would
    // turn this into a way of finding out whose child is whose.
    expect(await recordFor(asPupil, otherUserId)).toBeNull();
    expect(await recordFor(asPupil, "no-such-user-at-all")).toBeNull();
  });

  it("⚠ gives a guardian their own child and nobody else's", async () => {
    await makeHistory();
    const parent = ctx({ userId: parentUserId, role: "PARENT" });

    const mine = await recordFor(parent, pupilUserId);
    expect(mine).not.toBeNull();
    expect(mine!.schools).toHaveLength(2);

    expect(await recordFor(parent, otherUserId)).toBeNull();
  });

  it("⚠ gives a guardian only the schools they are actually linked at", async () => {
    await makeHistory();
    // The link at the new school is withdrawn — the new school has not handed
    // this parent anything, and a record is not a way around that.
    await db.guardianship.updateMany({
      where: { parentUserId, studentMembershipId: newMembershipId },
      data: { status: "REVOKED" },
    });

    const record = await recordFor(ctx({ userId: parentUserId, role: "PARENT" }), pupilUserId);
    expect(record!.schools.map((s) => s.schoolId)).toEqual([oldSchoolId]);
  });

  it("⚠ a pupil reading their OWN record is not limited by guardianship", async () => {
    await makeHistory();
    await db.guardianship.deleteMany({ where: { parentUserId } });

    // The child's own memberships are their own, whoever is or is not linked.
    const record = await myRecord(ctx({ userId: pupilUserId }));
    expect(record!.schools).toHaveLength(2);
  });
});

describe("the journey, as a guardian sees it", () => {
  it("⚠ counts one child at two schools as ONE child", async () => {
    await makeHistory();
    const children = await myChildren(ctx({ userId: parentUserId, role: "PARENT" }));

    // Grouped by the child, not the membership. Without this a parent whose
    // daughter moved schools meets two strangers with the same name.
    expect(children).toHaveLength(1);
    expect(children[0]!.studentUserId).toBe(pupilUserId);
    expect(children[0]!.schoolCount).toBe(2);
    expect(children[0]!.preferredName).toBe("Asha");
  });

  it("says nothing for somebody who guards nobody", async () => {
    await makeHistory();
    expect(await myChildren(ctx({ userId: pupilUserId }))).toEqual([]);
  });
});

describe("the routing question", () => {
  it("⚠ tells an alumnus apart from somebody brand new", async () => {
    await makeHistory();
    await db.membership.update({
      where: { id: oldMembershipId },
      data: { leftAt: new Date() },
    });
    await db.membership.update({
      where: { id: newMembershipId },
      data: { leftAt: new Date() },
    });

    // Both have no active role. One should be sent to their record and one to
    // a join-code box, and this is the question that tells them apart.
    expect(await hasRecord(ctx({ userId: pupilUserId }))).toBe(true);
    expect(await hasRecord(ctx({ userId: parentUserId }))).toBe(true);
    expect(await hasRecord(ctx({ userId: admin.user.id }))).toBe(false);
  });
});
