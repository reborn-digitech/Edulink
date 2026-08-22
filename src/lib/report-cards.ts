import "server-only";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { db } from "./db";
import { audit } from "./audit";
import { notify } from "./notify";
import { AccessError } from "./tenancy";
import { getAttendanceSummary } from "./attendance";
import { ensureSittings } from "./exams";
import type { ExamKind } from "./constants";
import { addDaysToKey, todayKey } from "./dates";
import type { ActiveContext } from "./session";

/**
 * Report cards.
 *
 * A REPORT CARD IS A DOCUMENT, NOT A QUERY, and everything below follows from
 * that. The obvious build recomputes the marks whenever somebody opens the page,
 * which means the card a parent read in December quietly says something else in
 * March because a teacher fixed a typo in one assignment. A card is a statement
 * made on a date by a named person; it has to keep saying what it said.
 *
 * So generation SNAPSHOTS everything — the chosen assessments, their marks, the
 * attendance figures and the overall percentage — and publishing freezes it.
 * Regenerating a draft replaces its contents; regenerating a published card does
 * nothing. Changing a published one means withdrawing it first, which is a
 * deliberate audited act rather than a side effect of pressing a button twice.
 *
 * NOTHING IS CALCULATED HERE. The attendance figures come from
 * `getAttendanceSummary` and the overall from `overallForStudent`, the same
 * helpers the live pages use — because the one thing a report card must never do
 * is disagree with the screen it summarises. That rule is inherited from
 * `reports.ts` and is worth repeating: a parent holding a printout that says 88%
 * next to a page that says 86% has been given a reason to distrust both.
 */

/** Roughly a term, when the caller does not say. */
export const DEFAULT_WINDOW_DAYS = 120;

export type Assessment = {
  assignmentId: string;
  title: string;
  category: string | null;
  pointsMilli: number | null;
  dueAt: Date | null;
  /** The scheduled exam this paper belongs to — every assessment here has one. */
  seriesId: string;
  seriesName: string;
  seriesKind: ExamKind;
  subject: string;
  dateKey: string;
  /** How many of the class have a mark — a teacher should not report on an unmarked test. */
  gradedCount: number;
  classSize: number;
};

export type CardItem = {
  title: string;
  category: string | null;
  scoreMilli: number | null;
  pointsMilli: number | null;
};

export type Card = {
  id: string;
  status: string;
  title: string;
  remark: string | null;
  studentMembershipId: string;
  studentName: string;
  className: string;
  classSection: string | null;
  fromDateKey: string;
  toDateKey: string;
  attendancePresent: number;
  attendanceTotal: number;
  attendancePercent: number | null;
  overallPercent: number | null;
  gradingMethod: string;
  publishedAt: Date | null;
  authorName: string | null;
  items: CardItem[];
  school: { name: string; logoPath: string | null };
  practice: PracticeAnnexureRow[] | null;
};

/**
 * One chapter on the practice annexure: where the child's self-practice ladder
 * stood ON THE DAY THE CARD WAS GENERATED. Snapshot like everything else on the
 * document — the ladder keeps moving; the card must not.
 */
export type PracticeAnnexureRow = {
  subject: string;
  name: string;
  /** The rung the child stands on, 1–6. */
  level: number;
  /** Tier badges earned in this chapter, 0–6. */
  tiers: number;
};

/* -------------------------------------------------------------------------- */
/* Who may write one                                                           */
/* -------------------------------------------------------------------------- */

/**
 * The CLASS TEACHER writes the report cards, and an admin may.
 *
 * Deliberately narrower than "anyone who teaches this class". A co-teacher who
 * takes the class for music has no business writing the summary a parent reads
 * at the end of term, and the school named exactly one person for that job when
 * it made somebody LEAD.
 *
 * THE TEST IS THE JOB, NOT THE ROLE. A principal does not get in for being the
 * principal — they read what came out, they do not write it — but a principal
 * the school made LEAD of Class 5 passes the same check a teacher does, because
 * at that moment they ARE that class's teacher. `cohort.ts` deliberately allows
 * that appointment; refusing it here would be the app disagreeing with itself.
 */
