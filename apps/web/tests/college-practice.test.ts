/**
 * College-specific practice (college-content, the owner's decisions of 12 October 2026).
 *
 * Proved here: the audience rule, pure and as the query (a law college lists only LAW's banks, the
 * college-wide ones and NCERT's chapters in "Competitive Exams Prep"; an engineering college does not see
 * LAW's; a school lists no college topic and every board as before); a chapter a tenant does not list
 * cannot be opened by its slug; the prep section's class and subject filters and the stream section's
 * programme and term filters; the phone's read with its section fields (and an older phone's schema);
 * the generator's college selection on a ZZ syllabus document (the units cut by the level-one headings,
 * the running head and the administrative runs out, the reading list left out of a unit, the programme
 * and the semester read from the title); the plan by stream, programme and unit range; the loader landing
 * a college batch as a COLLEGE topic and refusing one onto a school chapter; the verifier's college rules;
 * the request's COLLEGE scope. Every row is a ZZ row made here and removed after.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  competitionFitsTenant,
  familyStudentPracticeSchema,
  practiceSectionOf,
  quizGenRequestSchema,
  type PracticeTenant,
} from "@edulink/contracts";
import { createSession, type ActiveContext } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { GET as collegeSyllabiGet } from "@/app/api/v1/appadmin/quiz-jobs/college-syllabi/route";
import { listTopics, startAttempt } from "@/lib/quiz";
import { practiceTenantOf } from "@/lib/practice-audience";
import { prepListing, sectionFromQuery, streamListing } from "@/lib/college-practice";
import { studentPractice } from "@/lib/api-reads/family";
import { aboutTheSyllabus, collegeTermOf, isReadingListChunk, programmeOf, readCollegeSyllabi, syllabusStreamOf, unitsOf, collegeSyllabi } from "@/lib/college-syllabi";
import { collegeTopicSlug, planCollegeUnits, selectCollegeUnit } from "../scripts/quiz-gen/college";
import { loadGeneratedBatches, type QueueBatch } from "../scripts/quiz-queue-load";
import { createVerifier, type TopicFile } from "../scripts/verify-quiz";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const db = new PrismaClient();
const STAMP = Date.now();
const P = `zz-cc-${STAMP}`;
const SLUG = {
  ncert8: `${P}-ncert-8-sci`,
  ncert9: `${P}-ncert-9-maths`,
  bal: `${P}-bal-8-sci`,
  law: `${P}-law-llm`,
  lawS3: `${P}-law-llb`,
  eng: `${P}-eng`,
  wide: `${P}-wide`,
  queue: `${P}-queue`,
};
const DOC_PATH = `zz/${P}/LL.M._Syllabus_Semester_II_12072025.pdf`;
const schools = { school: "", law: "", eng: "" };
const people = { school: { user: "", membership: "" }, law: { user: "", membership: "" }, eng: { user: "", membership: "" } };
let curator = "";

function pupil(which: keyof typeof schools): ActiveContext {
  return {
    sessionId: "test",
    membershipId: people[which].membership,
    schoolId: schools[which],
    role: "STUDENT",
    user: { id: people[which].user, email: null, name: `ZZ CC ${which}`, preferredName: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { locale: "en" } },
  } as unknown as ActiveContext;
}

async function topic(slug: string, data: { subject: string; classLevel: number; board?: string | null; audience?: string; streams?: string[]; programme?: string | null; yearOrSemester?: string | null }) {
  const row = await db.quizTopic.create({ data: { chapter: `ZZ CC ${slug}`, name: `ZZ CC ${slug}`, slug, ...data }, select: { id: true } });
  await db.quizQuestion.create({ data: { topicId: row.id, difficulty: 1, stem: `ZZ CC ${slug}: what is 2+2?`, choices: JSON.stringify(["4", "5"]), answerIndex: 0, solution: "ZZ: two and two make four.", checkExpr: "2+2", source: "test", licence: "test" } });
  return row.id;
}

const mine = (rows: { slug: string }[]) => new Set(rows.map((r) => r.slug).filter((s) => s.startsWith(P)));

beforeAll(async () => {
  const make = async (key: keyof typeof schools, data: { kind: string; streamsJson: string; board?: string }) => {
    const school = await db.school.create({
      data: { name: `ZZ CC ${key} ${STAMP}`, slug: `${P}-${key}`, code: `ZC${key.slice(0, 1).toUpperCase()}${String(STAMP).slice(-6)}`, contactEmail: `${P}-${key}@demo.relay.test`, timezone: "Asia/Kolkata", isTestFixture: true, ...data },
      select: { id: true },
    });
    schools[key] = school.id;
    const user = await db.user.create({ data: { name: `ZZ CC ${key} pupil`, email: `${P}-${key}@demo.relay.test`, isTestFixture: true }, select: { id: true } });
    const m = await db.membership.create({ data: { userId: user.id, schoolId: school.id, role: "STUDENT", status: "ACTIVE", studentCode: `ZCC${key}${STAMP}` }, select: { id: true } });
    people[key] = { user: user.id, membership: m.id };
  };
  curator = (await db.user.create({ data: { name: "ZZ CC Curator", email: `${P}-curator@demo.relay.test`, isTestFixture: true, isAppAdmin: true }, select: { id: true } })).id;
  await make("school", { kind: "SCHOOL", streamsJson: "[]", board: "CBSE" });
  await make("law", { kind: "COLLEGE", streamsJson: JSON.stringify(["LAW"]) });
  await make("eng", { kind: "AUTONOMOUS_COLLEGE", streamsJson: JSON.stringify(["ENGINEERING"]) });

  await topic(SLUG.ncert8, { subject: "SCIENCE", classLevel: 8, board: "NCERT" });
  await topic(SLUG.ncert9, { subject: "MATHS", classLevel: 9, board: "NCERT" });
  await topic(SLUG.bal, { subject: "SCIENCE", classLevel: 8, board: "BALBHARATI" });
  await topic(SLUG.law, { subject: "LAW", classLevel: 13, audience: "COLLEGE", streams: ["LAW"], programme: "LL.M.", yearOrSemester: "S2" });
  await topic(SLUG.lawS3, { subject: "LAW", classLevel: 13, audience: "COLLEGE", streams: ["LAW"], programme: "LL.B.", yearOrSemester: "Y3" });
  await topic(SLUG.eng, { subject: "ENGINEERING", classLevel: 13, audience: "COLLEGE", streams: ["ENGINEERING"], programme: "B.E." });
  await topic(SLUG.wide, { subject: "APTITUDE", classLevel: 13, audience: "COLLEGE", streams: [] });

  // A ZZ syllabus document as the corpus ingest writes one: a contents page, the university's running head, two units, a reading list.
  const doc = await db.contentDocument.create({
    data: { path: DOC_PATH, source: "syllabi", kind: "syllabus", board: "SPPU (Savitribai Phule Pune University)", gradeOrProgramme: "Faculty of Humanities", subject: "III) LAW", title: "ZZ LL.M. Syllabus Semester II_12072025", language: "en", sourceUrl: `https://fixture.invalid/${P}`, licenceUrl: "https://fixture.invalid/", retrievedAt: new Date(), sha256: "fixture", bytes: 0, pageCount: 6 },
  });
  const chunk = (ordinal: number, head: string, text: string) =>
    db.contentChunk.create({ data: { documentId: doc.id, ordinal, chapter: head, headingPath: head ? [head] : [], pageStart: ordinal + 1, pageEnd: ordinal + 1, text, language: "en", tokens: Math.round(text.length / 4), figureKeys: [] } });
  await chunk(0, "TABLE OF CONTENT", "ZZ Contents: Rules 1, Constitutional Law 3, International Law 5.");
  await chunk(1, "Savitribai Phule Pune University", "ZZ Research methodology: doctrinal and non-doctrinal research, hypothesis, sampling.");
  await chunk(2, "CONSTITUTIONAL LAW", "ZZ Constitutional law: federalism, fundamental rights, judicial review and the basic structure doctrine.");
  await chunk(3, "CONSTITUTIONAL LAW", ["1. Seervai, H. M. Constitutional Law of India, 4th Ed., 1991.", "2. Basu, D. D. Commentary on the Constitution, Lexis 2014.", "3. Jain, M. P. Indian Constitutional Law, 8th Edition 2018.", "4. Austin, G. Working a Democratic Constitution, Oxford Press 1999."].join("\n"));
  await chunk(4, "RULES FOR EXAMINATION", "ZZ A student must secure forty per cent to pass.");
  await chunk(5, "INTERNATIONAL LAW", "ZZ International law: sources of international law, treaties, custom, state recognition, the law of the sea.");
  // qb-A (QB-01): a heading of the document's own furniture: unit 3, never drafted.
  await chunk(6, "Notes:", "ZZ Notes: the teacher may change the order of the modules; two internal tests a semester.");
});

afterAll(async () => {
  await db.quizTopic.deleteMany({ where: { slug: { startsWith: P } } });
  await db.contentDocument.deleteMany({ where: { path: DOC_PATH } });
  __resetCookies();
  const users = [...Object.values(people).map((p) => p.user), curator].filter(Boolean);
  await db.session.deleteMany({ where: { userId: { in: users } } });
  for (const id of Object.values(schools).filter(Boolean)) await db.school.deleteMany({ where: { id } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
});

describe("the audience rule, pure", () => {
  const law: PracticeTenant = { college: true, streams: ["LAW"] };
  const school: PracticeTenant = { college: false, streams: [] };
  it("a school lists the school bank on every board and no college topic", () => {
    expect(practiceSectionOf({ audience: "SCHOOL", board: "BALBHARATI" }, school)).toBe("SCHOOL");
    expect(practiceSectionOf({ audience: "SCHOOL", board: null }, school)).toBe("SCHOOL");
    expect(practiceSectionOf({ audience: "COLLEGE", streams: ["LAW"] }, school)).toBeNull();
    expect(practiceSectionOf({ audience: "COLLEGE", streams: [] }, school)).toBeNull();
  });
  it("a law college: LAW's banks and the college-wide ones in STREAM, NCERT's chapters in PREP, nothing else", () => {
    expect(practiceSectionOf({ audience: "COLLEGE", streams: ["LAW"] }, law)).toBe("STREAM");
    expect(practiceSectionOf({ audience: "COLLEGE", streams: [] }, law)).toBe("STREAM");
    expect(practiceSectionOf({ audience: "COLLEGE", streams: ["ENGINEERING"] }, law)).toBeNull();
    expect(practiceSectionOf({ audience: "SCHOOL", board: "NCERT" }, law)).toBe("PREP");
    expect(practiceSectionOf({ audience: "SCHOOL", board: "BALBHARATI" }, law)).toBeNull();
    expect(practiceSectionOf({ audience: "SCHOOL", board: null }, law)).toBeNull();
  });
  it("the URL's section reads STREAM unless it says prep", () => {
    expect(sectionFromQuery(undefined)).toBe("STREAM");
    expect(sectionFromQuery("prep")).toBe("PREP");
    expect(sectionFromQuery("anything")).toBe("STREAM");
  });
});

describe("the practice list by tenant (listTopics)", () => {
  it("reads the tenant's kind and streams", async () => {
    expect(await practiceTenantOf(schools.law)).toEqual({ college: true, streams: ["LAW"] });
    expect(await practiceTenantOf(schools.eng)).toEqual({ college: true, streams: ["ENGINEERING"] });
    expect(await practiceTenantOf(schools.school)).toEqual({ college: false, streams: [] });
  });

  it("a law college sees only LAW's banks, the college-wide bank and NCERT's chapters, each in its section", async () => {
    const rows = await listTopics(pupil("law"), { language: "en" });
    expect(mine(rows)).toEqual(new Set([SLUG.ncert8, SLUG.ncert9, SLUG.law, SLUG.lawS3, SLUG.wide]));
    // Over the whole list, not only this suite's rows: no Balbharati chapter, no other stream's bank.
    for (const r of rows) {
      if (r.audience === "SCHOOL") {
        expect(r.board).toBe("NCERT");
        expect(r.section).toBe("PREP");
      } else {
        expect(r.streams.length === 0 || r.streams.includes("LAW")).toBe(true);
        expect(r.section).toBe("STREAM");
      }
    }
    const law = rows.find((r) => r.slug === SLUG.law)!;
    expect(law).toMatchObject({ audience: "COLLEGE", streams: ["LAW"], programme: "LL.M.", yearOrSemester: "S2", section: "STREAM" });
    expect(mine(await listTopics(pupil("law"), { language: "en", section: "PREP" }))).toEqual(new Set([SLUG.ncert8, SLUG.ncert9]));
    expect(mine(await listTopics(pupil("law"), { language: "en", section: "STREAM" }))).toEqual(new Set([SLUG.law, SLUG.lawS3, SLUG.wide]));
  });

  it("an engineering college does not see LAW's banks", async () => {
    expect(mine(await listTopics(pupil("eng"), { language: "en" }))).toEqual(new Set([SLUG.ncert8, SLUG.ncert9, SLUG.eng, SLUG.wide]));
  });

  it("a school sees no college topic, and both boards as before", async () => {
    const rows = await listTopics(pupil("school"), { language: "en" });
    expect(mine(rows)).toEqual(new Set([SLUG.ncert8, SLUG.ncert9, SLUG.bal]));
    expect(rows.every((r) => r.audience === "SCHOOL" && r.section === null)).toBe(true);
    expect(mine(await listTopics(pupil("school"), { language: "en", board: "BALBHARATI" }))).toEqual(new Set([SLUG.bal]));
  });

  it("a chapter the tenant does not list cannot be opened by its slug", async () => {
    await expect(startAttempt(pupil("law"), SLUG.bal)).rejects.toThrow();
    await expect(startAttempt(pupil("law"), SLUG.eng)).rejects.toThrow();
    await expect(startAttempt(pupil("school"), SLUG.law)).rejects.toThrow();
    const ok = await startAttempt(pupil("law"), SLUG.law);
    expect(ok.attemptId).toBeTruthy();
    await db.quizAttempt.deleteMany({ where: { id: ok.attemptId } });
  });
});

describe("the college page's two sections (pure arrangement)", () => {
  it("the prep section filters by class and subject, ignoring a class or subject it does not have", async () => {
    const rows = (await listTopics(pupil("law"), { language: "en" })).filter((r) => r.slug.startsWith(P));
    const all = prepListing(rows, {});
    expect(all.grades).toEqual([8, 9]);
    expect(new Set(all.shown.map((r) => r.slug))).toEqual(new Set([SLUG.ncert8, SLUG.ncert9]));
    const eight = prepListing(rows, { grade: "8" });
    expect(eight.shown.map((r) => r.slug)).toEqual([SLUG.ncert8]);
    expect(eight.subjects).toEqual(["SCIENCE"]);
    expect(prepListing(rows, { grade: "9", subject: "MATHS" }).shown.map((r) => r.slug)).toEqual([SLUG.ncert9]);
    expect(prepListing(rows, { grade: "4", subject: "HISTORY" }).shown).toHaveLength(2);
  });

  it("the stream section groups by programme and subject and filters by programme and term (a college-wide bank in every term)", async () => {
    const rows = (await listTopics(pupil("law"), { language: "en" })).filter((r) => r.slug.startsWith(P));
    const all = streamListing(rows, {});
    expect(all.programmes).toEqual(["LL.B.", "LL.M."]);
    expect(all.terms).toEqual(["Y3", "S2"]);
    expect(all.groups.map((g) => g.programme)).toEqual(["LL.B.", "LL.M.", null]);
    const llm = streamListing(rows, { programme: "LL.M." });
    expect(llm.groups.flatMap((g) => g.subjects.flatMap((s) => s.topics.map((t) => t.slug)))).toEqual([SLUG.law]);
    const s2 = streamListing(rows, { term: "S2" });
    expect(new Set(s2.groups.flatMap((g) => g.subjects.flatMap((s) => s.topics.map((t) => t.slug))))).toEqual(new Set([SLUG.law, SLUG.wide]));
  });
});

describe("the phone's read", () => {
  it("a college's list carries the kind, the streams and each chapter's section; an older phone's schema still reads it", async () => {
    const read = await studentPractice(pupil("law") as Parameters<typeof studentPractice>[0]);
    const parsed = familyStudentPracticeSchema.parse(read);
    expect(parsed.practiceKind).toBe("COLLEGE");
    expect(parsed.collegeStreams).toEqual(["LAW"]);
    const law = parsed.topics.find((t) => t.slug === SLUG.law)!;
    expect(law).toMatchObject({ section: "STREAM", programme: "LL.M.", yearOrSemester: "S2" });
    expect(parsed.topics.find((t) => t.slug === SLUG.bal)).toBeUndefined();
    // An older phone knows none of the new fields: the server's list parses without them.
    const old = familyStudentPracticeSchema.parse({ ...read, practiceKind: undefined, collegeStreams: undefined, topics: read.topics.map((t) => Object.fromEntries(Object.entries(t).filter(([k]) => !["audience", "streams", "programme", "yearOrSemester", "section"].includes(k)))) });
    expect(old.topics.length).toBe(read.topics.length);
    const schoolRead = familyStudentPracticeSchema.parse(await studentPractice(pupil("school") as Parameters<typeof studentPractice>[0]));
    expect(schoolRead.practiceKind).toBe("SCHOOL");
    expect(schoolRead.topics.every((t) => t.section === null)).toBe(true);
  });
});

describe("the generator's college scope", () => {
  it("reads a syllabus document's stream, programme and term", () => {
    expect(syllabusStreamOf({ board: "SPPU (Savitribai Phule Pune University)", gradeOrProgramme: "Faculty of Humanities", subject: "III) LAW", title: "ZZ LL.M. Syllabus" })).toBe("LAW");
    expect(syllabusStreamOf({ board: "SPPU (x)", gradeOrProgramme: "Faculty of Inter-Disciplinary", subject: "III) Physical Education", title: "B.Voc. Manufacturing 2nd Year syllabus_02072025" })).toBe("VOCATIONAL");
    expect(syllabusStreamOf({ board: "SPPU (x)", gradeOrProgramme: "Faculty of Science & Technology", subject: "I) Sciences", title: "M.Sc. Botany" })).toBe("SCIENCE");
    expect(syllabusStreamOf({ board: "SPPU (x)", gradeOrProgramme: "Faculty of Science & Technology", subject: "II) Engineering (All Branches)", title: "SE Civil 2024" })).toBe("ENGINEERING");
    expect(syllabusStreamOf({ board: "PCI", gradeOrProgramme: "B.Pharm", subject: "syllabus", title: "B.Pharm" })).toBe("PHARMACY");
    expect(syllabusStreamOf({ board: "MPKV (Mahatma Phule Krishi Vidyapeeth)", gradeOrProgramme: "agriculture", subject: "syllabus", title: "x" })).toBe("AGRICULTURE");
    expect(syllabusStreamOf({ board: "AICTE", gradeOrProgramme: "UG", subject: "syllabus", title: "AICTE Model Curriculum UG Degree in BBA" })).toBe("MANAGEMENT");
    expect(syllabusStreamOf({ board: "SPPU (x)", gradeOrProgramme: "faculty", subject: "II) Semester - II", title: "CC151_1 NCC (Theory and Practice)" })).toBeNull();
    expect(syllabusStreamOf({ board: "NCERT", gradeOrProgramme: "8", subject: "Science", title: "x" })).toBeNull();
    expect(programmeOf({ board: "SPPU", gradeOrProgramme: "x", subject: "y", title: "LL. M. (2 Year) Syllabus" })).toBe("LL.M.");
    expect(programmeOf({ board: "SPPU", gradeOrProgramme: "x", subject: "y", title: "BA LL. B., BBA LL.B. 2025-26" })).toBe("BA LL.B.");
    expect(collegeTermOf("ZZ LL.M. Syllabus Semester II")).toBe("S2");
    expect(collegeTermOf("T.Y.B.A Defence Studies")).toBe("Y3");
    expect(collegeTermOf("B.Voc. Manufacturing 2nd Year")).toBe("Y2");
    expect(collegeTermOf("Constitutional Law")).toBeNull();
  });

  it("cuts the units by the level-one headings: the contents, the rules and the running head out, a headless document one unit", () => {
    const c = (ordinal: number, head: string) => ({ ordinal, headingPath: head ? [head] : [] });
    const units = unitsOf([c(0, "TABLE OF CONTENT"), c(1, "Savitribai Phule Pune University"), c(2, "CORE SUBJECTS"), c(3, "CORE SUBJECTS"), c(4, "RULES FOR EXAMINATION"), c(5, "INTERNATIONAL LAW")], "Doc");
    expect(units.map((u) => [u.number, u.name, u.chunks.map((x) => x.ordinal)])).toEqual([
      [1, "Core Subjects", [1, 2, 3]],
      [2, "International Law", [5]],
    ]);
    expect(unitsOf([c(0, ""), c(1, "")], "ZZ Whole Syllabus").map((u) => u.name)).toEqual(["ZZ Whole Syllabus"]);
  });

  it("leaves a run-in reading list out and refuses a question about the syllabus itself (the 12 October live run's misses)", () => {
    expect(isReadingListChunk("2. Avtar Singh Law of Contract and Specific Relief  3. Dr. S.N. Misra, Dr. S.N. Bhalla Indian Legal System: Civil and Criminal  4. Batuk Lal - Law of Evidence  5. Kailash Rai Criminal Procedure: Principles, Rules, and Practices  6. M.V. Chitaley: Chitaley's Manual of Indian Evidence Act  7. https://bombayhighcourt.nic.in/rules")).toBe(true);
    expect(isReadingListChunk("13. Abhinav Chandrachud “Republic of Religion” Penguin, 2020. 14. Rohit De “A People's Constitution” Princeton University Press, 2018. 15. Granville Austin, Working a Democratic Constitution, Oxford 1999.")).toBe(true);
    // A topic list, and a chunk that still carries a module, are kept.
    expect(isReadingListChunk("4. Trials by Courts of Session holding of Criminal Sessions 5. General Rules as to Inquiries and Trials 6. Appeals and Revision Applications 7. Appeals to the High Court")).toBe(false);
    expect(isReadingListChunk("Module 1. Introduction to the civil manual: the plaint, the written statement, issues and the decree. Module 2. The criminal manual: the FIR, the charge sheet and the trial.")).toBe(false);
    expect(aboutTheSyllabus({ stem: "Which book is mentioned as a source for understanding the Code of Civil Procedure?", choices: ["a", "b", "c", "d"] })).not.toBeNull();
    expect(aboutTheSyllabus({ stem: "Which part of the course would provide this information?", choices: ["Module 01: Civil", "Module 02: Criminal", "c", "d"] })).not.toBeNull();
    expect(aboutTheSyllabus({ stem: "What is the main aim of the course 'Introduction to Civil and Criminal Manual'?", choices: ["a", "b", "c", "d"] })).not.toBeNull();
    expect(aboutTheSyllabus({ stem: "Which of the following is a learning outcome of the course on Principles of Evidence Law?", choices: ["a", "b", "c", "d"] })).not.toBeNull();
    expect(aboutTheSyllabus({ stem: "Which of the following best describes the concept of gender justice as discussed in the course?", choices: ["a", "b", "c", "d"] })).not.toBeNull();
    expect(aboutTheSyllabus({ stem: "Under the Code of Civil Procedure, which document opens a civil suit?", choices: ["A plaint", "A charge sheet", "An FIR", "A decree"] })).toBeNull();
  });

  it("selects a unit of a ZZ syllabus document as the pipeline reads a chapter, its reading list left out", async () => {
    const unit = await selectCollegeUnit(db, { path: DOC_PATH, unit: 1 });
    expect(unit).toMatchObject({ stream: "LAW", programme: "LL.M.", yearOrSemester: "S2", syllabusBoard: "SPPU", classLevel: 13, subjectCode: "LAW", chapterNumber: 1, chapterLabel: "Unit 1 — Constitutional Law", source: "syllabi" });
    expect(unit.chunks.map((x) => x.ordinal)).toEqual([1, 2]);
    expect(unit.draftNote).toMatch(/university syllabus/);
    const second = await selectCollegeUnit(db, { path: DOC_PATH, unit: 2 });
    expect(second.chapterName).toBe("International Law");
    // qb-A (QB-01): the "Notes:" unit keeps its number and is refused; there is no fourth.
    await expect(selectCollegeUnit(db, { path: DOC_PATH, unit: 3 })).rejects.toThrow(/not drafted: its heading is a heading cut after a mark/);
    await expect(selectCollegeUnit(db, { path: DOC_PATH, unit: 4 })).rejects.toThrow(/no unit 4/);
  });

  it("plans by stream, programme, document and unit range; the catalogue lists the stream and the streams without a corpus", async () => {
    const syllabi = (await readCollegeSyllabi(db)).filter((s) => s.doc.path === DOC_PATH);
    expect(syllabi).toHaveLength(1);
    const all = planCollegeUnits({ stream: "LAW", programme: "LL.M.", document: DOC_PATH }, syllabi);
    expect(all.map((w) => [w.unit, w.unitName])).toEqual([[1, "Constitutional Law"], [2, "International Law"]]);
    expect(planCollegeUnits({ stream: "LAW", programme: "LL.M.", unitFrom: 2 }, syllabi).map((w) => w.unit)).toEqual([2]);
    expect(planCollegeUnits({ stream: "ENGINEERING", programme: "LL.M." }, syllabi)).toEqual([]);
    expect(all[0]!.fileName).toBe(`${collegeTopicSlug("LAW", "LL.M.", DOC_PATH, 1)}.json`);
    const catalogue = await collegeSyllabi(db);
    expect(catalogue.streams.find((s) => s.stream === "LAW")?.programmes.some((p) => p.documents.some((d) => d.path === DOC_PATH))).toBe(true);
    // qb-A (QB-01): the card does not offer the refused unit.
    const card = catalogue.streams.flatMap((s) => s.programmes.flatMap((p) => p.documents)).find((d) => d.path === DOC_PATH);
    expect(card?.units.map((u) => [u.number, u.name])).toEqual([[1, "Constitutional Law"], [2, "International Law"]]);
    expect(catalogue.without).toContain("HEALTH_SCIENCES");
  });

  it("the card's catalogue door answers the content team, and refuses a pupil", async () => {
    __resetCookies();
    await createSession(curator);
    const res = await collegeSyllabiGet();
    expect(res.status).toBe(200);
    const body = (await res.json()) as { streams: { stream: string }[]; without: string[] };
    expect(body.streams.some((s) => s.stream === "LAW")).toBe(true);
    expect(body.without).toContain("HEALTH_SCIENCES");
    __resetCookies();
    await createSession(people.law.user, { schoolId: schools.law, role: "STUDENT" });
    expect((await collegeSyllabiGet()).status).toBe(403);
    __resetCookies();
  });

  it("the request's COLLEGE scope needs a stream and a programme", () => {
    expect(quizGenRequestSchema.safeParse({ scope: "COLLEGE" }).success).toBe(false);
    expect(quizGenRequestSchema.safeParse({ scope: "COLLEGE", stream: "LAW" }).success).toBe(false);
    expect(quizGenRequestSchema.safeParse({ scope: "COLLEGE", stream: "LAW", programme: "LL.M.", unitFrom: 1, unitTo: 2, limit: 4 }).success).toBe(true);
    expect(quizGenRequestSchema.safeParse({ scope: "COLLEGE", stream: "LAW", programme: "LL.M.", unitFrom: 3, unitTo: 2 }).success).toBe(false);
    expect(quizGenRequestSchema.safeParse({ scope: "COLLEGE", stream: "MEDICINE", programme: "x" }).success).toBe(false);
  });
});

describe("a college batch in the bank", () => {
  const collegeBatch = (extra: Partial<QueueBatch> = {}): QueueBatch => ({
    subject: "LAW",
    classLevel: 13,
    chapter: "Unit 2 — International Law",
    name: "ZZ International Law",
    slug: SLUG.queue,
    source: "generated against ZZ",
    licence: "test",
    audience: "COLLEGE",
    streams: ["LAW"],
    programme: "LL.M.",
    yearOrSemester: "S2",
    syllabusBoard: "SPPU",
    document: DOC_PATH,
    questions: [
      { difficulty: 1, stem: `ZZ CC ${STAMP}: which is a source of international law?`, choices: ["Treaties", "A city bye-law", "A company's articles", "A tenancy deed"], answerIndex: 0, solution: "ZZ: treaties bind the states that sign them; the others bind only within one body." },
    ],
    ...extra,
  });

  it("lands as a COLLEGE topic with its stream, programme and term, the item served with no school board", async () => {
    const result = await loadGeneratedBatches(db, [{ file: "zz-college.json", batch: collegeBatch() }]);
    expect(result.topicsMade).toBe(1);
    const topicRow = await db.quizTopic.findUniqueOrThrow({ where: { slug: SLUG.queue }, select: { audience: true, streams: true, programme: true, yearOrSemester: true, board: true, questions: { select: { generatedBoard: true, generation: true } } } });
    expect(topicRow).toMatchObject({ audience: "COLLEGE", streams: ["LAW"], programme: "LL.M.", yearOrSemester: "S2", board: null });
    expect(topicRow.questions[0]!.generatedBoard).toBeNull();
    expect(JSON.parse(topicRow.questions[0]!.generation!).board).toBe("SPPU");
    expect(mine(await listTopics(pupil("law"), { language: "en", section: "STREAM" })).has(SLUG.queue)).toBe(true);
    expect(mine(await listTopics(pupil("school"), { language: "en" })).has(SLUG.queue)).toBe(false);
    // A re-run duplicates nothing.
    const again = await loadGeneratedBatches(db, [{ file: "zz-college.json", batch: collegeBatch() }]);
    expect(again.created).toBe(0);
  });

  it("refuses a college batch onto a school chapter, and one that names no stream, before writing anything", async () => {
    await expect(loadGeneratedBatches(db, [{ file: "x.json", batch: collegeBatch({ slug: SLUG.ncert8 }) }])).rejects.toThrow(/school bank/);
    await expect(loadGeneratedBatches(db, [{ file: "x.json", batch: collegeBatch({ slug: `${P}-nostream`, streams: [] }) }])).rejects.toThrow(/no stream/);
    expect(await db.quizTopic.count({ where: { slug: `${P}-nostream` } })).toBe(0);
    // qb-A (QB-01): a unit named after a heading of its document names no new topic.
    await expect(loadGeneratedBatches(db, [{ file: "x.json", batch: collegeBatch({ slug: `${P}-notes`, name: "Notes:", chapter: "Unit 3 — Notes:" }) }])).rejects.toThrow(/heading cut after a mark/);
    await expect(loadGeneratedBatches(db, [{ file: "x.json", batch: collegeBatch({ slug: `${P}-intake`, name: "Intake: 60 Duration: 4 Year" }) }])).rejects.toThrow(/programme's facts/);
    expect(await db.quizTopic.count({ where: { slug: { in: [`${P}-notes`, `${P}-intake`] } } })).toBe(0);
  });

  it("the verifier takes a college batch and refuses a school board on it, or no stream", () => {
    const file = (extra: Partial<TopicFile> = {}): TopicFile => ({ ...(collegeBatch() as unknown as TopicFile), slug: `${P}-verify-${Math.random().toString(36).slice(2, 7)}`, ...extra });
    const ok = createVerifier();
    ok.verifyTopic("generated/zz-college.json", file(), { generated: true });
    expect(ok.report().errors.filter((e) => !/level|solution|distractor|two sentences/i.test(e))).toEqual([]);
    const bad = createVerifier();
    bad.verifyTopic("generated/zz-bad.json", file({ board: "NCERT", streams: [] }), { generated: true });
    const errors = bad.report().errors.join("\n");
    expect(errors).toMatch(/no school board/);
    expect(errors).toMatch(/names its streams/);
  });
});

describe("competitions by audience, pure", () => {
  it("no audience: everyone; SCHOOL: schools; COLLEGE: colleges of its streams (or every college with none)", () => {
    const school: PracticeTenant = { college: false, streams: [] };
    const law: PracticeTenant = { college: true, streams: ["LAW"] };
    expect(competitionFitsTenant({ audience: null }, school)).toBe(true);
    expect(competitionFitsTenant({ audience: null }, law)).toBe(true);
    expect(competitionFitsTenant({ audience: "SCHOOL" }, school)).toBe(true);
    expect(competitionFitsTenant({ audience: "SCHOOL" }, law)).toBe(false);
    expect(competitionFitsTenant({ audience: "COLLEGE", streams: ["LAW"] }, law)).toBe(true);
    expect(competitionFitsTenant({ audience: "COLLEGE", streams: ["ENGINEERING"] }, law)).toBe(false);
    expect(competitionFitsTenant({ audience: "COLLEGE", streams: [] }, law)).toBe(true);
    expect(competitionFitsTenant({ audience: "COLLEGE", streams: [] }, school)).toBe(false);
  });
});
