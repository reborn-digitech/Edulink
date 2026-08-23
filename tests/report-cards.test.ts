import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import {
  assessmentsFor,
  assertMayWriteCards,
  cardsForChild,
  cardsForClass,
  generateCards,
  getCard,
  myCards,
  publishCards,
  setRemark,
  withdrawCards,
} from "@/lib/report-cards";
import type { ActiveContext } from "@/lib/session";

/**
 * Report cards.
 *
 * THE CLAIM THIS FILE EXISTS FOR is that a published card keeps saying what it
 * said. Everything else here is ordinary authorisation; that one is the property
 * that makes the feature worth having, and it is invisible until months later —
 * a teacher fixes a typo in one assignment and a document a parent read in
 * December quietly changes in March, with nothing failing anywhere.
 *
 * So there is a describe block below whose entire job is: change the marks
 * AFTER publishing, and check the card did not move.
 */

const db = new PrismaClient();

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

const LEAD_EMAIL = "card.lead.unit@riverside.test";
const CO_EMAIL = "card.co.unit@riverside.test";
const MADE = [LEAD_EMAIL, CO_EMAIL];

/** Borrowed from the seed, so the cleanup can name them. See the note there. */
let pupilUserId: string;
let guardianUserId: string;
const TITLE = "Term 1";

let riversideId: string;
let oakfieldId: string;
let classId: string;
let assignmentA: string;
let seriesId: string;
let assignmentB: string;

let admin: ActiveContext;
let lead: ActiveContext;
let coTeacher: ActiveContext;
let pupil: ActiveContext;
let guardian: ActiveContext;
let otherSchoolAdmin: ActiveContext;
let principal: ActiveContext;

let leadMembershipId: string;
let pupilMembershipId: string;

async function makeStaff(email: string, name: string, schoolId: string) {
  const user =
    (await db.user.findUnique({ where: { email } })) ??
    (await db.user.create({ data: { email, name, prefs: "{}" } }));
  const membership = await db.membership.upsert({
    where: { userId_schoolId_role: { userId: user.id, schoolId, role: "TEACHER" } },
    create: { userId: user.id, schoolId, role: "TEACHER", status: "ACTIVE" },
    update: { status: "ACTIVE" },
  });
  return { userId: user.id, membershipId: membership.id };
}

