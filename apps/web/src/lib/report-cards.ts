import "server-only";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { db } from "./db";
import { audit } from "./audit";
import { notify } from "./notify";
import { AccessError } from "./tenancy";
import { getAttendanceSummary } from "./attendance";
import { ensureSittings } from "./exams";
import type { ExamKind } from "./constants";
import { addDaysToKey, dateKeyInZone, todayKey } from "./dates";
import type { ActiveContext } from "./session";
import type { CardCoScholastic, CardSubject, GradeBand, ReportCardLayout } from "@edulink/contracts";
import { bandFor, combineTerms, DEFAULT_LAYOUT, kindWeighted, meanPercent, meanPoints, shownPercent, type PaperPart } from "./report-card-rules";
import { readReportCardConfig } from "./report-card-config";

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
  /** The term the exam reports into, when the school has one. */
  termId: string | null;
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
  subject: string | null;
  /** The paper's own band on the scale the card was built with. */
  letter: string | null;
};

/**
 * What a card keeps in its `layout` JSON besides the printed layout: the class
 * as it was named when the card was published. A class renamed or re-sectioned
 * after the cards went out must not rename the documents already in a drawer.
 */
type LayoutSnapshot = Partial<ReportCardLayout> & { className?: string; classSection?: string | null };

export type Card = {
  id: string;
  status: string;
  title: string;
  remark: string | null;
  studentMembershipId: string;
  /** The LEGAL name, as the leaving certificate, UDISE+ and the boards print it — not the preferred name the app shows elsewhere. */
  studentName: string;
  /** Frozen at publication on a published card; the live class on a draft. */
  className: string;
  classSection: string | null;
  fromDateKey: string;
  toDateKey: string;
  attendancePresent: number;
  attendanceTotal: number;
  attendancePercent: number | null;
  /** One decimal, as printed; the letter beside it is the band of this number. */
  overallPercent: number | null;
  gradingMethod: string;
  publishedAt: Date | null;
  /** The publish date as a calendar day in the SCHOOL'S zone — what "issued on" prints. */
  issuedDateKey: string | null;
  authorName: string | null;
  items: CardItem[];
  school: {
    name: string;
    timezone: string;
    logoPath: string | null;
    addressLine: string | null;
    city: string | null;
    region: string | null;
    postalCode: string | null;
    contactPhone: string | null;
    contactEmail: string | null;
    website: string | null;
    brandPrimary: string | null;
  };
  practice: PracticeAnnexureRow[] | null;
  /** The configurable card: subject rows with bands, the overall band and points, the class teacher's co-scholastic grades, and the scale and layout the card was built with. */
  subjects: CardSubject[];
  overallLetter: string | null;
  gradePoints: number | null;
  coScholastic: CardCoScholastic[];
  scale: { bands: GradeBand[]; coScale: { label: string; descriptor: string | null }[] };
  layout: ReportCardLayout;
  scope: "TERM" | "YEAR" | "PAPERS";
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
            series: { select: { id: true, name: true, kind: true, createdAt: true, termId: true } },
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
      termId: a.examSlot!.series.termId,
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
  /** Hand-picked papers; may be empty when a term or the year names them. */
  assignmentIds?: string[];
  fromDateKey?: string;
  toDateKey?: string;
  /**
   * Built FROM a term: the term's name is the title, its dates the
   * attendance window, and the card carries the term. A title or window
   * typed alongside is ignored — the term is the authority on both.
   */
  termId?: string | null;
  /**
   * THE ANNUAL CARD: every paper of every term of the year, each subject's
   * terms combined by the terms' weights. The year's dates are the window.
   */
  academicYearId?: string | null;
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
  const klass = await assertMayWriteCards(ctx, classId);

  const term = input.termId
    ? await db.term.findFirst({ where: { id: input.termId, schoolId: ctx.schoolId! }, select: { id: true, name: true, startDate: true, endDate: true, academicYearId: true } })
    : null;
  if (input.termId && !term) return { ok: false, errorKey: "terms.notFound" };
  const year = !term && input.academicYearId
    ? await db.academicYear.findFirst({
        where: { id: input.academicYearId, schoolId: ctx.schoolId! },
        select: { id: true, name: true, startDate: true, endDate: true, terms: { select: { id: true, name: true, weightPercent: true }, orderBy: { startDate: "asc" } } },
      })
    : null;
  if (!term && input.academicYearId && !year) return { ok: false, errorKey: "access.academicYearNotFound" };

  const typedTitle = input.title.trim().slice(0, 120);
  const title = term ? term.name : year && typedTitle.length < 2 ? year.name : typedTitle;
  if (title.length < 2) return { ok: false, errorKey: "reportCards.giveName" };
  const pickedIds = (input.assignmentIds ?? []).slice(0, 100);
  if (pickedIds.length === 0 && !term && !year) {
    return { ok: false, errorKey: "reportCards.chooseOne" };
  }

  const school = await db.school.findUniqueOrThrow({
    where: { id: ctx.schoolId! },
    select: { timezone: true },
  });
  const config = await readReportCardConfig(ctx.schoolId!);
  // Re-queried against THIS class. An assignment id from another class — or
  // another school — is simply not found, so a forged form cannot put somebody
  // else's test on this school's report cards.
  // …and an EXAM paper. A homework id smuggled into the form is dropped here:
  // the card is the exam record, and the grades page is where homework lives.
  // A term or the year names its own papers — every scheduled paper of a
  // series reporting into it — when none are picked. Picked papers are the
  // teacher's list as it stands: the term then fixes only the title and the
  // window, as it always did.
  const termIds = pickedIds.length === 0 ? (term ? [term.id] : year ? year.terms.map((t) => t.id) : null) : null;
  const assignments = await db.assignment.findMany({
    where: {
      ...(pickedIds.length > 0 ? { id: { in: pickedIds } } : {}),
      schoolId: ctx.schoolId!,
      classId,
      examSlotId: { not: null },
      examSlot: { series: { archivedAt: null, ...(termIds ? { termId: { in: termIds } } : {}) } },
    },
    select: {
      id: true,
      title: true,
      category: true,
      pointsMilli: true,
      examSlot: { select: { subject: true, position: true, series: { select: { name: true, kind: true, termId: true, createdAt: true } } } },
    },
  });
  if (assignments.length === 0) {
    return { ok: false, errorKey: termIds ? "reportCards.noPapersInTerm" : "reportCards.notThisClass" };
  }
  // Keep the teacher's chosen order rather than the database's; a term's own
  // menu reads in the order the papers were sat.
  if (pickedIds.length > 0) {
    const order = new Map(pickedIds.map((id, index) => [id, index]));
    assignments.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  } else {
    assignments.sort((a, b) => a.examSlot!.series.createdAt.getTime() - b.examSlot!.series.createdAt.getTime() || a.examSlot!.position - b.examSlot!.position);
  }

  /**
   * THE CARD'S PERIOD IS THE EXAM'S, NOT TODAY'S. A card generated a week
   * after the final — or a year later, from the archive — used to carry
   * "the last 120 days from whenever the button was pressed", which printed
   * 2026 dates on a 2023–24 card and an attendance line of "0 of 0 days".
   * Unless the office says otherwise, the window runs from the start of
   * the academic year the papers fall in (or 120 days before the first
   * paper, when no year is set up) to the last paper.
   */
  const paperDays = (
    await db.examSlot.findMany({
      where: { assignments: { some: { id: { in: assignments.map((a) => a.id) } } } },
      select: { dateKey: true },
    })
  ).map((slot) => slot.dateKey).sort();
  const lastPaper = paperDays.at(-1) ?? todayKey(school.timezone);
  const firstPaper = paperDays[0] ?? lastPaper;
  const yearOfPapers = await db.academicYear.findFirst({
    where: { schoolId: ctx.schoolId!, startDate: { lte: new Date(`${lastPaper}T23:59:59Z`) } },
    orderBy: { startDate: "desc" },
    select: { startDate: true },
  });
  const toDateKey = term ? term.endDate.toISOString().slice(0, 10) : year ? year.endDate.toISOString().slice(0, 10) : (input.toDateKey ?? lastPaper);
  const fromDateKey = term
    ? term.startDate.toISOString().slice(0, 10)
    : year
    ? year.startDate.toISOString().slice(0, 10)
    : input.fromDateKey ??
    (yearOfPapers && yearOfPapers.startDate.toISOString().slice(0, 10) <= firstPaper
      ? yearOfPapers.startDate.toISOString().slice(0, 10)
      : addDaysToKey(firstPaper, -DEFAULT_WINDOW_DAYS));
  if (fromDateKey > toDateKey) {
    return { ok: false, errorKey: "reportCards.windowBackwards" };
  }

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

    /* THE SUBJECT ROWS. Each subject's papers combined by the weight of their
     * kind inside the term (report-card-rules.ts), and on the annual card each
     * term's result combined by the term's share of the year. When the school
     * weights nothing, the row is marks over maximum, and the row also KEEPS
     * THE MARKS AND MAXIMUM it was made from, so the overall below can be the
     * sum of the rows and a parent can add the rows up to it.
     *
     * Unmarked papers are dropped rather than counted as zero: a test the
     * child has not sat yet is not a mark of nought, and treating it as one is
     * the single most damaging arithmetic mistake a report card can make.
     *
     * EVERY PERCENT IS ROUNDED ONCE, to the one decimal the card prints, and
     * the letter is read from that rounded number — never from the raw figure
     * behind it, which is how 90.96 used to print "91.0 % A2". */
    const bySubject = new Map<string, typeof assignments>();
    for (const a of assignments) {
      const list = bySubject.get(a.examSlot!.subject) ?? [];
      list.push(a);
      bySubject.set(a.examSlot!.subject, list);
    }
    const partOf = (a: (typeof assignments)[number]): PaperPart => ({
      label: a.examSlot!.series.name,
      kind: a.examSlot!.series.kind,
      scoreMilli: gradeBy.get(`${a.id}:${row.studentMembershipId}`) ?? null,
      pointsMilli: a.pointsMilli,
    });
    let weighted = false;
    const subjects: CardSubject[] = [];
    for (const [subject, papers] of bySubject) {
      let percent: number | null;
      let parts: CardSubject["parts"];
      let scoreMilli: number | null = null;
      let pointsMilli: number | null = null;
      if (year) {
        const termParts = year.terms
          .map((t) => {
            const own = papers.filter((p) => p.examSlot!.series.termId === t.id);
            if (own.length === 0) return null;
            const w = kindWeighted(own.map(partOf), config.kindWeights);
            return { termId: t.id, name: t.name, percent: w.percent, weightPercent: t.weightPercent };
          })
          .filter((t): t is NonNullable<typeof t> => t !== null);
        const combined = combineTerms(termParts);
        percent = combined.percent;
        parts = combined.parts.map((p) => ({ label: p.name, kind: "TERM", scoreMilli: null, pointsMilli: null, percent: p.percent, weight: p.weight }));
        weighted = true;
      } else {
        const marked = papers.map(partOf).filter((p): p is PaperPart & { scoreMilli: number; pointsMilli: number } => p.scoreMilli !== null && p.pointsMilli !== null && p.pointsMilli > 0);
        const w = kindWeighted(papers.map(partOf), config.kindWeights);
        percent = w.percent;
        parts = w.parts;
        if (marked.length > 0) {
          scoreMilli = marked.reduce((a, p) => a + p.scoreMilli, 0);
          pointsMilli = marked.reduce((a, p) => a + p.pointsMilli, 0);
        }
        if (w.method === "weighted") weighted = true;
      }
      const shown = shownPercent(percent);
      const band = bandFor(shown, config.bands);
      subjects.push({ subject, percent: shown, letter: band?.label ?? null, points: band?.points ?? null, parts, scoreMilli, pointsMilli });
    }

    /* THE OVERALL. Weighted: the mean of the subject percents as printed.
     * Otherwise MARKS OVER MAXIMUM ACROSS THE EXAMS ON THE CARD — the sum of
     * the rows' marks over the sum of their maximums, not the mean of the
     * rows' percents, which differs the moment two papers carry different
     * maximums; and not the category-weighted figure the grades page shows,
     * which blends homework in. A report card's number must be reproducible
     * by a parent with the card in one hand and a calculator in the other,
     * and the card says under the figure which of the two rules made it. */
    const scored = subjects.reduce((a, s) => a + (s.scoreMilli ?? 0), 0);
    const max = subjects.reduce((a, s) => a + (s.pointsMilli ?? 0), 0);
    const overall = weighted
      ? { percent: shownPercent(meanPercent(subjects)), method: "weighted" }
      : { percent: shownPercent(max > 0 ? (scored / max) * 100 : null), method: "exams" };
    const overallBand = bandFor(overall.percent, config.bands);
    const points = meanPoints(subjects);
    const layout: LayoutSnapshot = { ...config.layout, className: klass.name, classSection: klass.section };

    const data = {
      schoolId: ctx.schoolId!,
      classId,
      studentMembershipId: row.studentMembershipId,
      title,
      termId: term?.id ?? null,
      status: "DRAFT",
      fromDateKey,
      toDateKey,
      attendancePresent: attendance.counts.PRESENT + attendance.counts.LATE,
      attendanceTotal: attendance.total,
      overallPercentMilli:
        overall.percent === null ? null : Math.round(overall.percent * 1000),
      gradingMethod: overall.method,
      academicYearId: term?.academicYearId ?? year?.id ?? null,
      overallLetter: overallBand?.label ?? null,
      gradePointsMilli: points === null ? null : Math.round(points * 1000),
      subjects: JSON.stringify(subjects),
      scale: JSON.stringify({ bands: config.bands, coScale: config.coScholastic.scale }),
      layout: JSON.stringify(layout),
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
    // …except the class teacher's co-scholastic grades, which are not a
    // snapshot of anything: they were typed on this card and stay on it.
    await db.reportCardItem.deleteMany({ where: { reportCardId: card.id, kind: "SCHOLASTIC" } });
    await db.reportCardItem.createMany({
      data: assignments.map((a, position) => {
        const scoreMilli = gradeBy.get(`${a.id}:${row.studentMembershipId}`) ?? null;
        const paperPercent = scoreMilli !== null && a.pointsMilli ? (scoreMilli / a.pointsMilli) * 100 : null;
        return {
          schoolId: ctx.schoolId!,
          reportCardId: card.id,
          assignmentId: a.id,
          title: a.title,
          category: a.category,
          scoreMilli,
          pointsMilli: a.pointsMilli,
          position,
          subject: a.examSlot!.subject,
          kind: "SCHOLASTIC",
          letter: bandFor(shownPercent(paperPercent), config.bands)?.label ?? null,
        };
      }),
    });
  }

  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.user.id,
    action: "reportCard.generate",
    targetType: "Class",
    targetId: classId,
    meta: { title, created, updated, skippedPublished, assessments: assignments.length, scope: term ? "TERM" : year ? "YEAR" : "PAPERS" },
  });

  return { ok: true, created, updated, skippedPublished };
}

