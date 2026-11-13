/**
 * TA-009 (testing analysis of 13 November 2026, High): a report-card set is
 * the class row and the title, with no year.
 *
 * A term card's title is the term's name, a term's name is unique only inside
 * its year (src/lib/terms.ts), and a class row can outlive a year (a class that
 * stays, a pupil held back in it, a row picked again at promotion). Yet
 * `generateCards`, `publishCards` and `withdrawCards` (src/lib/report-cards.ts)
 * find a set by class and title alone, and the set's signatures are keyed
 * `classId|title` (src/lib/signatures.ts). So this year's "Term 1" and last
 * year's are one set: Generate skips whoever holds last year's published card,
 * Take back returns last year's issued cards to draft and deletes the head's
 * signature, the next Generate overwrites a staying pupil's old card, Publish
 * re-issues a moved-on pupil's old card dated today and tells their family,
 * and a card first published this year stands at once on last year's signature.
 *
 * One ZZ school of this suite's own (made here, removed after). LAST YEAR:
 * class 5A with two pupils and its class teacher; the term "ZZ Term 1"; one
 * marked paper; the cards generated from the term, published, and signed by
 * the head. THE YEAR TURNS: a new current year with a term of the same name
 * (the office's ordinary press, through `createTerm`); one pupil stays in the
 * row, one moves on to 6A, one new pupil joins; this year's paper is marked.
 * THIS YEAR the class teacher presses what the builder offers: Generate from
 * the term, Publish, Take back, Generate, Publish. Everything is done once;
 * each consequence the finding names is its own case.
 *
 * EXPECTED ONCE FIXED: this year's presses make and move this year's cards
 * only (or Generate refuses outright, saying why, and nothing else is
 * pressed); last year's two cards stay issued as they were, with the head's
 * signature and no second notice to anybody. A fix that adds the term or the
 * year to publishCards / withdrawCards passes it at the calls marked below.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { fixturePng } from "../scripts/png";
import { generateCards, getCard, publishCards, withdrawCards, type GenerateResult } from "@/lib/report-cards";
import { DEFAULT_REPORT_CARD_CONFIG } from "@/lib/report-card-rules";
import { saveReportCardConfig } from "@/lib/report-card-config";
import { decidePaperSignature, saveMySignature } from "@/lib/signatures";
import { createTerm, type TermResult } from "@/lib/terms";
import { classCode } from "@/lib/codes";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-ta009-${who}-${STAMP}@test.invalid`;
const TITLE = "ZZ Term 1";
const HEAD_INK = `data:image/png;base64,${fixturePng(320, 110).toString("base64")}`;
/** When last year's set went out and when the head signed it: a year passes between the two halves of this suite. */
const ISSUED_LAST_YEAR = "2025-11-05T06:00:00.000Z";
const SIGNED_LAST_YEAR = "2025-11-06T06:00:00.000Z";
const READY = ["notifTitle.reportCardReady", "notifTitle.childReportCardReady"];
const ids: Record<string, string> = {};

async function as(who: string, role: string): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids[who]!, { schoolId: ids.school!, role: role as never });
  const ctx = await getSession();
  if (!ctx) throw new Error(`no session for ${who}`);
  return ctx;
}

type Issued = { status: string; publishedAt: string | null; termId: string | null; academicYearId: string | null; overallPercentMilli: number | null };
/** One card row as it stands, by its id; "gone" if the row no longer exists. */
async function issued(cardId: string): Promise<Issued | "gone"> {
  const card = await db.reportCard.findUnique({ where: { id: cardId }, select: { status: true, publishedAt: true, termId: true, academicYearId: true, overallPercentMilli: true } });
  return card ? { ...card, publishedAt: card.publishedAt?.toISOString() ?? null } : "gone";
}
type Line = { status: string; decidedAt: string | null } | null;
/** The head's line on a card, as a reader of the card is shown it (getCard), not as the signature table stores it. */
async function headLine(cardId: string): Promise<Line> {
  const card = await getCard(await as("admin", "ADMIN"), cardId);
  const line = card?.signatures.find((s) => s.slot === "RIGHT");
  return line ? { status: line.status, decidedAt: line.decidedAt } : null;
}
const told = (who: string) => db.notification.count({ where: { userId: ids[who]!, titleKey: { in: READY } } });