beforeAll(async () => {
  const riverside = await db.school.findFirstOrThrow({
    where: { name: "Riverside Primary School" },
  });
  const oakfield = await db.school.findFirstOrThrow({ where: { name: "Oakfield Academy" } });
  riversideId = riverside.id;
  oakfieldId = oakfield.id;

  const priya = await db.user.findUniqueOrThrow({ where: { email: "priya@riverside.school" } });
  const sam = await db.user.findUniqueOrThrow({ where: { email: "sam@oakfield.school" } });
  const priyaAdmin = await db.membership.findFirstOrThrow({
    where: { userId: priya.id, schoolId: riversideId, role: "ADMIN" },
  });
  const samAdmin = await db.membership.findFirstOrThrow({
    where: { userId: sam.id, schoolId: oakfieldId, role: "ADMIN" },
  });

  admin = ctx({ userId: priya.id, membershipId: priyaAdmin.id, schoolId: riversideId, role: "ADMIN" });
  otherSchoolAdmin = ctx({
    userId: sam.id,
    membershipId: samAdmin.id,
    schoolId: oakfieldId,
    role: "ADMIN",
  });
  principal = ctx({
    userId: priya.id,
    membershipId: priyaAdmin.id,
    schoolId: riversideId,
    role: "PRINCIPAL",
  });

  const l = await makeStaff(LEAD_EMAIL, "Lead Teacher", riversideId);
  const c = await makeStaff(CO_EMAIL, "Co Teacher", riversideId);
  leadMembershipId = l.membershipId;
  lead = ctx({
    userId: l.userId,
    membershipId: l.membershipId,
    schoolId: riversideId,
    role: "TEACHER",
  });
  coTeacher = ctx({
    userId: c.userId,
    membershipId: c.membershipId,
    schoolId: riversideId,
    role: "TEACHER",
  });

  // This suite's own class, roll and assessments. Nothing seeded is touched.
  const klass = await db.class.upsert({
    where: { joinCode: "ZZZ-CARDS" },
    create: {
      schoolId: riversideId,
      name: "ZZ Report Card Test Class",
      gradeLevel: "5",
      joinCode: "ZZZ-CARDS",
    },
    update: {},
  });
  classId = klass.id;

  await db.classTeacher.upsert({
    where: { classId_teacherMembershipId: { classId, teacherMembershipId: l.membershipId } },
    create: { classId, schoolId: riversideId, teacherMembershipId: l.membershipId, role: "LEAD" },
    update: { role: "LEAD" },
  });
  await db.classTeacher.upsert({
    where: { classId_teacherMembershipId: { classId, teacherMembershipId: c.membershipId } },
    create: {
      classId,
      schoolId: riversideId,
      teacherMembershipId: c.membershipId,
      role: "CO",
      canTakeAttendance: false,
    },
    update: { role: "CO" },
  });

  // A pupil with a guardian, so the read rules can be tested from both sides.
  const guardianship = await db.guardianship.findFirstOrThrow({
    where: { status: "ACTIVE", studentSchoolId: riversideId },
    select: { parentUserId: true, studentMembershipId: true },
  });
  pupilMembershipId = guardianship.studentMembershipId;
  guardianUserId = guardianship.parentUserId;

  const pupilRow = await db.membership.findUniqueOrThrow({
    where: { id: pupilMembershipId },
    select: { userId: true },
  });
  pupilUserId = pupilRow.userId;
  pupil = ctx({
    userId: pupilRow.userId,
    membershipId: pupilMembershipId,
    schoolId: riversideId,
    role: "STUDENT",
  });
  guardian = ctx({ userId: guardianship.parentUserId, schoolId: riversideId, role: "PARENT" });

  await db.enrollment.upsert({
    where: { classId_studentMembershipId: { classId, studentMembershipId: pupilMembershipId } },
    create: { classId, schoolId: riversideId, studentMembershipId: pupilMembershipId, status: "ACTIVE" },
    update: { status: "ACTIVE", removedAt: null },
  });

  /**
   * A REPORT CARD IS BUILT FROM SCHEDULED EXAMS, so the two assessments are
   * papers on an admin-scheduled series for this class's grade — the sitting
   * rows carry `examSlotId`. A plain homework assignment is no longer a
   * candidate, and a test below proves that refusal.
   */
  const series = await db.examSeries.create({
    data: {
      schoolId: riversideId,
      name: "ZZ Report-card exams",
      gradeLevel: "5",
      kind: "MID_TERM",
      publishedAt: new Date(),
    },
  });
  seriesId = series.id;
  const slotA = await db.examSlot.create({
    data: { schoolId: riversideId, seriesId: series.id, subject: "ZZ Maths", dateKey: "2026-03-02", pointsMilli: 100_000, position: 0 },
  });
  const slotB = await db.examSlot.create({
    data: { schoolId: riversideId, seriesId: series.id, subject: "ZZ Science", dateKey: "2026-03-03", pointsMilli: 100_000, position: 1 },
  });
  const a = await db.assignment.create({
    data: {
      schoolId: riversideId,
      classId,
      authorMembershipId: l.membershipId,
      title: "ZZ Mid-term test",
      category: "Exam",
      pointsMilli: 100_000,
      examSlotId: slotA.id,
      publishedAt: new Date(),
    },
  });
  const b = await db.assignment.create({
    data: {
      schoolId: riversideId,
      classId,
      authorMembershipId: l.membershipId,
      title: "ZZ End-of-term exam",
      category: "Exam",
      pointsMilli: 100_000,
      examSlotId: slotB.id,
      publishedAt: new Date(),
    },
  });
  assignmentA = a.id;
  assignmentB = b.id;
});

afterEach(async () => {
  await db.reportCard.deleteMany({ where: { classId } });
  await db.grade.deleteMany({ where: { assignmentId: { in: [assignmentA, assignmentB] } } });
  /**
   * ⚠ THE RECIPIENTS, NOT THE SCHOOL. This used to be
   * `{ schoolId: riversideId, kind: "GRADE" }`, which deletes every grade
   * notification in a real seeded school — including ones this suite never
   * sent. `npm test` runs against the dev database. Same fix, and same
   * reasoning, as `ownMemberships` in leave.test.ts.
   *
   * The pupil and their guardian are BORROWED from the seed rather than
   * created here, so they cannot be matched by email the way `MADE` is; their
   * user ids are what this suite actually knows about them.
   */
  await db.notification.deleteMany({
    where: { userId: { in: [pupilUserId, guardianUserId] }, kind: "GRADE" },
  });
});

