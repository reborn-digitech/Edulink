/**
 * The figure builder's import step, end to end against the database and a scratch uploads store:
 * an item's figure drawn in English, Hindi and Marathi and stored as PNG, the rows pointing at their
 * files, a re-import that keeps them, a changed spec that replaces them and deletes the old, a figure
 * taken away; the file route letting any signed-in person read a figure and nobody signed out; the
 * orphan sweep keeping them; and the practice player serving the figure in the stem's language.
 *
 * Everything here is ZZ: a ZZ school, a @demo.relay.test pupil, a zz- topic, removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import { authorizeFileRead } from "@/lib/files";
import { reclaimOrphans } from "@/lib/orphans";
import { nextQuestion, startAttempt, submitAnswer } from "@/lib/quiz";
import { reviseQuestion } from "@/lib/practice-insights";
import { readStoredFile } from "@/lib/storage";
import type { ActiveContext } from "@/lib/session";
import { finishFigure, prepareFigure, type FigureItem } from "../scripts/quiz-gen/figures/attach";
import { KIND_SAMPLES } from "../scripts/quiz-gen/figures/samples";
import { FIGURE_RENDER_VERSION } from "../scripts/quiz-gen/figures/render";

// Drawing and storing three PNGs, and the orphan sweep's full walk, take seconds on a busy machine.
vi.setConfig({ testTimeout: 60_000 });

const db = new PrismaClient();
const ROOT = resolve(process.cwd(), ".tmp-figure-store");
const REAL_STORAGE_DIR = process.env.STORAGE_DIR;
process.env.STORAGE_DIR = ROOT;

const stamp = Date.now();
const SLUG = `zz-figures-${stamp}`;
let schoolId = "";
let userId = "";
let questionId = "";
let student: ActiveContext;

function ctx(membershipId: string): ActiveContext {
  return {
    sessionId: "test",
    membershipId,
    schoolId,
    role: "STUDENT",
    user: { id: userId, email: `zz-figures-${stamp}@demo.relay.test`, name: "ZZ Figures Pupil", preferredName: null, avatarKey: null, prefs: { locale: "en" } },
  } as unknown as ActiveContext;
}

const item = (labels = KIND_SAMPLES.geometry.labels): FigureItem => ({
  figure: { ...KIND_SAMPLES.geometry, labels },
  imageAlt: "ZZ A right triangle ABC with AB 8 cm and AC 5 cm.",
  translations: { hi: { imageAlt: "ZZ समकोण त्रिभुज ABC।" }, mr: { imageAlt: "ZZ काटकोन त्रिकोण ABC." } },
});

/** What the importer does with the pair: the question row takes the English key, then finish. */
async function importOnce(it: FigureItem | null) {
  const before = await db.quizQuestion.findUniqueOrThrow({ where: { id: questionId }, select: { imageKey: true, imageSpec: true } });
  const prepared = it ? await prepareFigure(db, questionId, it) : null;
  if (prepared) await db.quizQuestion.update({ where: { id: questionId }, data: { imageKey: prepared.imageKey, imageAlt: it!.imageAlt ?? null } });
  else await db.quizQuestion.update({ where: { id: questionId }, data: { imageKey: null, imageAlt: null } });
  await finishFigure(db, questionId, it ?? {}, prepared, before);
  return prepared;
}

async function keys() {
  const row = await db.quizQuestion.findUniqueOrThrow({ where: { id: questionId }, select: { imageKey: true, imageSpec: true, translations: { select: { language: true, imageKey: true, imageAlt: true }, orderBy: { language: "asc" } } } });
  return row;
}

beforeAll(async () => {
  const school = await db.school.create({ data: { name: `ZZ Figures School ${stamp}`, slug: `zz-figures-${stamp}`, code: `ZZFIG${stamp % 100000}`, contactEmail: "zz-figures@demo.relay.test", timezone: "Asia/Kolkata" } });
  schoolId = school.id;
  const user = await db.user.create({ data: { email: `zz-figures-${stamp}@demo.relay.test`, name: "ZZ Figures Pupil", passwordHash: "x" } });
  userId = user.id;
  const membership = await db.membership.create({ data: { userId, schoolId, role: "STUDENT", status: "ACTIVE" } });
  student = ctx(membership.id);
  const topic = await db.quizTopic.create({ data: { subject: "MATHS", classLevel: 8, chapter: "ZZ Triangles", name: "ZZ Triangles", slug: SLUG, position: 1 } });
  const q = await db.quizQuestion.create({
    data: { topicId: topic.id, difficulty: 1, stem: "ZZ What is the hypotenuse?", choices: JSON.stringify(["BC", "AB"]), answerIndex: 0, solution: "ZZ BC.", source: "ZZ test", licence: "ZZ test" },
  });
  questionId = q.id;
  for (const language of ["hi", "mr"]) {
    await db.quizQuestionTranslation.create({ data: { questionId, language, stem: `ZZ ${language} कर्ण कौन-सा है?`, choices: JSON.stringify(["BC", "AB"]), solution: "ZZ BC." } });
  }
}, 60_000);