export async function assertMayWriteCards(ctx: ActiveContext, classId: string) {
  if (!ctx.schoolId || !ctx.membershipId) throw new AccessError("access.noActiveSchoolSelected");

  const klass = await db.class.findFirst({
    where: { id: classId, schoolId: ctx.schoolId },
    select: { id: true, name: true, section: true, gradeLevel: true },
  });
  if (!klass) throw new AccessError("access.thatClassIsNotInThisSchool", "NOT_FOUND");

  if (ctx.role === "ADMIN") return klass;

  const lead = await db.classTeacher.findFirst({
    where: {
      schoolId: ctx.schoolId,
      classId,
      teacherMembershipId: ctx.membershipId,
      role: "LEAD",
    },
    select: { id: true },
  });
  if (!lead) {
    throw new AccessError("access.onlyThisClassSTeacherCanWrite");
  }
  return klass;
}

/* -------------------------------------------------------------------------- */
/* Choosing what counts                                                        */
/* -------------------------------------------------------------------------- */

/**
 * The assessments a class teacher may put on a card.
 *
 * PUBLISHED ASSIGNMENTS OF THIS CLASS ONLY. `gradedCount` rides along so the
 * picker can say "8 of 30 marked" — putting a test nobody has marked onto thirty
 * report cards produces thirty blanks and one very bad afternoon.
 */
export async function assessmentsFor(
  ctx: ActiveContext,
  classId: string,
): Promise<Assessment[]> {
  await assertMayWriteCards(ctx, classId);

  /* THE SCHEDULE IS THE MENU. A report card is built from the exams the admin
   * scheduled — unit tests, the mid-term, the final — and from nothing else;
   * homework and classwork stay on the grades page as the running picture.
   * Every paper of the class's grade gets its sitting row first, so a subject
   * nobody has marked yet still appears (as "0 of 30 marked") instead of
   * silently missing from the card. */
  await ensureSittings(ctx.schoolId!, classId, ctx.membershipId!);

  const [assignments, classSize] = await Promise.all([
    db.assignment.findMany({
      where: {
        schoolId: ctx.schoolId!,
        classId,
        examSlotId: { not: null },
        examSlot: { series: { archivedAt: null } },
      },
      select: {
        id: true,
        title: true,
        category: true,
        pointsMilli: true,
        dueAt: true,
        _count: { select: { grades: true } },
        examSlot: {
          select: {
            subject: true,
            dateKey: true,
            position: true,
            series: { select: { id: true, name: true, kind: true, createdAt: true } },
          },
        },
      },
    }),
    db.enrollment.count({ where: { classId, status: "ACTIVE" } }),
  ]);

  return assignments
    .map((a) => ({
      assignmentId: a.id,
      title: a.title,
      category: a.category,
      pointsMilli: a.pointsMilli,
      dueAt: a.dueAt,
      seriesId: a.examSlot!.series.id,
      seriesName: a.examSlot!.series.name,
      seriesKind: a.examSlot!.series.kind as ExamKind,
      subject: a.examSlot!.subject,
      dateKey: a.examSlot!.dateKey,
      gradedCount: a._count.grades,
      classSize,
      _seriesAt: a.examSlot!.series.createdAt.getTime(),
      _position: a.examSlot!.position,
    }))
    .sort(
      (a, b) =>
        a._seriesAt - b._seriesAt ||
        a.dateKey.localeCompare(b.dateKey) ||
        a._position - b._position,
    )
    .map((row) => {
      const { _seriesAt, _position, ...rest } = row;
      void _seriesAt;
      void _position;
      return rest;
    });
}

/* -------------------------------------------------------------------------- */
/* Generating                                                                  */
/* -------------------------------------------------------------------------- */

export type GenerateInput = {
  title: string;
  assignmentIds: string[];
  fromDateKey?: string;
  toDateKey?: string;
};