afterAll(async () => {
  await db.reportCard.deleteMany({ where: { classId } });
  await db.grade.deleteMany({ where: { assignmentId: { in: [assignmentA, assignmentB] } } });
  await db.assignment.deleteMany({ where: { classId } });
  await db.examSeries.deleteMany({ where: { id: seriesId } });
  await db.enrollment.deleteMany({ where: { classId } });
  await db.classTeacher.deleteMany({ where: { classId } });
  await db.class.deleteMany({ where: { id: classId } });
  await db.membership.deleteMany({ where: { user: { email: { in: MADE } } } });
  await db.user.deleteMany({ where: { email: { in: MADE } } });
  await db.$disconnect();
});

async function mark(assignmentId: string, scoreMilli: number) {
  await db.grade.upsert({
    where: {
      assignmentId_studentMembershipId: { assignmentId, studentMembershipId: pupilMembershipId },
    },
    create: {
      schoolId: riversideId,
      assignmentId,
      studentMembershipId: pupilMembershipId,
      gradedByMembershipId: leadMembershipId,
      scoreMilli,
    },
    update: { scoreMilli },
  });
}

const INPUT = { title: TITLE, assignmentIds: [] as string[] };

describe("⚠ who may write them", () => {
  it("lets the class teacher", async () => {
    await expect(assertMayWriteCards(lead, classId)).resolves.toBeTruthy();
  });

  it("⚠ refuses a co-teacher of the same class", async () => {
    // Narrower than "anyone who teaches this class" on purpose. The school named
    // exactly one person for this job when it made somebody LEAD.
    await expect(assertMayWriteCards(coTeacher, classId)).rejects.toBeInstanceOf(AccessError);
  });

  it("⚠ refuses a principal — they read what came out, they do not write it", async () => {
    await expect(assertMayWriteCards(principal, classId)).rejects.toBeInstanceOf(AccessError);
  });

  it("lets an admin", async () => {
    await expect(assertMayWriteCards(admin, classId)).resolves.toBeTruthy();
  });

  it("⚠ refuses an admin of another school", async () => {
    await expect(assertMayWriteCards(otherSchoolAdmin, classId)).rejects.toBeInstanceOf(AccessError);
  });
});

describe("choosing what counts", () => {
  it("offers this class's published assessments, with how many are marked", async () => {
    await mark(assignmentA, 80_000);
    const list = await assessmentsFor(lead, classId);
    const midTerm = list.find((a) => a.assignmentId === assignmentA);
    expect(midTerm).toBeDefined();
    expect(midTerm!.gradedCount).toBe(1);
    expect(midTerm!.classSize).toBeGreaterThanOrEqual(1);
  });

  it("⚠ refuses to include an assessment from another class", async () => {
    const elsewhere = await db.assignment.findFirstOrThrow({
      where: { schoolId: riversideId, classId: { not: classId } },
    });
    const result = await generateCards(lead, classId, {
      ...INPUT,
      assignmentIds: [elsewhere.id],
    });
    expect(result.ok).toBe(false);
  });

  it("⚠ refuses a homework assignment — only scheduled exam papers go on a card", async () => {
    const homework = await db.assignment.create({
      data: {
        schoolId: riversideId,
        classId,
        authorMembershipId: leadMembershipId,
        title: "ZZ Homework that must not count",
        pointsMilli: 10_000,
        publishedAt: new Date(),
      },
    });
    try {
      const list = await assessmentsFor(lead, classId);
      expect(list.some((a) => a.assignmentId === homework.id)).toBe(false);
      const result = await generateCards(lead, classId, { ...INPUT, assignmentIds: [homework.id] });
      expect(result.ok).toBe(false);
    } finally {
      await db.assignment.delete({ where: { id: homework.id } });
    }
  });

  it("refuses an empty selection and an unnamed report", async () => {
    expect((await generateCards(lead, classId, { ...INPUT, assignmentIds: [] })).ok).toBe(false);
    expect(
      (await generateCards(lead, classId, { title: " ", assignmentIds: [assignmentA] })).ok,
    ).toBe(false);
  });
});