/**
 * The class teacher's co-scholastic grades on one draft card: an area from
 * the school's list, a grade from its scale, a note. Replaced as a set.
 */
export async function setCoScholastic(
  ctx: ActiveContext,
  cardId: string,
  grades: { area: string; grade: string | null; note?: string }[],
): Promise<{ ok: boolean; errorKey?: TranslationKey }> {
  const card = await db.reportCard.findFirst({
    where: { id: cardId, schoolId: ctx.schoolId ?? "" },
    select: { id: true, classId: true, status: true },
  });
  if (!card) return { ok: false, errorKey: "reportCards.notInSchool" };
  await assertMayWriteCards(ctx, card.classId);
  if (card.status === "PUBLISHED") return { ok: false, errorKey: "reportCards.publishedLocked" };

  const config = await readReportCardConfig(ctx.schoolId!);
  const areaOf = new Map(config.coScholastic.areas.map((a) => [a.toLowerCase(), a]));
  const gradeOf = new Map(config.coScholastic.scale.map((g) => [g.label.toLowerCase(), g.label]));
  const rows: { area: string; grade: string | null; note: string | null }[] = [];
  for (const g of grades) {
    const area = areaOf.get(g.area.trim().toLowerCase());
    if (!area) return { ok: false, errorKey: "reportCards.notAnArea" };
    const grade = g.grade === null || g.grade.trim() === "" ? null : gradeOf.get(g.grade.trim().toLowerCase());
    if (grade === undefined) return { ok: false, errorKey: "reportCards.notAGrade" };
    if (rows.some((r) => r.area === area)) continue;
    rows.push({ area, grade, note: g.note?.trim().slice(0, 200) || null });
  }

  await db.reportCardItem.deleteMany({ where: { reportCardId: card.id, kind: "CO_SCHOLASTIC" } });
  if (rows.length > 0) {
    await db.reportCardItem.createMany({
      data: rows.map((r, position) => ({ schoolId: ctx.schoolId!, reportCardId: card.id, title: r.area, kind: "CO_SCHOLASTIC", letter: r.grade, comment: r.note, position })),
    });
  }
  await audit({ schoolId: ctx.schoolId, actorUserId: ctx.user.id, action: "reportCard.coScholastic", targetType: "ReportCard", targetId: card.id, meta: { areas: rows.length } });
  return { ok: true };
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
      layout: true,
      studentMembershipId: true,
      student: { select: { userId: true, user: { select: { name: true, preferredName: true } } } },
    },
  });
  if (drafts.length === 0) return { ok: false, errorKey: "reportCards.noDrafts" };

  // THE CLASS NAME FREEZES WITH THE CARD. A draft reads the live class; the
  // published document carries the class as it was called on the day it went
  // out, so a section renamed in May does not rename March's cards. The label
  // rides in the layout snapshot, which is already one JSON per card.
  const klass = await db.class.findFirstOrThrow({ where: { id: classId, schoolId: ctx.schoolId! }, select: { name: true, section: true } });
  const currentLayout = await readReportCardConfig(ctx.schoolId!);
  for (const draft of drafts) {
    let snapshot: LayoutSnapshot = currentLayout.layout;
    try {
      if (draft.layout) snapshot = JSON.parse(draft.layout) as LayoutSnapshot;
    } catch {
      // A malformed snapshot is replaced by the school's layout of today, which is what the page would have shown for it.
    }
    await db.reportCard.update({
      where: { id: draft.id },
      // …and so does the pupil's legal name: a name the office corrects in
      // June does not rewrite March's card (lib/legal-name.ts).
      data: { layout: JSON.stringify({ ...snapshot, className: klass.name, classSection: klass.section }), studentName: draft.student.user.name },
    });
  }

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
    data: { status: "DRAFT", publishedAt: null, studentName: null },
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
      overallLetter: true,
      student: { select: { user: { select: { name: true, preferredName: true } } } },
      items: { where: { kind: "CO_SCHOLASTIC" }, orderBy: { position: "asc" }, select: { title: true, letter: true, comment: true } },
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
      termId: true,
      academicYearId: true,
      overallLetter: true,
      gradePointsMilli: true,
      subjects: true,
      scale: true,
      layout: true,
      studentName: true,
      class: { select: { name: true, section: true } },
      student: { select: { user: { select: { name: true } } } },
      createdBy: { select: { user: { select: { name: true, preferredName: true } } } },
      items: {
        orderBy: { position: "asc" },
        select: { title: true, category: true, scoreMilli: true, pointsMilli: true, subject: true, kind: true, letter: true, comment: true },
      },
    },
  });
  if (!card) return null;

  const allowed = await mayRead(ctx, card);
  if (!allowed) return null;

  const school = await db.school.findUniqueOrThrow({
    where: { id: card.schoolId },
    select: { name: true, timezone: true, logoPath: true, addressLine: true, city: true, region: true, postalCode: true, contactPhone: true, contactEmail: true, website: true, brandPrimary: true },
  });
  const letterhead = school;
  // A card built before the rules existed reads the school's rules of today;
  // one built since keeps the snapshot it was issued with.
  const current = await readReportCardConfig(card.schoolId);
  const parseJson = <T,>(raw: string | null, fallback: T): T => {
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  };

  // The class label frozen at publication, when the card has one and is
  // published; a draft, a withdrawn card and a card from before the label was
  // kept all read the live class.
  const { className: frozenName, classSection: frozenSection, ...layoutSnapshot } = parseJson<LayoutSnapshot>(card.layout, current.layout);
  const frozen = card.status === "PUBLISHED" && typeof frozenName === "string";

  // EVERY PERCENT ROUNDED ONCE, to the decimal the card prints, and every
  // letter read from that rounded figure on the card's own scale — so a
  // card issued before the rounding rule shows "91.0 %" with the band of
  // 91.0 rather than the band of the 90.96 behind it. A card with no scale
  // of its own keeps the letters it was written with.
  const storedScale = parseJson<{ bands: GradeBand[]; coScale: { label: string; descriptor: string | null }[] } | null>(card.scale, null);
  const rounded = (percent: number | null, letter: string | null, points: number | null) => {
    const shown = shownPercent(percent);
    if (!storedScale) return { percent: shown, letter, points };
    const band = bandFor(shown, storedScale.bands);
    return { percent: shown, letter: band?.label ?? null, points: band?.points ?? null };
  };
  const overall = rounded(card.overallPercentMilli === null ? null : card.overallPercentMilli / 1000, card.overallLetter, null);

  return {
    id: card.id,
    status: card.status,
    title: card.title,
    remark: card.remark,
    studentMembershipId: card.studentMembershipId,
    // The legal name: a report card is a formal paper and prints the name the
    // leaving certificate, UDISE+ and the boards print. The preferred name is
    // for the app's own screens.
    studentName: card.studentName ?? card.student.user.name,
    className: frozen ? frozenName : card.class.name,
    classSection: frozen ? (frozenSection ?? null) : card.class.section,
    fromDateKey: card.fromDateKey,
    toDateKey: card.toDateKey,
    attendancePresent: card.attendancePresent,
    attendanceTotal: card.attendanceTotal,
    attendancePercent:
      card.attendanceTotal === 0
        ? null
        // Whole percent — the same rounding the attendance pages use, so the
        // card and the page never disagree by a decimal.
        : Math.round((card.attendancePresent / card.attendanceTotal) * 100),
    overallPercent: overall.percent,
    gradingMethod: card.gradingMethod,
    publishedAt: card.publishedAt,
    issuedDateKey: card.publishedAt ? dateKeyInZone(card.publishedAt, school.timezone) : null,
    authorName: card.createdBy
      ? (card.createdBy.user.preferredName ?? card.createdBy.user.name)
      : null,
    items: card.items.filter((i) => i.kind !== "CO_SCHOLASTIC").map((i) => ({ title: i.title, category: i.category, scoreMilli: i.scoreMilli, pointsMilli: i.pointsMilli, subject: i.subject, letter: i.letter })),
    school: letterhead,
    subjects: parseJson<CardSubject[]>(card.subjects, []).map((s) => ({ ...s, ...rounded(s.percent, s.letter, s.points) })),
    overallLetter: overall.letter,
    gradePoints: card.gradePointsMilli === null ? null : card.gradePointsMilli / 1000,
    coScholastic: card.items.filter((i) => i.kind === "CO_SCHOLASTIC").map((i) => ({ area: i.title, grade: i.letter, note: i.comment })),
    scale: storedScale ?? { bands: current.bands, coScale: current.coScholastic.scale },
    layout: { ...DEFAULT_LAYOUT, ...layoutSnapshot },
    scope: card.termId ? "TERM" : card.academicYearId ? "YEAR" : "PAPERS",
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

/**
 * The line under the overall figure that says which rule produced it. ONE
 * FUNCTION FOR THE PAGE AND THE PDF, so the two can never describe the same
 * number differently: "weighted" is the mean of subjects each weighted by
 * exam kind, "exams" is marks over maximum across the card, and a card from
 * before either rule ("points") is described by what it lists.
 */
export function gradingHintKey(card: Pick<Card, "overallPercent" | "gradingMethod">): TranslationKey {
  if (card.overallPercent === null) return "reportView.noMarksCounted";
  if (card.gradingMethod === "weighted") return "reportView.weightedExplainerShort";
  if (card.gradingMethod === "exams") return "reportView.examsOnly";
  return "reportView.acrossBelow";
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
  } else if (ctx.role === "TEACHER") {
    // Their own pupils only — the list carries draft status and the overall
    // figure, which a teacher across the corridor has no business reading.
    if (!ctx.membershipId || !schoolId) throw new AccessError("access.notAllowed");
    const teaches = await db.classTeacher.count({
      where: {
        schoolId,
        teacherMembershipId: ctx.membershipId,
        class: { enrollments: { some: { studentMembershipId, status: "ACTIVE" } } },
      },
    });
    if (teaches === 0) throw new AccessError("access.notYourPupil", "NOT_FOUND");
  } else if (ctx.role !== "ADMIN" && ctx.role !== "PRINCIPAL") {
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