/** A marked paper of the class under a term: an exam series, its slot, the class's sitting and each pupil's marks out of 50. */
async function paper(tag: string, termId: string, dateKey: string, marks: Record<string, number>): Promise<void> {
  const S = ids.school!;
  const series = await db.examSeries.create({ data: { schoolId: S, name: `ZZ TA009 Unit Test ${tag}`, gradeLevel: "5", kind: "UNIT_TEST", termId, publishedAt: new Date() }, select: { id: true, name: true } });
  const slot = await db.examSlot.create({ data: { schoolId: S, seriesId: series.id, subject: "ZZ Maths", dateKey, pointsMilli: 50_000, position: 0 }, select: { id: true } });
  const sitting = await db.assignment.create({
    data: { schoolId: S, classId: ids.klass!, authorMembershipId: ids.leadM!, title: `${series.name} · ZZ Maths`, category: "Exam", pointsMilli: 50_000, examSlotId: slot.id, publishedAt: new Date() },
    select: { id: true },
  });
  for (const [who, score] of Object.entries(marks)) {
    await db.grade.create({ data: { schoolId: S, assignmentId: sitting.id, studentMembershipId: ids[`${who}M`]!, scoreMilli: score * 1000, gradedByMembershipId: ids.leadM! } });
  }
}

type Snapshot = { stayed: Issued | "gone"; movedOn: Issued | "gone"; headLineStayed: Line; headLineMovedOn: Line; toldMovedOn: number; toldMovedOnGuardian: number };
async function snapshot(): Promise<Snapshot> {
  return {
    stayed: await issued(ids.cardStayed!),
    movedOn: await issued(ids.cardMovedOn!),
    headLineStayed: await headLine(ids.cardStayed!),
    headLineMovedOn: await headLine(ids.cardMovedOn!),
    toldMovedOn: await told("movedOn"),
    toldMovedOnGuardian: await told("guardian"),
  };
}

let lastYearMade: { generated: GenerateResult; published: Awaited<ReturnType<typeof publishCards>> };
let sameNameTerm: TermResult;
let rollThisYear: string[];
let lastYear: Snapshot;
let thisYear: Snapshot;
let gen1: GenerateResult;
let withdrawn: Awaited<ReturnType<typeof withdrawCards>> | null = null;
/** Each card of THIS year as it stood after this year's first Publish: whose it is, and the head's line on it. */
const firstIssue: { pupil: string; line: Line; signedBeforeIssue: boolean }[] = [];