describe("generating", () => {
  it("makes a draft per child on the roll, with the chosen assessments on it", async () => {
    await mark(assignmentA, 80_000);
    await mark(assignmentB, 90_000);

    const result = await generateCards(lead, classId, {
      title: TITLE,
      assignmentIds: [assignmentA, assignmentB],
    });
    expect(result.ok).toBe(true);
    expect(result.created).toBeGreaterThanOrEqual(1);

    const cards = await cardsForClass(lead, classId, TITLE);
    const mine = cards.find((c) => c.studentMembershipId === pupilMembershipId)!;
    expect(mine.status).toBe("DRAFT");

    const card = await getCard(lead, mine.id);
    expect(card!.items).toHaveLength(2);
    expect(card!.items[0]!.title).toBe("ZZ Mid-term test");
    expect(card!.overallPercent).toBeCloseTo(85, 1);
  });

  it("keeps the order the teacher chose", async () => {
    await generateCards(lead, classId, {
      title: TITLE,
      assignmentIds: [assignmentB, assignmentA],
    });
    const cards = await cardsForClass(lead, classId, TITLE);
    const card = await getCard(lead, cards[0]!.id);
    expect(card!.items[0]!.title).toBe("ZZ End-of-term exam");
  });

  it("⚠ leaves an unmarked assessment blank rather than counting it as zero", async () => {
    // A test the child has not sat is not a mark of nought. Counting it as one
    // is the single most damaging arithmetic mistake a report card can make.
    await mark(assignmentA, 80_000);
    await generateCards(lead, classId, {
      title: TITLE,
      assignmentIds: [assignmentA, assignmentB],
    });

    const cards = await cardsForClass(lead, classId, TITLE);
    const card = await getCard(lead, cards.find((c) => c.studentMembershipId === pupilMembershipId)!.id);
    expect(card!.items[1]!.scoreMilli).toBeNull();
    // 80 alone, not 40.
    expect(card!.overallPercent).toBeCloseTo(80, 1);
  });

  it("regenerating a draft replaces its contents rather than duplicating", async () => {
    await generateCards(lead, classId, { title: TITLE, assignmentIds: [assignmentA] });
    const first = await cardsForClass(lead, classId, TITLE);

    const again = await generateCards(lead, classId, {
      title: TITLE,
      assignmentIds: [assignmentA, assignmentB],
    });
    expect(again.updated).toBeGreaterThanOrEqual(1);

    const second = await cardsForClass(lead, classId, TITLE);
    expect(second).toHaveLength(first.length);

    const card = await getCard(lead, second.find((c) => c.studentMembershipId === pupilMembershipId)!.id);
    expect(card!.items).toHaveLength(2);
  });

  it("refuses when nobody is on the roll", async () => {
    const empty = await db.class.upsert({
      where: { joinCode: "ZZZ-EMPTY" },
      create: { schoolId: riversideId, name: "ZZ Empty", joinCode: "ZZZ-EMPTY" },
      update: {},
    });
    try {
      const result = await generateCards(admin, empty.id, {
        title: TITLE,
        assignmentIds: [assignmentA],
      });
      expect(result.ok).toBe(false);
    } finally {
      await db.class.deleteMany({ where: { id: empty.id } });
    }
  });
});

describe("built from a term", () => {
  it("⚠ the term fixes the title and the attendance window, and the card carries it", async () => {
    const year = await db.academicYear.create({
      data: { schoolId: riversideId, name: "ZZ RC TERMS 1998", startDate: new Date("1998-06-01T00:00:00Z"), endDate: new Date("1999-04-30T00:00:00Z") },
    });
    try {
      const term = await db.term.create({
        data: { schoolId: riversideId, academicYearId: year.id, name: "ZZ Half-yearly", startDate: new Date("1998-06-01T00:00:00Z"), endDate: new Date("1998-11-30T00:00:00Z") },
      });
      await mark(assignmentA, 80_000);
      const result = await generateCards(lead, classId, { title: "typed title is ignored", assignmentIds: [assignmentA], termId: term.id });
      expect(result.ok).toBe(true);
      const card = await db.reportCard.findFirstOrThrow({ where: { classId, termId: term.id } });
      expect(card.title).toBe("ZZ Half-yearly");
      expect(card.fromDateKey).toBe("1998-06-01");
      expect(card.toDateKey).toBe("1998-11-30");
      // Somebody else's term id is refused, not silently dropped.
      expect(await generateCards(lead, classId, { title: "x", assignmentIds: [assignmentA], termId: "not-a-term" })).toMatchObject({ ok: false, errorKey: "terms.notFound" });
      await db.reportCard.deleteMany({ where: { classId, termId: term.id } });
    } finally {
      await db.academicYear.delete({ where: { id: year.id } });
    }
  });
});