/** ⚠ `errorKey`, not a sentence — the leave.ts pattern. The action boundary
    translates it into the reader's language. */
export type GenerateResult = {
  ok: boolean;
  errorKey?: TranslationKey;
  created?: number;
  updated?: number;
  skippedPublished?: number;
};

export async function generateCards(
  ctx: ActiveContext,
  classId: string,
  input: GenerateInput,
): Promise<GenerateResult> {
  await assertMayWriteCards(ctx, classId);

  const title = input.title.trim().slice(0, 120);
  if (title.length < 2) return { ok: false, errorKey: "reportCards.giveName" };
  if (input.assignmentIds.length === 0) {
    return { ok: false, errorKey: "reportCards.chooseOne" };
  }

  const school = await db.school.findUniqueOrThrow({
    where: { id: ctx.schoolId! },
    select: { timezone: true },
  });
  const toDateKey = input.toDateKey ?? todayKey(school.timezone);
  const fromDateKey = input.fromDateKey ?? addDaysToKey(toDateKey, -DEFAULT_WINDOW_DAYS);
  if (fromDateKey > toDateKey) {
    return { ok: false, errorKey: "reportCards.windowBackwards" };
  }

  // Re-queried against THIS class. An assignment id from another class — or
  // another school — is simply not found, so a forged form cannot put somebody
  // else's test on this school's report cards.
  // …and an EXAM paper. A homework id smuggled into the form is dropped here:
  // the card is the exam record, and the grades page is where homework lives.
  const assignments = await db.assignment.findMany({
    where: {
      id: { in: input.assignmentIds.slice(0, 100) },
      schoolId: ctx.schoolId!,
      classId,
      examSlotId: { not: null },
    },
    select: { id: true, title: true, category: true, pointsMilli: true },
  });
  if (assignments.length === 0) {
    return { ok: false, errorKey: "reportCards.notThisClass" };
  }
  // Keep the teacher's chosen order rather than the database's.
  const order = new Map(input.assignmentIds.map((id, index) => [id, index]));
  assignments.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  const roll = await db.enrollment.findMany({
    where: { schoolId: ctx.schoolId!, classId, status: "ACTIVE" },
    select: { studentMembershipId: true },
  });
  if (roll.length === 0) return { ok: false, errorKey: "reportCards.emptyRoll" };

  const grades = await db.grade.findMany({
    where: {
      schoolId: ctx.schoolId!,
      assignmentId: { in: assignments.map((a) => a.id) },
      studentMembershipId: { in: roll.map((r) => r.studentMembershipId) },
    },
    select: { assignmentId: true, studentMembershipId: true, scoreMilli: true },
  });
  const gradeBy = new Map(
    grades.map((g) => [`${g.assignmentId}:${g.studentMembershipId}`, g.scoreMilli]),
  );


  // The practice annexure, fetched once for the whole roll: every chapter each
  // child has touched, with the rung they stand on and the tier badges earned.
  // Snapshot into the card so a term's document keeps saying what was true at
  // generation, however far the ladder moves afterwards.
  const rollIds = roll.map((r) => r.studentMembershipId);
  const [masteries, tierBadges] = await Promise.all([
    db.quizMastery.findMany({
      where: { schoolId: ctx.schoolId!, studentMembershipId: { in: rollIds } },
      select: {
        studentMembershipId: true,
        level: true,
        topic: { select: { slug: true, name: true, subject: true } },
      },
    }),
    db.earnedBadge.findMany({
      where: { schoolId: ctx.schoolId!, studentMembershipId: { in: rollIds }, badgeId: { contains: ":tier-" } },
      select: { studentMembershipId: true, badgeId: true },
    }),
  ]);
  const tiersBy = new Map<string, number>(); // `${membershipId}:${slug}` -> count
  for (const badge of tierBadges) {
    const match = /^abhyaas:(.+):tier-[1-6]$/.exec(badge.badgeId);
    if (!match) continue;
    const key = `${badge.studentMembershipId}:${match[1]}`;
    tiersBy.set(key, (tiersBy.get(key) ?? 0) + 1);
  }
  const practiceBy = new Map<string, PracticeAnnexureRow[]>();
  for (const mastery of masteries) {
    const rows = practiceBy.get(mastery.studentMembershipId) ?? [];
    rows.push({
      subject: mastery.topic.subject,
      name: mastery.topic.name,
      level: mastery.level,
      tiers: tiersBy.get(`${mastery.studentMembershipId}:${mastery.topic.slug}`) ?? 0,
    });
    practiceBy.set(mastery.studentMembershipId, rows);
  }
  for (const rows of practiceBy.values()) {
    rows.sort((a, b) => a.subject.localeCompare(b.subject) || a.name.localeCompare(b.name));
  }

  let created = 0;
  let updated = 0;
  let skippedPublished = 0;

  for (const row of roll) {
    const existing = await db.reportCard.findFirst({
      where: { classId, studentMembershipId: row.studentMembershipId, title },
      select: { id: true, status: true },
    });

    // ⚠ A published card is frozen. Regenerating must not silently rewrite a
    // document somebody has already read.
    if (existing?.status === "PUBLISHED") {
      skippedPublished++;
      continue;
    }

    const attendance = await getAttendanceSummary(
      ctx.schoolId!,
      row.studentMembershipId,
      fromDateKey,
      toDateKey,
    );

    // `maxMilli`, not `pointsMilli` — WeightedEntry's own name for the same
    // thing. Unmarked assessments are dropped rather than counted as zero: a
    // test the child has not sat yet is not a mark of nought, and treating it
    // as one is the single most damaging arithmetic mistake a report card can
    // make.
    const entries = assignments
      .map((a) => ({
        scoreMilli: gradeBy.get(`${a.id}:${row.studentMembershipId}`) ?? null,
        maxMilli: a.pointsMilli,
      }))
      .filter((e): e is { scoreMilli: number; maxMilli: number } => e.scoreMilli !== null && e.maxMilli !== null && e.maxMilli > 0);

    /* THE OVERALL IS MARKS OVER MAXIMUM ACROSS THE EXAMS ON THE CARD — not the
     * category-weighted figure the grades page shows, which blends homework in.
     * A report card's number must be reproducible by a parent with the card in
     * one hand and a calculator in the other. */
    const scored = entries.reduce((a, e) => a + e.scoreMilli, 0);
    const max = entries.reduce((a, e) => a + e.maxMilli, 0);
    const overall = {
      percent: max > 0 ? (scored / max) * 100 : null,
      method: "exams",
    };

    const data = {
      schoolId: ctx.schoolId!,
      classId,
      studentMembershipId: row.studentMembershipId,
      title,
      status: "DRAFT",
      fromDateKey,
      toDateKey,
      attendancePresent: attendance.counts.PRESENT + attendance.counts.LATE,
      attendanceTotal: attendance.total,
      overallPercentMilli:
        overall.percent === null ? null : Math.round(overall.percent * 1000),
      gradingMethod: overall.method,
      practice: (() => {
        const rows = practiceBy.get(row.studentMembershipId);
        return rows && rows.length > 0 ? JSON.stringify(rows) : null;
      })(),
      createdByMembershipId: ctx.membershipId,
    };

    const card = existing
      ? await db.reportCard.update({ where: { id: existing.id }, data, select: { id: true } })
      : await db.reportCard.create({ data, select: { id: true } });

    if (existing) updated++;
    else created++;

    // Items are REPLACED wholesale rather than reconciled. They are a snapshot,
    // so there is nothing to preserve — and a diff would be a way for a stale
    // row from a previous selection to survive onto the new card.
    await db.reportCardItem.deleteMany({ where: { reportCardId: card.id } });
    await db.reportCardItem.createMany({
      data: assignments.map((a, position) => ({
        schoolId: ctx.schoolId!,
        reportCardId: card.id,
        assignmentId: a.id,
        title: a.title,
        category: a.category,
        scoreMilli: gradeBy.get(`${a.id}:${row.studentMembershipId}`) ?? null,
        pointsMilli: a.pointsMilli,
        position,
      })),
    });
  }

  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.user.id,
    action: "reportCard.generate",
    targetType: "Class",
    targetId: classId,
    meta: { title, created, updated, skippedPublished, assessments: assignments.length },
  });

  return { ok: true, created, updated, skippedPublished };
}

