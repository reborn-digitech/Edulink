/**
 * The fixtures' practice chapters and the college's placement bank (integration, 11 Oct 2026; the owner, on
 * the practice page): the ZZ placement banks (class 13) and two chapters a suite had left behind carry no
 * board, the board switch lists a board-less chapter under every board, and so every real school saw "ZZ …"
 * chapters and a "Class 13".
 *
 *   (a) a chapter whose slug starts "zz-" lists only for a fixture school's readers (School.isTestFixture) —
 *       the practice list, the teacher's worksheets — and in the review queue only for a fixture reviewer;
 *   (b) no chapter of the practice doors' suite outlives its run (its clean-up deletes them by slug first);
 *   (c) class 13 and above reads "College", not "Class 13", in en, hi and mr.
 *
 * ZZ rows only, removed afterwards.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { COLLEGE_CLASS_LEVEL, isCollegeClassLevel, isFixtureTopicSlug, quizReviewQuerySchema } from "@edulink/contracts";
import { en } from "@edulink/i18n/en";
import { hi } from "@edulink/i18n/hi";
import { mr } from "@edulink/i18n/mr";
import { translatorFor } from "@/lib/i18n/dictionary";
import { listTopics } from "@/lib/quiz";
import { worksheetTopics } from "@/lib/worksheets";
import { listQueue, nextItem } from "@/lib/quiz-review";
import { classLevelLabel } from "@/lib/quiz-board";
import type { ActiveContext } from "@/lib/session";

const db = new PrismaClient();
const STAMP = Date.now();
const P = `zz-qf-${STAMP}`;
const SLUG = `${P}-chapter`;
const ids = { real: "", fixture: "", realPupil: "", fixturePupil: "", realTeacher: "", curator: "", fixtureCurator: "", users: [] as string[], topic: "" };

function ctx(schoolId: string, membershipId: string, userId: string, role: "STUDENT" | "TEACHER"): ActiveContext {
  return {
    sessionId: "test",
    membershipId,
    schoolId,
    role,
    user: { id: userId, email: null, name: "ZZ QF", preferredName: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { locale: "en" } },
  } as unknown as ActiveContext;
}
function reviewer(userId: string): ActiveContext {
  return { sessionId: "test", membershipId: null, schoolId: null, role: null, user: { id: userId, name: "ZZ QF Curator", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: true } } as unknown as ActiveContext;
}

let realPupil: ActiveContext;
let fixturePupil: ActiveContext;
let realTeacher: ActiveContext;

beforeAll(async () => {
  const school = (name: string, isTestFixture: boolean, n: number) =>
    db.school.create({ data: { name: `ZZ QF ${name} ${STAMP}`, slug: `${P}-${n}`, code: `ZF${n}${String(STAMP).slice(-5)}`, contactEmail: `${P}-${n}@demo.relay.test`, timezone: "Asia/Kolkata", isTestFixture }, select: { id: true } });
  // A ZZ school WITHOUT the flag stands for a real school: it is what the rule keeps the fixtures from.
  ids.real = (await school("Real", false, 1)).id;
  ids.fixture = (await school("Fixture", true, 2)).id;
  const user = async (name: string, extra: Record<string, unknown> = {}) => {
    const u = await db.user.create({ data: { name: `ZZ QF ${name}`, email: `${P}-${name.toLowerCase()}@demo.relay.test`, ...extra }, select: { id: true } });
    ids.users.push(u.id);
    return u.id;
  };
  const member = (userId: string, schoolId: string, role: "STUDENT" | "TEACHER") => db.membership.create({ data: { userId, schoolId, role, status: "ACTIVE" }, select: { id: true } });
  const rp = await user("RealPupil");
  const fp = await user("FixturePupil");
  const rt = await user("RealTeacher");
  ids.curator = await user("Curator", { isAppAdmin: true });
  ids.fixtureCurator = await user("FixtureCurator", { isAppAdmin: true, isTestFixture: true });
  realPupil = ctx(ids.real, (await member(rp, ids.real, "STUDENT")).id, rp, "STUDENT");
  fixturePupil = ctx(ids.fixture, (await member(fp, ids.fixture, "STUDENT")).id, fp, "STUDENT");
  realTeacher = ctx(ids.real, (await member(rt, ids.real, "TEACHER")).id, rt, "TEACHER");

  const topic = await db.quizTopic.create({ data: { subject: "MATHS", classLevel: COLLEGE_CLASS_LEVEL, chapter: "ZZ QF Aptitude", name: `ZZ QF Aptitude ${STAMP}`, slug: SLUG }, select: { id: true } });
  ids.topic = topic.id;
  // One served question (the list drops a chapter with none) and one generated item waiting in the queue.
  await db.quizQuestion.create({ data: { topicId: topic.id, difficulty: 1, stem: `ZZ QF served ${STAMP}?`, choices: JSON.stringify(["a", "b"]), answerIndex: 0, solution: "ZZ a.", source: "ZZ", licence: "ZZ" } });
  await db.quizQuestion.create({
    data: { topicId: topic.id, difficulty: 1, stem: `ZZ QF waiting ${STAMP}?`, choices: JSON.stringify(["a", "b"]), answerIndex: 0, solution: "ZZ a.", source: "ZZ", licence: "ZZ", generated: true, generatedBoard: "NCERT", generation: "{}" },
  });
}, 60_000);

afterAll(async () => {
  await db.quizTopic.deleteMany({ where: { slug: SLUG } });
  await db.school.deleteMany({ where: { id: { in: [ids.real, ids.fixture].filter(Boolean) } } });
  await db.user.deleteMany({ where: { id: { in: ids.users } } });
  await db.$disconnect();
}, 60_000);

describe("(a) the fixtures' zz- chapters", () => {
  it("are read as fixtures by their slug", () => {
    expect(isFixtureTopicSlug(SLUG)).toBe(true);
    expect(isFixtureTopicSlug("science-8-force-and-pressure")).toBe(false);
  });

  it("list for a fixture school's pupil and not for a real school's, under every board", async () => {
    for (const board of [undefined, "ALL", "NCERT", "BALBHARATI"] as const) {
      expect((await listTopics(fixturePupil, { board })).map((t) => t.slug), `fixture ${board}`).toContain(SLUG);
      expect((await listTopics(realPupil, { board })).map((t) => t.slug), `real ${board}`).not.toContain(SLUG);
    }
    // No zz- chapter at all reaches a real school.
    expect((await listTopics(realPupil)).filter((t) => isFixtureTopicSlug(t.slug))).toEqual([]);
  });

  it("are not offered on a real school's worksheet form", async () => {
    expect((await worksheetTopics(realTeacher)).filter((t) => isFixtureTopicSlug(t.slug))).toEqual([]);
  });

  it("wait in the review queue for a fixture reviewer only", async () => {
    const real = await listQueue(reviewer(ids.curator), { topic: ids.topic });
    expect(real.filtered).toBe(0);
    expect(real.groups.map((g) => g.topicId)).not.toContain(ids.topic);
    expect((await nextItem(reviewer(ids.curator), { topic: ids.topic })).item).toBeNull();
    const fixture = await listQueue(reviewer(ids.fixtureCurator), { topic: ids.topic });
    // Two since the desk became one bank (ba3feaf1, 7 Nov 2026): the served curated row and the waiting generated one; a real reviewer still sees neither.
    expect(fixture.filtered).toBe(2);
    expect((await nextItem(reviewer(ids.fixtureCurator), { topic: ids.topic })).item?.topic.id).toBe(ids.topic);
  });
});

describe("(b) the practice doors' suite leaves no chapter behind", () => {
  it("deletes its chapters by slug, first, in a clean-up with time to finish", () => {
    const src = readFileSync(join(process.cwd(), "tests", "api-v1-practice.test.ts"), "utf8");
    const cleanUp = src.slice(src.indexOf("afterAll("));
    expect(cleanUp.indexOf("quizTopic.deleteMany({ where: { slug: { in: [SLUG, REV_SLUG] } } })")).toBeGreaterThan(0);
    expect(cleanUp.indexOf("quizTopic.deleteMany")).toBeLessThan(cleanUp.indexOf("school.deleteMany"));
    expect(cleanUp).toMatch(/\}, 120_000\);/);
  });

  it("holds no zz-v1p chapter older than an hour in the bank", async () => {
    const left = await db.quizTopic.findMany({ where: { slug: { startsWith: "zz-v1p-" } }, select: { slug: true } });
    const stale = left.filter((t) => Date.now() - Number(t.slug.split("-").pop()) > 3_600_000);
    expect(stale.map((t) => t.slug)).toEqual([]);
  });
});

describe("(c) the college's placement bank says College", () => {
  it("reads class 13 and above as College, below as a class", () => {
    expect(isCollegeClassLevel(12)).toBe(false);
    expect(isCollegeClassLevel(13)).toBe(true);
    for (const [dict, college, class8] of [
      [en, "College", "Class 8"],
      [hi, "महाविद्यालय", null],
      [mr, "महाविद्यालय", null],
    ] as const) {
      const t = translatorFor(dict);
      expect(classLevelLabel(t, 13)).toBe(college);
      expect(classLevelLabel(t, 14)).toBe(college);
      if (class8) expect(classLevelLabel(t, 8)).toBe(class8);
      expect(classLevelLabel(t, 8)).not.toBe(college);
    }
  });

  it("lets the review queue filter on the college bank", () => {
    expect(quizReviewQuerySchema.parse({ grade: "13" }).grade).toBe(13);
    const page = readFileSync(join(process.cwd(), "src", "components", "quiz-review", "queue-page.tsx"), "utf8");
    expect(page).toContain('{ value: String(COLLEGE_CLASS_LEVEL), label: t("practice.collegeLevel") }');
    expect(readFileSync(join(process.cwd(), "src", "components", "quiz-review", "desk.tsx"), "utf8")).toContain("quizReview.itemHeadingCollege");
  });

  it("is drawn through the one label on the practice pages and the phone's practice screen", () => {
    for (const file of ["src/app/(app)/student/practice/page.tsx", "src/app/(app)/parent/practice/page.tsx", "../mobile/src/screens/family/practice.tsx"]) {
      const src = readFileSync(join(process.cwd(), file), "utf8");
      // The phone keeps its own one-line helper (the web's lives in src/lib/quiz-board.ts): that line alone may name the key.
      expect(src.split('t("practice.classN"').length - 1, file).toBe(file.includes("mobile") ? 1 : 0);
      expect(src, file).toContain("classLevelLabel(t,");
    }
  });
});