afterAll(async () => {
  await db.quizTopic.deleteMany({ where: { slug: SLUG } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { id: userId } });
  await db.$disconnect();
  await rm(ROOT, { recursive: true, force: true });
  if (REAL_STORAGE_DIR === undefined) delete process.env.STORAGE_DIR;
  else process.env.STORAGE_DIR = REAL_STORAGE_DIR;
}, 120_000);

let first: Awaited<ReturnType<typeof keys>>;

describe("the import step", () => {
  it("draws the figure in English, Hindi and Marathi and points each row at its PNG", async () => {
    const prepared = await importOnce(item());
    expect(prepared?.drawn).toBe(true);
    first = await keys();
    expect(first.imageKey).toMatch(/^[0-9a-f-]{36}\.png$/);
    expect(JSON.parse(first.imageSpec!)).toMatchObject({ v: FIGURE_RENDER_VERSION, figure: { kind: "geometry" } });
    expect(first.translations.map((t) => t.language)).toEqual(["hi", "mr"]);
    expect(new Set([first.imageKey, ...first.translations.map((t) => t.imageKey)]).size).toBe(3);
    expect(first.translations[1]!.imageAlt).toBe("ZZ काटकोन त्रिकोण ABC.");
    for (const k of [first.imageKey!, ...first.translations.map((t) => t.imageKey!)]) {
      const stored = await readStoredFile(k);
      expect(stored?.mime).toBe("image/png");
    }
  });

  it("keeps the stored files when nothing changed", async () => {
    const prepared = await importOnce(item());
    expect(prepared?.drawn).toBe(false);
    expect(await keys()).toEqual(first);
  });

  it("draws new files for a changed spec and deletes the ones it replaced", async () => {
    const prepared = await importOnce(item({ hyp: { en: "hypotenuse", hi: "कर्ण", mr: "कर्ण रेषा" }, theta: { en: "θ", hi: "θ", mr: "θ" } }));
    expect(prepared?.drawn).toBe(true);
    const now = await keys();
    expect(now.imageKey).not.toBe(first.imageKey);
    for (const old of [first.imageKey!, ...first.translations.map((t) => t.imageKey!)]) expect(await readStoredFile(old)).toBeNull();
    first = now;
  });

  it("refuses a figure it cannot draw in a language the item is read in, storing nothing", async () => {
    await expect(prepareFigure(db, questionId, item({ hyp: { en: "hypotenuse" }, theta: { en: "θ", hi: "θ", mr: "θ" } }))).rejects.toThrow(/no hi text for label hyp/);
    expect(await keys()).toEqual(first);
  });
});

describe("reading a figure", () => {
  it("is open to a signed-in person and closed to nobody signed in", async () => {
    const mr = first.translations.find((t) => t.language === "mr")!.imageKey!;
    expect(await authorizeFileRead(mr, student)).toEqual({ allowed: true, kind: "quiz", public: false });
    expect(await authorizeFileRead(first.imageKey!, student)).toMatchObject({ allowed: true, kind: "quiz" });
    expect((await authorizeFileRead(mr, null)).allowed).toBe(false);
  });

  it("is kept by the orphan sweep", async () => {
    const report = await reclaimOrphans({ dryRun: true, graceMs: 0 });
    const orphaned = new Set(report.orphans.map((o) => o.fileId));
    for (const k of [first.imageKey!, ...first.translations.map((t) => t.imageKey!)]) expect(orphaned.has(k)).toBe(false);
  });

  it("is served with the question in the stem's language", async () => {
    const { attemptId } = await startAttempt(student, SLUG);
    const mr = await nextQuestion(student, attemptId, "mr");
    expect(mr?.image).toEqual({ fileId: first.translations.find((t) => t.language === "mr")!.imageKey, alt: "ZZ काटकोन त्रिकोण ABC." });
    const en = await nextQuestion(student, attemptId, "en");
    expect(en?.image).toEqual({ fileId: first.imageKey, alt: "ZZ A right triangle ABC with AB 8 cm and AC 5 cm." });
  });

  it("comes back with the question on revision, in the language asked for", async () => {
    const { attemptId } = await startAttempt(student, SLUG);
    await submitAnswer(student, attemptId, questionId, 1, "hi");
    const hi = await reviseQuestion(student, questionId, "hi");
    expect(hi.image).toEqual({ fileId: first.translations.find((t) => t.language === "hi")!.imageKey, alt: "ZZ समकोण त्रिभुज ABC।" });
  });
});

describe("a figure taken off an item", () => {
  it("clears the translations' drawings and deletes the files the step made", async () => {
    await importOnce(null);
    const now = await keys();
    expect(now.imageSpec).toBeNull();
    expect(now.translations.every((t) => t.imageKey === null && t.imageAlt === null)).toBe(true);
    for (const t of first.translations) expect(await readStoredFile(t.imageKey!)).toBeNull();
    // integration (11 Oct 2026): the English drawing goes too — the row no longer named it when finishFigure ran.
    expect(now.imageKey).toBeNull();
    expect(await readStoredFile(first.imageKey!)).toBeNull();
  });
});