/** The class teacher's words on one card. Drafts only. */
export async function setRemark(
  ctx: ActiveContext,
  cardId: string,
  remark: string,
): Promise<{ ok: boolean; errorKey?: TranslationKey }> {
  const card = await db.reportCard.findFirst({
    where: { id: cardId, schoolId: ctx.schoolId ?? "" },
    select: { id: true, classId: true, status: true },
  });
  if (!card) return { ok: false, errorKey: "reportCards.notInSchool" };
  await assertMayWriteCards(ctx, card.classId);

  if (card.status === "PUBLISHED") {
    return { ok: false, errorKey: "reportCards.publishedLocked" };
  }

  await db.reportCard.update({
    where: { id: card.id },
    data: { remark: remark.trim().slice(0, 2000) || null },
  });
  return { ok: true };
}

/**
 * Publishes a whole set at once.
 *
 * PER TITLE, NOT PER CHILD, because a term's report cards go out together. One
 * parent seeing their child's card a week before the rest of the class is a
 * phone call the office does not want, and publishing thirty cards one button at
 * a time guarantees somebody is missed.
 */
export async function publishCards(
  ctx: ActiveContext,
  classId: string,
  title: string,
): Promise<{ ok: boolean; errorKey?: TranslationKey; published?: number }> {
  await assertMayWriteCards(ctx, classId);

  const drafts = await db.reportCard.findMany({
    where: { schoolId: ctx.schoolId!, classId, title, status: "DRAFT" },
    select: {
      id: true,
      studentMembershipId: true,
      student: { select: { userId: true, user: { select: { name: true, preferredName: true } } } },
    },
  });
  if (drafts.length === 0) return { ok: false, errorKey: "reportCards.noDrafts" };

  await db.reportCard.updateMany({
    where: { schoolId: ctx.schoolId!, classId, title, status: "DRAFT" },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });

  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.user.id,
    action: "reportCard.publish",
    targetType: "Class",
    targetId: classId,
    meta: { title, published: drafts.length },
  });

  // The child, and their guardians. Told once, when it is actually readable.
  for (const draft of drafts) {
    await notify({
      userId: draft.student.userId,
      schoolId: ctx.schoolId,
      kind: "GRADE",
      titleKey: "notifTitle.reportCardReady",
      body: title,
      url: "/exams?tab=cards",
    });

    const guardians = await db.guardianship.findMany({
      where: { studentMembershipId: draft.studentMembershipId, status: "ACTIVE" },
      select: { parentUserId: true },
    });
    const childName = draft.student.user.preferredName ?? draft.student.user.name;
    for (const guardian of guardians) {
      await notify({
        userId: guardian.parentUserId,
        schoolId: ctx.schoolId,
        kind: "GRADE",
        titleKey: "notifTitle.childReportCardReady",
        titleVars: { name: childName },
        body: title,
        url: "/exams?tab=cards",
      });
    }
  }

  return { ok: true, published: drafts.length };
}