beforeAll(async () => {
  ids.school = (
    await db.school.create({
      data: { name: `ZZ TA009 Card School ${STAMP}`, slug: `zz-ta009-${STAMP}`, code: `ZTA9${String(STAMP).slice(-6)}`, contactEmail: MAIL("contact"), timezone: "Asia/Kolkata", isTestFixture: true },
      select: { id: true },
    })
  ).id;
  const S = ids.school;
  const user = async (who: string, name: string) => {
    ids[who] = (await db.user.create({ data: { name, email: MAIL(who), prefs: "{}" }, select: { id: true } })).id;
  };
  const member = async (who: string, role: string) => {
    ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: S, role, status: "ACTIVE" }, select: { id: true } })).id;
  };
  for (const [who, name, role] of [
    ["admin", "ZZ TA009 Admin", "ADMIN"],
    ["head", "ZZ TA009 Head", "PRINCIPAL"],
    ["lead", "ZZ TA009 Class Teacher", "TEACHER"],
    ["stayed", "ZZ TA009 Pupil Who Stayed", "STUDENT"],
    ["movedOn", "ZZ TA009 Pupil Who Moved On", "STUDENT"],
    ["joined", "ZZ TA009 Pupil Who Joined", "STUDENT"],
  ] as const) {
    await user(who, name);
    await member(who, role);
  }
  await user("guardian", "ZZ TA009 Guardian Of Moved On");
  await db.guardianship.create({ data: { parentUserId: ids.guardian!, studentMembershipId: ids.movedOnM!, studentSchoolId: S, relation: "PARENT", status: "ACTIVE" } });

  /* ------------------------------------------------------------ last year */
  ids.y1 = (await db.academicYear.create({ data: { schoolId: S, name: "ZZ 2025–26", startDate: new Date("2025-06-01T00:00:00Z"), endDate: new Date("2026-04-30T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
  const term1 = await createTerm(await as("admin", "ADMIN"), ids.y1, { name: TITLE, startDateKey: "2025-06-01", endDateKey: "2025-10-31" });
  if (!term1.ok) throw new Error(`last year's term was refused: ${term1.errorKey}`);
  ids.t1 = term1.termId;
  ids.klass = (await db.class.create({ data: { schoolId: S, name: "ZZ TA009 5A", gradeLevel: "5", joinCode: classCode() }, select: { id: true } })).id;
  await db.classTeacher.create({ data: { schoolId: S, classId: ids.klass, teacherMembershipId: ids.leadM!, role: "LEAD" } });
  for (const who of ["stayed", "movedOn"]) await db.enrollment.create({ data: { schoolId: S, classId: ids.klass, studentMembershipId: ids[`${who}M`]!, status: "ACTIVE" } });
  await paper("2025-26", ids.t1, "2025-09-15", { stayed: 30, movedOn: 40 });

  // The rules name the head on the right-hand line; the head keeps a signature.
  await saveReportCardConfig(await as("admin", "ADMIN"), { ...DEFAULT_REPORT_CARD_CONFIG, layout: { ...DEFAULT_REPORT_CARD_CONFIG.layout, signerRight: "PRINCIPAL" } });
  await saveMySignature(await as("head", "PRINCIPAL"), HEAD_INK);

  const generated = await generateCards(await as("lead", "TEACHER"), ids.klass, { title: "", termId: ids.t1 });
  const published = await publishCards(await as("lead", "TEACHER"), ids.klass, TITLE);
  lastYearMade = { generated, published };
  const waiting = await db.paperSignature.findFirstOrThrow({ where: { schoolId: S, paperKind: "REPORT_CARD_SET", slot: "RIGHT" }, select: { id: true } });
  await decidePaperSignature(await as("head", "PRINCIPAL"), waiting.id, true);
  for (const who of ["stayed", "movedOn"] as const) {
    const key = who === "stayed" ? "cardStayed" : "cardMovedOn";
    ids[key] = (await db.reportCard.findFirstOrThrow({ where: { schoolId: S, classId: ids.klass, studentMembershipId: ids[`${who}M`]!, title: TITLE }, select: { id: true } })).id;
  }
  // A year passes: the set went out, and was signed, last November.
  await db.reportCard.updateMany({ where: { id: { in: [ids.cardStayed!, ids.cardMovedOn!] } }, data: { publishedAt: new Date(ISSUED_LAST_YEAR) } });
  await db.paperSignature.updateMany({ where: { id: waiting.id }, data: { decidedAt: new Date(SIGNED_LAST_YEAR) } });
  lastYear = await snapshot();

  /* ------------------------------------------------------- the year turns */
  await db.academicYear.update({ where: { id: ids.y1 }, data: { isCurrent: false, closedAt: new Date("2026-05-01T00:00:00Z") } });
  ids.y2 = (await db.academicYear.create({ data: { schoolId: S, name: "ZZ 2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
  // The office names this year's first term as it named last year's: the ordinary press, and the library accepts it.
  sameNameTerm = await createTerm(await as("admin", "ADMIN"), ids.y2, { name: TITLE, startDateKey: "2026-06-01", endDateKey: "2026-10-31" });
  if (!sameNameTerm.ok) throw new Error(`this year's term was refused: ${sameNameTerm.errorKey}`);
  ids.t2 = sameNameTerm.termId;
  // The row lives on: one pupil is held back in it, one moves on to 6A, one new pupil joins.
  await db.enrollment.updateMany({ where: { classId: ids.klass, studentMembershipId: ids.stayedM! }, data: { repeating: true } });
  await db.enrollment.updateMany({ where: { classId: ids.klass, studentMembershipId: ids.movedOnM! }, data: { status: "REMOVED", removedAt: new Date("2026-05-15T00:00:00Z") } });
  const next = await db.class.create({ data: { schoolId: S, name: "ZZ TA009 6A", gradeLevel: "6", joinCode: classCode() }, select: { id: true } });
  await db.enrollment.create({ data: { schoolId: S, classId: next.id, studentMembershipId: ids.movedOnM!, status: "ACTIVE" } });
  await db.enrollment.create({ data: { schoolId: S, classId: ids.klass, studentMembershipId: ids.joinedM!, status: "ACTIVE" } });
  await paper("2026-27", ids.t2, "2026-09-15", { stayed: 45, joined: 35 });
  rollThisYear = (
    await db.enrollment.findMany({ where: { classId: ids.klass, status: "ACTIVE" }, select: { student: { select: { user: { select: { name: true } } } } }, orderBy: { student: { user: { name: "asc" } } } })
  ).map((e) => e.student.user.name);

  /* ------------------------------------------- this year's ordinary presses */
  gen1 = await generateCards(await as("lead", "TEACHER"), ids.klass, { title: "", termId: ids.t2 });
  if (gen1.ok) {
    // (A fix that makes the term or the year part of a set passes this year's — ids.t2 / ids.y2 — to these three calls.
    // The fix made gives this year's set a title of its own where the row holds the name from last year, reported by
    // Generate, and these calls pass the set's title as the builder lists it and its buttons send it.)
    const setTitle = gen1.title ?? TITLE;
    await publishCards(await as("lead", "TEACHER"), ids.klass, setTitle);
    const cardsOfThisYear = await db.reportCard.findMany({
      where: { schoolId: S, classId: ids.klass, academicYearId: ids.y2, status: "PUBLISHED" },
      select: { id: true, publishedAt: true, student: { select: { user: { select: { name: true } } } } },
      orderBy: { student: { user: { name: "asc" } } },
    });
    for (const card of cardsOfThisYear) {
      const line = await headLine(card.id);
      const signedBeforeIssue = line?.status === "SIGNED" && line.decidedAt !== null && card.publishedAt !== null && new Date(line.decidedAt) < card.publishedAt;
      firstIssue.push({ pupil: card.student.user.name, line, signedBeforeIssue });
    }
    withdrawn = await withdrawCards(await as("lead", "TEACHER"), ids.klass, setTitle);
    await generateCards(await as("lead", "TEACHER"), ids.klass, { title: "", termId: ids.t2 });
    await publishCards(await as("lead", "TEACHER"), ids.klass, setTitle);
  }
  thisYear = await snapshot();
}, 180_000);

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = await db.user.findMany({ where: { email: { startsWith: "zz-ta009-", endsWith: `-${STAMP}@test.invalid` } }, select: { id: true } });
  const userIds = users.map((u) => u.id);
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.notification.deleteMany({ where: { userId: { in: userIds } } });
  if (ids.school) {
    await db.auditLog.deleteMany({ where: { OR: [{ schoolId: ids.school }, { actorUserId: { in: userIds } }] } });
    await db.school.deleteMany({ where: { id: ids.school } });
  }
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("TA-009: a class row used in two years, each with a term of the same name", () => {
  it("the arrangement: last year's two cards are issued and signed by the head, the families told once; this year has a term of the same name and a roll of two", () => {
    expect(lastYearMade.generated).toMatchObject({ ok: true, created: 2, updated: 0, skippedPublished: 0 });
    expect(lastYearMade.published).toMatchObject({ ok: true, published: 2 });
    const asIssued = { status: "PUBLISHED", publishedAt: ISSUED_LAST_YEAR, termId: ids.t1, academicYearId: ids.y1 };
    expect(lastYear).toEqual({
      stayed: { ...asIssued, overallPercentMilli: 60_000 },
      movedOn: { ...asIssued, overallPercentMilli: 80_000 },
      headLineStayed: { status: "SIGNED", decidedAt: SIGNED_LAST_YEAR },
      headLineMovedOn: { status: "SIGNED", decidedAt: SIGNED_LAST_YEAR },
      toldMovedOn: 1,
      toldMovedOnGuardian: 1,
    });
    expect(sameNameTerm).toMatchObject({ ok: true });
    expect(rollThisYear).toEqual(["ZZ TA009 Pupil Who Joined", "ZZ TA009 Pupil Who Stayed"]);
  });

  it("⚠ Generate from this year's term makes this year's two cards and skips nobody (or refuses outright, saying why)", () => {
    if (!gen1.ok) {
      expect(gen1.errorKey, "a refusal says why").toBeTruthy();
      return;
    }
    expect({ made: (gen1.created ?? 0) + (gen1.updated ?? 0), skippedPublished: gen1.skippedPublished ?? 0 }).toEqual({ made: 2, skippedPublished: 0 });
  });

  it("⚠ Take back takes back this year's two cards, not last year's with them", () => {
    if (!gen1.ok) return; // Generate refused: nothing of this year was published, and nothing was taken back.
    expect(withdrawn).toMatchObject({ ok: true, withdrawn: 2 });
  });

  it("⚠ last year's two cards are still issued as they were: published last November, with last year's term, year and marks", () => {
    expect({ stayed: thisYear.stayed, movedOn: thisYear.movedOn }).toEqual({ stayed: lastYear.stayed, movedOn: lastYear.movedOn });
  });

  it("⚠ last year's set keeps the head's signature", () => {
    expect({ stayed: thisYear.headLineStayed, movedOn: thisYear.headLineMovedOn }).toEqual({
      stayed: { status: "SIGNED", decidedAt: SIGNED_LAST_YEAR },
      movedOn: { status: "SIGNED", decidedAt: SIGNED_LAST_YEAR },
    });
  });

  it("⚠ a card first published this year does not stand on a signature the head gave last year", () => {
    expect(firstIssue.filter((card) => card.signedBeforeIssue)).toEqual([]);
  });

  it("⚠ nobody is told again about last year's card: the pupil who moved on and their guardian hear nothing", () => {
    expect({ pupil: thisYear.toldMovedOn, guardian: thisYear.toldMovedOnGuardian }).toEqual({ pupil: 1, guardian: 1 });
  });
});