describe("⚠ a published card keeps saying what it said", () => {
  async function publishOne() {
    await mark(assignmentA, 80_000);
    await generateCards(lead, classId, { title: TITLE, assignmentIds: [assignmentA] });
    await publishCards(lead, classId, TITLE);
    const cards = await cardsForClass(lead, classId, TITLE);
    return cards.find((c) => c.studentMembershipId === pupilMembershipId)!.id;
  }

  it("⚠ does not move when the underlying mark is corrected afterwards", async () => {
    const cardId = await publishOne();
    const before = await getCard(lead, cardId);
    expect(before!.items[0]!.scoreMilli).toBe(80_000);

    // The teacher fixes a typo in the gradebook, months later.
    await mark(assignmentA, 55_000);

    const after = await getCard(lead, cardId);
    // ⚠ The document a parent read in December still says 80.
    expect(after!.items[0]!.scoreMilli).toBe(80_000);
    expect(after!.overallPercent).toBeCloseTo(80, 1);
  });

  it("⚠ does not move when the assignment is renamed", async () => {
    const cardId = await publishOne();
    await db.assignment.update({
      where: { id: assignmentA },
      data: { title: "ZZ Renamed after the fact" },
    });
    try {
      const card = await getCard(lead, cardId);
      expect(card!.items[0]!.title).toBe("ZZ Mid-term test");
    } finally {
      await db.assignment.update({
        where: { id: assignmentA },
        data: { title: "ZZ Mid-term test" },
      });
    }
  });

  it("⚠ regenerating does NOT rewrite it", async () => {
    const cardId = await publishOne();
    await mark(assignmentA, 55_000);

    const result = await generateCards(lead, classId, {
      title: TITLE,
      assignmentIds: [assignmentA, assignmentB],
    });
    expect(result.skippedPublished).toBeGreaterThanOrEqual(1);

    const card = await getCard(lead, cardId);
    expect(card!.items).toHaveLength(1);
    expect(card!.items[0]!.scoreMilli).toBe(80_000);
  });

  it("refuses to change the remark on a published card", async () => {
    const cardId = await publishOne();
    const result = await setRemark(lead, cardId, "Too late");
    expect(result.ok).toBe(false);
  });

  it("withdrawing puts it back to draft, and then it may be rewritten", async () => {
    const cardId = await publishOne();
    expect((await withdrawCards(lead, classId, TITLE)).ok).toBe(true);

    await mark(assignmentA, 55_000);
    await generateCards(lead, classId, { title: TITLE, assignmentIds: [assignmentA] });

    const card = await getCard(lead, cardId);
    expect(card!.status).toBe("DRAFT");
    expect(card!.items[0]!.scoreMilli).toBe(55_000);
  });
});