/**
 * Takes a set back.
 *
 * A REAL ACTION WITH A REAL COST, not an undo. Parents may already have read
 * them, so this is audited and the cards go back to DRAFT rather than vanishing.
 * It exists because the alternative — a mistake that can never be corrected — is
 * worse.
 */
export async function withdrawCards(
  ctx: ActiveContext,
  classId: string,
  title: string,
): Promise<{ ok: boolean; errorKey?: TranslationKey; withdrawn?: number }> {
  await assertMayWriteCards(ctx, classId);

  const result = await db.reportCard.updateMany({
    where: { schoolId: ctx.schoolId!, classId, title, status: "PUBLISHED" },
    data: { status: "DRAFT", publishedAt: null },
  });
  if (result.count === 0) return { ok: false, errorKey: "reportCards.nothingUnderName" };

  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.user.id,
    action: "reportCard.withdraw",
    targetType: "Class",
    targetId: classId,
    meta: { title, withdrawn: result.count },
  });
  return { ok: true, withdrawn: result.count };
}

/* -------------------------------------------------------------------------- */
/* Reading                                                                     */
/* -------------------------------------------------------------------------- */

/** Every card for a class, for the teacher's build screen. */
export async function cardsForClass(ctx: ActiveContext, classId: string, title?: string) {
  await assertMayWriteCards(ctx, classId);
  return db.reportCard.findMany({
    where: { schoolId: ctx.schoolId!, classId, ...(title ? { title } : {}) },
    orderBy: [{ title: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      title: true,
      status: true,
      remark: true,
      overallPercentMilli: true,
      attendancePresent: true,
      attendanceTotal: true,
      studentMembershipId: true,
      student: { select: { user: { select: { name: true, preferredName: true } } } },
    },
    take: 500,
  });
}

/**
 * One card, with the authorisation that decides who may read it.
 *
 * A DRAFT IS INVISIBLE OUTSIDE THE STAFF ROOM. Half-written marks and a remark
 * the teacher has not finished are exactly what a parent must not see, and
 * "nobody has the link yet" is not access control.
 */
export async function getCard(ctx: ActiveContext, cardId: string): Promise<Card | null> {
  // ⚠ NO schoolId GATE. A guardian's session has no school — they are
  // authorised through Guardianship, not Membership — and requiring one here
  // was why every parent's "open the report card" link answered 404 while the
  // summary rendered happily on /parent/grades. The card names its own school,
  // Postgres has already scoped what this request may read, and `mayRead`
  // below owns the relationship question. Staff sessions still pin the query
  // to their active school.
  const card = await db.reportCard.findFirst({
    where: { id: cardId, ...(ctx.schoolId ? { schoolId: ctx.schoolId } : {}) },
    select: {
      id: true,
      schoolId: true,
      title: true,
      status: true,
      remark: true,
      classId: true,
      studentMembershipId: true,
      fromDateKey: true,
      toDateKey: true,
      attendancePresent: true,
      attendanceTotal: true,
      overallPercentMilli: true,
      gradingMethod: true,
      practice: true,
      publishedAt: true,
      class: { select: { name: true, section: true } },
      student: { select: { user: { select: { name: true, preferredName: true } } } },
      createdBy: { select: { user: { select: { name: true, preferredName: true } } } },
      items: {
        orderBy: { position: "asc" },
        select: { title: true, category: true, scoreMilli: true, pointsMilli: true },
      },
    },
  });
  if (!card) return null;

  const allowed = await mayRead(ctx, card);
  if (!allowed) return null;

  const school = await db.school.findUniqueOrThrow({
    where: { id: card.schoolId },
    select: { name: true, logoPath: true },
  });

  return {
    id: card.id,
    status: card.status,
    title: card.title,
    remark: card.remark,
    studentMembershipId: card.studentMembershipId,
    studentName: card.student.user.preferredName ?? card.student.user.name,
    className: card.class.name,
    classSection: card.class.section,
    fromDateKey: card.fromDateKey,
    toDateKey: card.toDateKey,
    attendancePresent: card.attendancePresent,
    attendanceTotal: card.attendanceTotal,
    attendancePercent:
      card.attendanceTotal === 0
        ? null
        : Math.round((card.attendancePresent / card.attendanceTotal) * 1000) / 10,
    overallPercent:
      card.overallPercentMilli === null ? null : card.overallPercentMilli / 1000,
    gradingMethod: card.gradingMethod,
    publishedAt: card.publishedAt,
    authorName: card.createdBy
      ? (card.createdBy.user.preferredName ?? card.createdBy.user.name)
      : null,
    items: card.items,
    school,
    practice: (() => {
      if (!card.practice) return null;
      try {
        const rows = JSON.parse(card.practice) as PracticeAnnexureRow[];
        return Array.isArray(rows) && rows.length > 0 ? rows : null;
      } catch {
        // A malformed snapshot must not take the whole card down with it.
        return null;
      }
    })(),
  };
}

async function mayRead(
  ctx: ActiveContext,
  card: { classId: string; studentMembershipId: string; status: string },
): Promise<boolean> {
  // Staff who run or oversee the school see drafts as well as published.
  if (ctx.role === "ADMIN" || ctx.role === "PRINCIPAL") return true;

  if (ctx.role === "TEACHER" && ctx.membershipId) {
    const teaches = await db.classTeacher.findFirst({
      where: { schoolId: ctx.schoolId!, classId: card.classId, teacherMembershipId: ctx.membershipId },
      select: { id: true },
    });
    if (teaches) return true;
  }

  // Everybody else needs it to be published, first.
  if (card.status !== "PUBLISHED") return false;

  if (ctx.role === "STUDENT") return ctx.membershipId === card.studentMembershipId;

  // The relationship, not the role: a session whose active context is unset
  // (a guardian fresh from login has no school to activate) still reads their
  // own child's PUBLISHED card.
  const guardian = await db.guardianship.findFirst({
    where: {
      parentUserId: ctx.user.id,
      studentMembershipId: card.studentMembershipId,
      status: "ACTIVE",
    },
    select: { id: true },
  });
  if (guardian) return true;

  return false;
}

/** A child's own published cards. */
export async function myCards(ctx: ActiveContext) {
  if (ctx.role !== "STUDENT" || !ctx.membershipId || !ctx.schoolId) return [];
  return db.reportCard.findMany({
    where: {
      schoolId: ctx.schoolId,
      studentMembershipId: ctx.membershipId,
      status: "PUBLISHED",
    },
    orderBy: { publishedAt: "desc" },
    select: { id: true, title: true, publishedAt: true, overallPercentMilli: true },
    take: 50,
  });
}

/**
 * A guardian's child's published cards. Authorised against the guardianship.
 *
 * THE SCHOOL COMES FROM THE CHILD, NOT FROM THE SESSION, when a parent asks.
 * A parent with one child at each of two schools has one `activeSchoolId` and
 * two children, and the child switcher on the grades page moves between them
 * WITHOUT touching the session. Scoping this by `ctx.schoolId` would have shown
 * one child's cards and silently returned an empty list for the other — a wrong
 * answer that looks exactly like "no report cards yet". Staff have exactly one
 * school in play, so for them the session is still the right source.
 */
export async function cardsForChild(ctx: ActiveContext, studentMembershipId: string) {
  let schoolId: string | null = ctx.schoolId;

  if (ctx.role === "PARENT") {
    const guardian = await db.guardianship.findFirst({
      where: { parentUserId: ctx.user.id, studentMembershipId, status: "ACTIVE" },
      select: { student: { select: { schoolId: true } } },
    });
    if (!guardian) throw new AccessError("access.thatIsNotYourChild", "NOT_FOUND");
    schoolId = guardian.student.schoolId;
  } else if (ctx.role !== "ADMIN" && ctx.role !== "PRINCIPAL" && ctx.role !== "TEACHER") {
    throw new AccessError("access.notAllowed");
  }

  if (!schoolId) return [];

  return db.reportCard.findMany({
    where: {
      schoolId,
      studentMembershipId,
      // A guardian sees published cards only; staff see everything.
      ...(ctx.role === "PARENT" ? { status: "PUBLISHED" } : {}),
    },
    orderBy: { publishedAt: "desc" },
    select: { id: true, title: true, status: true, publishedAt: true, overallPercentMilli: true },
    take: 50,
  });
}