describe("⚠ a draft is invisible outside the staff room", () => {
  async function draftOne() {
    await mark(assignmentA, 80_000);
    await generateCards(lead, classId, { title: TITLE, assignmentIds: [assignmentA] });
    const cards = await cardsForClass(lead, classId, TITLE);
    return cards.find((c) => c.studentMembershipId === pupilMembershipId)!.id;
  }

  it("⚠ is not readable by the child it is about", async () => {
    // Half-written marks and an unfinished remark. "Nobody has the link yet" is
    // not access control.
    const cardId = await draftOne();
    expect(await getCard(pupil, cardId)).toBeNull();
  });

  it("⚠ is not readable by their guardian", async () => {
    const cardId = await draftOne();
    expect(await getCard(guardian, cardId)).toBeNull();
  });

  it("is readable by the class teacher, an admin and the principal", async () => {
    const cardId = await draftOne();
    expect(await getCard(lead, cardId)).not.toBeNull();
    expect(await getCard(admin, cardId)).not.toBeNull();
    expect(await getCard(principal, cardId)).not.toBeNull();
  });

  it("does not appear in the child's own list", async () => {
    await draftOne();
    expect(await myCards(pupil)).toHaveLength(0);
  });

  it("⚠ becomes readable to both once published", async () => {
    const cardId = await draftOne();
    await publishCards(lead, classId, TITLE);

    expect(await getCard(pupil, cardId)).not.toBeNull();
    expect(await getCard(guardian, cardId)).not.toBeNull();
    expect(await myCards(pupil)).toHaveLength(1);
  });

  it("⚠ is never readable by another school's admin", async () => {
    const cardId = await draftOne();
    await publishCards(lead, classId, TITLE);
    expect(await getCard(otherSchoolAdmin, cardId)).toBeNull();
  });

  it("⚠ a guardian cannot read somebody else's child's cards", async () => {
    // "Somebody else's child" must mean it: a pupil this guardian holds NO
    // guardianship over, of any relation. Picking merely "another pupil"
    // broke twice — once on the seeded two-child parent, and once when
    // standin-guardian.ts started giving unclaimed pupils a SCHOOL-relation
    // guardian, so row order could hand this test a child the guardian
    // legitimately reads.
    const otherPupil = await db.membership.findFirstOrThrow({
      where: {
        schoolId: riversideId,
        role: "STUDENT",
        status: "ACTIVE",
        id: { not: pupilMembershipId },
        guardianships: { none: { parentUserId: guardianUserId } },
      },
    });
    await expect(cardsForChild(guardian, otherPupil.id)).rejects.toBeInstanceOf(AccessError);
  });

  it("a guardian sees their own child's published cards", async () => {
    await draftOne();
    await publishCards(lead, classId, TITLE);
    const cards = await cardsForChild(guardian, pupilMembershipId);
    expect(cards).toHaveLength(1);
  });

  /**
   * ⚠ THE SCHOOL COMES FROM THE CHILD, NOT FROM THE SESSION.
   *
   * A parent with one child at each of two schools has ONE activeSchoolId and
   * two children, and the child switcher on the grades page moves between them
   * without touching the session. Scoping the lookup by the session's school
   * showed one child's report cards and returned an empty list for the other —
   * a wrong answer indistinguishable from "no report cards yet", which is the
   * kind that never gets reported as a bug.
   *
   * The guardianship is still the authorisation. This only fixes where the
   * school is read from.
   */
  it("⚠ finds the card when the parent's session is pointed at their OTHER child's school", async () => {
    await draftOne();
    await publishCards(lead, classId, TITLE);

    const elsewhere = ctx({
      userId: guardian.user.id,
      schoolId: oakfieldId,
      role: "PARENT",
    });
    const cards = await cardsForChild(elsewhere, pupilMembershipId);
    expect(cards).toHaveLength(1);
  });
});

describe("publishing", () => {
  it("goes out as a set, and tells the child and their guardian", async () => {
    await mark(assignmentA, 80_000);
    await generateCards(lead, classId, { title: TITLE, assignmentIds: [assignmentA] });

    const result = await publishCards(lead, classId, TITLE);
    expect(result.ok).toBe(true);
    expect(result.published).toBeGreaterThanOrEqual(1);

    const told = await db.notification.count({
      where: {
        userId: { in: [pupilUserId, guardianUserId] },
        kind: "GRADE",
        title: "Your report card is ready",
      },
    });
    expect(told).toBeGreaterThanOrEqual(1);
  });

  it("refuses when there is nothing to publish", async () => {
    expect((await publishCards(lead, classId, "No such term")).ok).toBe(false);
  });

  it("⚠ a co-teacher cannot publish", async () => {
    await generateCards(lead, classId, { title: TITLE, assignmentIds: [assignmentA] });
    await expect(publishCards(coTeacher, classId, TITLE)).rejects.toBeInstanceOf(AccessError);
  });

  it("refuses to withdraw a set that was never published", async () => {
    await generateCards(lead, classId, { title: TITLE, assignmentIds: [assignmentA] });
    expect((await withdrawCards(lead, classId, TITLE)).ok).toBe(false);
  });
});

describe("the card itself", () => {
  it("carries the school's name and logo, for the printout", async () => {
    await generateCards(lead, classId, { title: TITLE, assignmentIds: [assignmentA] });
    const cards = await cardsForClass(lead, classId, TITLE);
    const card = await getCard(lead, cards[0]!.id);
    expect(card!.school.name).toBe("Riverside Primary School");
    expect(card!.school).toHaveProperty("logoPath");
  });

  it("says who wrote it and what window it covered", async () => {
    await generateCards(lead, classId, { title: TITLE, assignmentIds: [assignmentA] });
    const cards = await cardsForClass(lead, classId, TITLE);
    const card = await getCard(lead, cards[0]!.id);
    expect(card!.authorName).toBe("Lead Teacher");
    expect(card!.fromDateKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(card!.toDateKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("takes a remark while it is a draft", async () => {
    await generateCards(lead, classId, { title: TITLE, assignmentIds: [assignmentA] });
    const cards = await cardsForClass(lead, classId, TITLE);
    expect((await setRemark(lead, cards[0]!.id, "A strong term.")).ok).toBe(true);

    const card = await getCard(lead, cards[0]!.id);
    expect(card!.remark).toBe("A strong term.");
  });
});
