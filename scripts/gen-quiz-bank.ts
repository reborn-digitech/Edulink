/**
 * The generated Practice drill bank: grades 3–12, ~100,000 questions each.
 *
 * WHAT THIS IS AND IS NOT. A million questions cannot be hand-written, and a
 * million scraped ones cannot be trusted. What CAN be done honestly at this
 * scale is a DRILL bank: parameterized templates whose every variant derives
 * its answer from an arithmetic `checkExpr` — so the verifier's "arithmetic-
 * checked" count, the one number this bank uses to say how much of it is
 * actually proven, holds at 100% of the generated rows. That constraint is why
 * the generated bank is MATHS only: a history answer cannot be computed, so it
 * cannot be generated in good conscience. The hand-written 105 (with their
 * human-review counts) stay in content/quiz exactly as they are.
 *
 * EVERYTHING IS DETERMINISTIC. No Math.random anywhere: parameter picks walk
 * the grid by a hash-derived coprime step, choice order is a hash-keyed
 * shuffle, and ids are content hashes. Running twice produces byte-identical
 * questions with identical ids — which is what makes the import idempotent
 * (createMany skipDuplicates) and a re-run after a template edit a clean
 * diff: new stems arrive, orphaned generated rows (matched by this script's
 * `source` marker, never anything hand-written) are deleted.
 *
 * EVERY QUESTION IS VERIFIED BEFORE IT IS WRITTEN, with the same checks
 * verify-quiz.ts runs on the file bank, including evaluating `checkExpr`
 * through the SAME shared evaluator (quiz-arith.ts) and comparing against the
 * marked option. A single failure aborts the whole run — a template that
 * produces one bad variant produces thousands.
 *
 * THE BADGE CONSEQUENCE, stated plainly: the clean-completion badge requires
 * seeing EVERY question in a topic, and a generated topic holds ~10,000. The
 * badge stays truthful and effectively out of reach there; the mastery ladder
 * (levels 1–6) is the progression that matters in a drill topic. The 105
 * hand-written questions keep completable topics.
 *
 * Run: npm run quiz:generate            (grades 3–12, ~20–30 min with import)
 *      npm run quiz:generate -- --dry   (generate + verify only, no DB)
 *      npm run quiz:generate -- --grade 3   (one grade)
 */
import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { evaluate, numberIn } from "./quiz-arith";

config();

const GEN_SOURCE = "EduLink drill bank v1 — deterministic templates (scripts/gen-quiz-bank.ts)";
const GEN_LICENCE = "CC0-1.0";
const MAX_LEVEL = 6;
const BATCH = 2000;

/* -------------------------------------------------------------------------- */
/* Deterministic machinery                                                     */
/* -------------------------------------------------------------------------- */

function sha(s: string): string {
  return createHash("sha1").update(s).digest("hex");
}
/** A uint32 from a string — the only "randomness" in this file. */
function hnum(s: string): number {
  return parseInt(sha(s).slice(0, 8), 16);
}

function gcd(a: number, b: number): number {
  while (b) [a, b] = [b, a % b];
  return a;
}

/**
 * Walks up to `n` DISTINCT indices of [0, m) in a hash-scattered order: start
 * and step derive from the seed, step forced coprime with m so the walk is a
 * full cycle and can never revisit before m steps.
 */
function* walk(m: number, n: number, seed: string): Generator<number> {
  let step = 1 + (hnum(seed + ":step") % (m - 1 || 1));
  while (gcd(step, m) !== 1) step++;
  let idx = hnum(seed + ":start") % m;
  const count = Math.min(n, m);
  for (let i = 0; i < count; i++) {
    yield idx;
    idx = (idx + step) % m;
  }
}

/** Mixed-radix decode: one grid index → one coordinate per dimension. */
function grid(idx: number, dims: number[]): number[] {
  const out: number[] = [];
  for (const d of dims) {
    out.push(idx % d);
    idx = Math.floor(idx / d);
  }
  return out;
}

/** Integers and exact decimals, no float dust: 9.200000000000001 → "9.2". */
function fmt(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return String(Math.round(n * 1e6) / 1e6);
}

/**
 * Four options from a correct value and candidate decoys, deterministically
 * shuffled. Decoys that collide with the answer (or each other) fall back to
 * ±1, ±2, … offsets, so the four are always distinct.
 */
function options(
  correct: number,
  decoys: number[],
  seed: string,
  render: (n: number) => string = fmt,
): { choices: string[]; answerIndex: number } {
  const used = new Set<string>([fmt(correct)]);
  const picked: number[] = [];
  for (const d of decoys) {
    if (picked.length === 3) break;
    if (!Number.isFinite(d) || used.has(fmt(d))) continue;
    used.add(fmt(d));
    picked.push(d);
  }
  for (let k = 1; picked.length < 3; k++) {
    for (const c of [correct + k, correct - k]) {
      if (picked.length === 3) break;
      if (used.has(fmt(c))) continue;
      used.add(fmt(c));
      picked.push(c);
    }
  }
  const all = [correct, ...picked];
  const order = [0, 1, 2, 3].sort((x, y) => hnum(`${seed}#${x}`) - hnum(`${seed}#${y}`));
  const shuffled = order.map((i) => all[i]!);
  return { choices: shuffled.map(render), answerIndex: shuffled.indexOf(correct) };
}

/** Options that are strings (fractions like "3/4"), same shuffle. */
function optionsText(
  correct: string,
  decoys: string[],
  seed: string,
): { choices: string[]; answerIndex: number } {
  const used = new Set<string>([correct]);
  const picked = decoys.filter((d) => {
    if (used.has(d)) return false;
    used.add(d);
    return true;
  });
  if (picked.length < 3) throw new Error(`optionsText: only ${picked.length} distinct decoys for "${correct}"`);
  const all = [correct, ...picked.slice(0, 3)];
  const order = [0, 1, 2, 3].sort((x, y) => hnum(`${seed}#${x}`) - hnum(`${seed}#${y}`));
  const shuffled = order.map((i) => all[i]!);
  return { choices: shuffled, answerIndex: shuffled.indexOf(correct) };
}

/* -------------------------------------------------------------------------- */
/* Shapes                                                                      */
/* -------------------------------------------------------------------------- */

type GenQ = {
  level: number;
  stem: string;
  choices: string[];
  answerIndex: number;
  solution: string;
  checkExpr: string;
  hi: { stem: string; solution: string };
  mr: { stem: string; solution: string };
};

type Template = {
  key: string;
  level: number;
  want: number;
  space: number;
  make: (idx: number) => GenQ;
};

type TopicSpec = {
  slug: string;
  classLevel: number;
  chapter: string;
  name: string;
  summary: string;
  hi: { name: string; summary: string };
  mr: { name: string; summary: string };
  position: number;
  templates: Template[];
};

/* -------------------------------------------------------------------------- */
/* The verifier's checks, run on every question BEFORE it is written           */
/* -------------------------------------------------------------------------- */

function validate(q: GenQ, at: string): void {
  const die = (msg: string): never => {
    throw new Error(`${at}: ${msg}\n  stem: ${q.stem}`);
  };
  if (!Number.isInteger(q.level) || q.level < 1 || q.level > MAX_LEVEL) die(`level ${q.level}`);
  if (!q.stem.trim()) die("empty stem");
  if (q.choices.length < 2) die("needs at least two choices");
  if (q.choices.some((c) => !c.trim())) die("blank choice");
  if (new Set(q.choices.map((c) => c.trim().toLowerCase())).size !== q.choices.length) {
    die(`identical choices: ${q.choices.join(" | ")}`);
  }
  if (q.answerIndex < 0 || q.answerIndex >= q.choices.length) die("answerIndex out of range");
  if (q.solution.trim().length < 20) die("solution too short to be a worked solution");
  if (!/[+\-*/^]/.test(q.checkExpr)) die(`checkExpr "${q.checkExpr}" is a bare literal`);
  const expected = evaluate(q.checkExpr);
  if (expected === null) throw new Error(`${at}: checkExpr "${q.checkExpr}" does not evaluate\n  stem: ${q.stem}`);
  const stated = numberIn(q.choices[q.answerIndex]!);
  if (stated === null) throw new Error(`${at}: marked answer "${q.choices[q.answerIndex]}" states no number\n  stem: ${q.stem}`);
  if (Math.abs(stated - expected) > 1e-6) {
    die(`ARITHMETIC MISMATCH: checkExpr=${expected} but marked answer says ${stated}`);
  }
  if (!q.hi.stem.trim() || !q.mr.stem.trim()) die("missing translation stem");
  if (!q.hi.solution.trim() || !q.mr.solution.trim()) die("missing translation solution");
}

/* -------------------------------------------------------------------------- */
/* Generation                                                                  */
/* -------------------------------------------------------------------------- */

/** 48-bit stem fingerprints; a false hit skips one variant, harmless. */
const seenStems = new Set<string>();

function generateTopic(topic: TopicSpec): GenQ[] {
  const out: GenQ[] = [];
  const levels = new Set<number>();
  for (const tmpl of topic.templates) {
    let kept = 0;
    // Oversample: dedup skips cost variants, so ask the walk for extra room.
    for (const idx of walk(tmpl.space, tmpl.space, tmpl.key)) {
      if (kept === tmpl.want) break;
      const q = tmpl.make(idx);
      validate(q, `${topic.slug}/${tmpl.key}[${idx}]`);
      const fp = sha(q.stem.trim().toLowerCase()).slice(0, 12);
      if (seenStems.has(fp)) continue;
      seenStems.add(fp);
      out.push(q);
      kept++;
    }
    if (kept < tmpl.want) {
      throw new Error(
        `${topic.slug}/${tmpl.key}: wanted ${tmpl.want}, produced ${kept} — parameter space too small or dedup ate it`,
      );
    }
    levels.add(tmpl.level);
  }
  for (let l = Math.min(...levels); l <= Math.max(...levels); l++) {
    if (!levels.has(l)) throw new Error(`${topic.slug}: ladder hole at level ${l}`);
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Import                                                                      */
/* -------------------------------------------------------------------------- */

const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL });

async function importTopic(topic: TopicSpec, questions: GenQ[]): Promise<void> {
  const row = await db.quizTopic.upsert({
    where: { slug: topic.slug },
    create: {
      subject: "MATHS",
      classLevel: topic.classLevel,
      chapter: topic.chapter,
      name: topic.name,
      slug: topic.slug,
      summary: topic.summary,
      position: topic.position,
    },
    update: {
      subject: "MATHS",
      classLevel: topic.classLevel,
      chapter: topic.chapter,
      name: topic.name,
      summary: topic.summary,
      position: topic.position,
    },
  });
  for (const [language, tr] of [
    ["hi", topic.hi],
    ["mr", topic.mr],
  ] as const) {
    await db.quizTopicTranslation.upsert({
      where: { topicId_language: { topicId: row.id, language } },
      create: { topicId: row.id, language, name: tr.name, summary: tr.summary },
      update: { name: tr.name, summary: tr.summary },
    });
  }

  const rows = questions.map((q) => ({
    id: `g${sha(`${topic.slug}|${q.stem}`).slice(0, 24)}`,
    topicId: row.id,
    difficulty: q.level,
    stem: q.stem,
    choices: JSON.stringify(q.choices),
    answerIndex: q.answerIndex,
    solution: q.solution,
    checkExpr: q.checkExpr,
    source: GEN_SOURCE,
    licence: GEN_LICENCE,
  }));

  for (let i = 0; i < rows.length; i += BATCH) {
    await db.quizQuestion.createMany({ data: rows.slice(i, i + BATCH), skipDuplicates: true });
  }

  const trRows = questions.flatMap((q, i) =>
    (["hi", "mr"] as const).map((language) => ({
      id: `t${sha(`${rows[i]!.id}|${language}`).slice(0, 24)}`,
      questionId: rows[i]!.id,
      language,
      stem: q[language].stem,
      // The same option strings on purpose: numbers do not translate, and a
      // translated choices array of a different length would make answerIndex
      // point at the wrong option — the misalignment the verifier refuses.
      choices: JSON.stringify(q.choices),
      solution: q[language].solution,
    })),
  );
  for (let i = 0; i < trRows.length; i += BATCH) {
    await db.quizQuestionTranslation.createMany({
      data: trRows.slice(i, i + BATCH),
      skipDuplicates: true,
    });
  }

  // Generated rows this run no longer produces are deleted — matched by the
  // source marker, so a hand-written question in the same topic (there are
  // none today, but the guard costs nothing) can never be collateral.
  const keep = new Set(rows.map((r) => r.id));
  const existing = await db.quizQuestion.findMany({
    where: { topicId: row.id, source: GEN_SOURCE },
    select: { id: true },
  });
  const stale = existing.filter((e) => !keep.has(e.id)).map((e) => e.id);
  for (let i = 0; i < stale.length; i += BATCH) {
    await db.quizQuestion.deleteMany({ where: { id: { in: stale.slice(i, i + BATCH) } } });
  }
}

/* -------------------------------------------------------------------------- */
/* Main                                                                        */
/* -------------------------------------------------------------------------- */

async function main() {
  const dry = process.argv.includes("--dry");
  const gradeArg = process.argv.indexOf("--grade");
  const only = gradeArg > -1 ? Number(process.argv[gradeArg + 1]) : null;

  const grades = only ? [only] : [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const started = Date.now();
  let grand = 0;
  const perGrade: Record<number, number> = {};
  const levelTotals = new Array(MAX_LEVEL).fill(0) as number[];

  const allSlugs = new Set<string>();

  for (const grade of grades) {
    const topics = gradeTopics(grade);
    let gradeTotal = 0;
    for (const topic of topics) {
      if (allSlugs.has(topic.slug)) throw new Error(`duplicate slug ${topic.slug}`);
      allSlugs.add(topic.slug);
      const questions = generateTopic(topic);
      for (const q of questions) levelTotals[q.level - 1]!++;
      gradeTotal += questions.length;
      if (!dry) await importTopic(topic, questions);
      console.log(
        `  ${topic.slug.padEnd(34)} ${String(questions.length).padStart(6)} questions${dry ? " (dry)" : ""}`,
      );
    }
    perGrade[grade] = gradeTotal;
    grand += gradeTotal;
    console.log(`Grade ${grade}: ${gradeTotal} questions\n`);
    if (gradeTotal < 100_000) {
      throw new Error(`grade ${grade} produced ${gradeTotal} — the ask is ~100,000 per grade`);
    }
  }

  console.log("— generated drill bank —");
  console.log(`  questions            ${grand}`);
  console.log(`  by level             ${levelTotals.map((n, i) => `L${i + 1}:${n}`).join("  ")}`);
  console.log(`  arithmetic-checked   ${grand}  (every generated question carries checkExpr)`);
  console.log(`  read by a person     0  ← generated, unreviewed; the honest number`);
  console.log(`  translated           hi:${grand}/${grand}  mr:${grand}/${grand}`);
  console.log(`  took                 ${Math.round((Date.now() - started) / 1000)}s`);
  await db.$disconnect();
}

/* ========================================================================== */
/* CONTENT — the template DSL                                                  */
/* ========================================================================== */

/**
 * A template family: three-language stem/solution skins plus a value builder.
 * `{a}`, `{b}`, … in the skins are filled from what `make` returns; `{ans}`
 * is always the marked answer as rendered. Skins are a GRID DIMENSION —
 * "What is 3 × 4?" and "Find the product of 3 and 4." are different
 * questions to a child and different stems to the dedup — which multiplies
 * small fact spaces to drillable sizes.
 */
type SkinSet = { en: string[]; hi: string[]; mr: string[]; sen: string; shi: string; smr: string };

function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}

type MadeQ = {
  vars: Record<string, string | number>;
  answer: number;
  expr: string;
  decoys: number[];
  render?: (n: number) => string;
  /** Fraction-style questions provide the exact option strings instead. */
  answerText?: string;
  decoyTexts?: string[];
};

function T(
  key: string,
  level: number,
  want: number,
  dims: number[],
  skins: SkinSet,
  build: (c: number[]) => MadeQ,
): Template {
  const space = dims.reduce((a, b) => a * b, 1) * skins.en.length;
  return {
    key,
    level,
    want,
    space,
    make(idx: number): GenQ {
      const skin = idx % skins.en.length;
      const coords = grid(Math.floor(idx / skins.en.length), dims);
      const m = build(coords);
      const seed = `${key}@${idx}`;
      const picked = m.answerText
        ? optionsText(m.answerText, m.decoyTexts ?? [], seed)
        : options(m.answer, m.decoys, seed, m.render);
      const ansShown = m.answerText ?? (m.render ? m.render(m.answer) : fmt(m.answer));
      const vars = { ...m.vars, ans: ansShown };
      return {
        level,
        stem: fill(skins.en[skin]!, vars),
        choices: picked.choices,
        answerIndex: picked.answerIndex,
        solution: fill(skins.sen, vars),
        checkExpr: m.expr,
        hi: { stem: fill(skins.hi[skin]!, vars), solution: fill(skins.shi, vars) },
        mr: { stem: fill(skins.mr[skin]!, vars), solution: fill(skins.smr, vars) },
      };
    },
  };
}

/** Map a grid coordinate onto an inclusive integer range. */
const R = (lo: number, hi: number) => ({ lo, n: hi - lo + 1 });
type Range = { lo: number; n: number };
const at = (r: Range, i: number) => r.lo + i;

/* -------------------------------------------------------------------------- */
/* Families — arithmetic core                                                  */
/* -------------------------------------------------------------------------- */

const rupees = (n: number) => `₹${fmt(n)}`;
const cm = (n: number) => `${fmt(n)} cm`;
const sqcm = (n: number) => `${fmt(n)} sq cm`;
const cucm = (n: number) => `${fmt(n)} cu cm`;

const ADD: SkinSet = {
  en: ["What is {a} + {b}?", "Find the sum of {a} and {b}.", "Add {a} and {b}.", "{a} + {b} = ?"],
  hi: ["{a} + {b} कितना है?", "{a} और {b} का योग निकालिए।", "{a} और {b} को जोड़िए।", "{a} + {b} = ?"],
  mr: ["{a} + {b} किती?", "{a} आणि {b} यांची बेरीज काढा.", "{a} व {b} यांची बेरीज करा.", "{a} + {b} = ?"],
  sen: "Add place by place, carrying where needed: {a} + {b} = {ans}. The answer is {ans}.",
  shi: "स्थान के अनुसार जोड़ें, आवश्यक हो तो हासिल लें: {a} + {b} = {ans}। उत्तर {ans} है।",
  smr: "स्थानानुसार बेरीज करा, गरज असल्यास हातचा घ्या: {a} + {b} = {ans}. उत्तर {ans} आहे.",
};
const fAdd = (tag: string, lvl: number, want: number, a: Range, b: Range) =>
  T(`add:${tag}`, lvl, want, [a.n, b.n], ADD, ([i, j]) => {
    const x = at(a, i!), y = at(b, j!), c = x + y;
    return { vars: { a: x, b: y }, answer: c, expr: `${x}+${y}`, decoys: [c + 10, c - 10, c + 1, c + 100] };
  });

const SUB: SkinSet = {
  en: ["What is {a} − {b}?", "Subtract {b} from {a}.", "Find the difference: {a} − {b}.", "{a} − {b} = ?"],
  hi: ["{a} − {b} कितना है?", "{a} में से {b} घटाइए।", "अंतर निकालिए: {a} − {b}।", "{a} − {b} = ?"],
  mr: ["{a} − {b} किती?", "{a} मधून {b} वजा करा.", "फरक काढा: {a} − {b}.", "{a} − {b} = ?"],
  sen: "Subtract place by place, borrowing where needed: {a} − {b} = {ans}. The answer is {ans}.",
  shi: "स्थान के अनुसार घटाएँ, आवश्यक हो तो उधार लें: {a} − {b} = {ans}। उत्तर {ans} है।",
  smr: "स्थानानुसार वजाबाकी करा, गरज असल्यास उसने घ्या: {a} − {b} = {ans}. उत्तर {ans} आहे.",
};
const fSub = (tag: string, lvl: number, want: number, a: Range, b: Range) =>
  T(`sub:${tag}`, lvl, want, [a.n, b.n], SUB, ([i, j]) => {
    const x = at(a, i!), y = at(b, j!), c = x - y;
    return { vars: { a: x, b: y }, answer: c, expr: `${x}-${y}`, decoys: [c + 10, c - 10, c + 1, x + y] };
  });

const MUL: SkinSet = {
  en: ["What is {a} × {b}?", "Find the product of {a} and {b}.", "Multiply {a} by {b}.", "{a} × {b} = ?"],
  hi: ["{a} × {b} कितना है?", "{a} और {b} का गुणनफल निकालिए।", "{a} को {b} से गुणा कीजिए।", "{a} × {b} = ?"],
  mr: ["{a} × {b} किती?", "{a} आणि {b} यांचा गुणाकार काढा.", "{a} ला {b} ने गुणा.", "{a} × {b} = ?"],
  sen: "Multiply step by step: {a} × {b} = {ans}. The answer is {ans}.",
  shi: "चरण दर चरण गुणा करें: {a} × {b} = {ans}। उत्तर {ans} है।",
  smr: "टप्प्याटप्प्याने गुणाकार करा: {a} × {b} = {ans}. उत्तर {ans} आहे.",
};
const fMul = (tag: string, lvl: number, want: number, a: Range, b: Range) =>
  T(`mul:${tag}`, lvl, want, [a.n, b.n], MUL, ([i, j]) => {
    const x = at(a, i!), y = at(b, j!), c = x * y;
    return { vars: { a: x, b: y }, answer: c, expr: `${x}*${y}`, decoys: [c + x, c - x, c + y, c + 10] };
  });

const DIV: SkinSet = {
  en: ["What is {a} ÷ {b}?", "Divide {a} by {b}.", "{a} ÷ {b} = ?", "How many times does {b} go into {a}?"],
  hi: ["{a} ÷ {b} कितना है?", "{a} को {b} से भाग दीजिए।", "{a} ÷ {b} = ?", "{a} में {b} कितनी बार जाता है?"],
  mr: ["{a} ÷ {b} किती?", "{a} ला {b} ने भागा.", "{a} ÷ {b} = ?", "{a} मध्ये {b} किती वेळा जातो?"],
  sen: "Divide: {a} ÷ {b} = {ans}, because {b} × {ans} = {a}. The answer is {ans}.",
  shi: "भाग दें: {a} ÷ {b} = {ans}, क्योंकि {b} × {ans} = {a}। उत्तर {ans} है।",
  smr: "भागाकार करा: {a} ÷ {b} = {ans}, कारण {b} × {ans} = {a}. उत्तर {ans} आहे.",
};
const fDiv = (tag: string, lvl: number, want: number, q: Range, b: Range) =>
  T(`div:${tag}`, lvl, want, [q.n, b.n], DIV, ([i, j]) => {
    const quot = at(q, i!), d = at(b, j!), a = quot * d;
    return { vars: { a, b: d }, answer: quot, expr: `${a}/${d}`, decoys: [quot + 1, quot - 1, quot + d, quot + 2] };
  });

const REM: SkinSet = {
  en: ["What is the remainder when {a} is divided by {b}?", "Divide {a} by {b}. What remains?", "Find the remainder: {a} ÷ {b}."],
  hi: ["{a} को {b} से भाग देने पर शेष क्या बचता है?", "{a} को {b} से भाग दें। शेष क्या है?", "शेष निकालिए: {a} ÷ {b}।"],
  mr: ["{a} ला {b} ने भागल्यावर बाकी किती उरते?", "{a} ला {b} ने भागा. बाकी किती?", "बाकी काढा: {a} ÷ {b}."],
  sen: "{b} × {q} = {w} is the largest multiple of {b} inside {a}, so the remainder is {a} − {w} = {ans}.",
  shi: "{b} × {q} = {w}, {a} के अंदर {b} का सबसे बड़ा गुणज है, इसलिए शेष {a} − {w} = {ans} है।",
  smr: "{b} × {q} = {w} हा {a} च्या आतील {b} चा सर्वात मोठा पट आहे, म्हणून बाकी {a} − {w} = {ans}.",
};
const fRem = (tag: string, lvl: number, want: number, q: Range, b: Range, r: Range) =>
  T(`rem:${tag}`, lvl, want, [q.n, b.n, r.n], REM, ([i, j, k]) => {
    const quot = at(q, i!), d = at(b, j!), rem = at(r, k!) % d;
    const a = quot * d + rem, w = quot * d;
    return { vars: { a, b: d, q: quot, w }, answer: rem, expr: `${a}-${d}*${quot}`, decoys: [rem + 1, Math.abs(rem - 1), d - rem, quot] };
  });

const PLACE: SkinSet = {
  en: ["In the number {n}, what is the place value of the digit {d}?", "What is the place value of {d} in {n}?"],
  hi: ["संख्या {n} में अंक {d} का स्थानीय मान क्या है?", "{n} में {d} का स्थानीय मान क्या है?"],
  mr: ["{n} या संख्येत {d} या अंकाची स्थानिक किंमत किती?", "{n} मध्ये {d} ची स्थानिक किंमत किती?"],
  sen: "The digit {d} sits in the place worth {p}, so its place value is {d} × {p} = {ans}.",
  shi: "अंक {d} जिस स्थान पर है उसका मान {p} है, इसलिए स्थानीय मान {d} × {p} = {ans} है।",
  smr: "अंक {d} ज्या स्थानावर आहे त्याची किंमत {p} आहे, म्हणून स्थानिक किंमत {d} × {p} = {ans}.",
};
const fPlace = (tag: string, lvl: number, want: number, digitsCount: 4 | 5) =>
  T(
    `place:${tag}`,
    lvl,
    want,
    digitsCount === 4 ? [9, 8, 7, 6, 4] : [9, 8, 7, 6, 5, 5],
    PLACE,
    (c) => {
      const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const digits: number[] = [];
      for (let k = 0; k < digitsCount; k++) {
        digits.push(pool.splice(c[k]! % pool.length, 1)[0]!);
      }
      const pos = c[digitsCount]! % digitsCount;
      const n = Number(digits.join(""));
      const d = digits[digitsCount - 1 - pos]!;
      const p = 10 ** pos;
      const ans = d * p;
      return {
        vars: { n, d, p },
        answer: ans,
        expr: `${d}*10^${pos}`,
        decoys: [d * p * 10, Math.max(d, Math.floor((d * p) / 10)), d, ans + p],
      };
    },
  );

const ROUND: SkinSet = {
  en: ["Round {n} to the nearest {u}.", "What is {n} rounded to the nearest {u}?"],
  hi: ["{n} को निकटतम {u} तक पूर्णांकित कीजिए।", "{n} को निकटतम {u} तक पूर्णांकित करने पर क्या मिलता है?"],
  mr: ["{n} ला जवळच्या {u} पर्यंत पूर्णांकित करा.", "{n} ला जवळच्या {u} पर्यंत पूर्णांकित केल्यास किती येते?"],
  sen: "{n} lies between {lo} and {hi}; it is nearer to {ans}, so it rounds to {ans}.",
  shi: "{n}, {lo} और {hi} के बीच है; यह {ans} के अधिक निकट है, इसलिए {ans} मिलता है।",
  smr: "{n} हा {lo} आणि {hi} यांच्या मध्ये आहे; तो {ans} च्या जवळ आहे, म्हणून {ans} येते.",
};
const fRound = (tag: string, lvl: number, want: number, n: Range, unit: number) =>
  T(`round:${tag}`, lvl, want, [n.n], ROUND, ([i]) => {
    const x = at(n, i!);
    const rem = x % unit;
    const lo = x - rem, hi = lo + unit;
    const ans = rem < unit / 2 ? lo : hi;
    const expr = rem < unit / 2 ? `${x}-${rem}` : `${x}+${unit - rem}`;
    return { vars: { n: x, u: unit, lo, hi }, answer: ans, expr, decoys: [ans === lo ? hi : lo, ans + unit, ans - unit] };
  });

const INT: SkinSet = {
  en: ["What is ({a}) + ({b})?", "Find the sum: ({a}) + ({b}).", "({a}) + ({b}) = ?"],
  hi: ["({a}) + ({b}) कितना है?", "योग निकालिए: ({a}) + ({b})।", "({a}) + ({b}) = ?"],
  mr: ["({a}) + ({b}) किती?", "बेरीज काढा: ({a}) + ({b}).", "({a}) + ({b}) = ?"],
  sen: "Use the sign rules for integers: ({a}) + ({b}) = {ans}. The answer is {ans}.",
  shi: "पूर्णांकों के चिह्न-नियम लगाएँ: ({a}) + ({b}) = {ans}। उत्तर {ans} है।",
  smr: "पूर्णांकांचे चिन्ह-नियम वापरा: ({a}) + ({b}) = {ans}. उत्तर {ans} आहे.",
};
const fInt = (tag: string, lvl: number, want: number, a: Range, b: Range) =>
  T(`int:${tag}`, lvl, want, [a.n, b.n, 3], INT, ([i, j, s]) => {
    let x = at(a, i!), y = at(b, j!);
    if (s === 0) x = -x;
    else if (s === 1) y = -y;
    else { x = -x; y = -y; }
    const c = x + y;
    return { vars: { a: x, b: y }, answer: c, expr: `(${x})+(${y})`, decoys: [-c, c + 2, c - 2, x - y] };
  });

const CONV: { mul: number; en: string; hi: string; mr: string }[] = [
  { mul: 60, en: "How many minutes are there in {x} hours?", hi: "{x} घंटों में कितने मिनट होते हैं?", mr: "{x} तासांत किती मिनिटे असतात?" },
  { mul: 60, en: "How many seconds are there in {x} minutes?", hi: "{x} मिनटों में कितने सेकंड होते हैं?", mr: "{x} मिनिटांत किती सेकंद असतात?" },
  { mul: 24, en: "How many hours are there in {x} days?", hi: "{x} दिनों में कितने घंटे होते हैं?", mr: "{x} दिवसांत किती तास असतात?" },
  { mul: 7, en: "How many days are there in {x} weeks?", hi: "{x} सप्ताहों में कितने दिन होते हैं?", mr: "{x} आठवड्यांत किती दिवस असतात?" },
];
const fTime = (tag: string, lvl: number, want: number, x: Range) =>
  T(
    `time:${tag}`,
    lvl,
    want,
    [x.n, CONV.length],
    {
      en: ["{q}"], hi: ["{qh}"], mr: ["{qm}"],
      sen: "Multiply by the conversion factor: {x} × {m} = {ans}. The answer is {ans}.",
      shi: "रूपांतरण गुणांक से गुणा करें: {x} × {m} = {ans}। उत्तर {ans} है।",
      smr: "रूपांतरण गुणांकाने गुणा: {x} × {m} = {ans}. उत्तर {ans} आहे.",
    },
    ([i, t]) => {
      const v = at(x, i!), conv = CONV[t!]!;
      const ans = v * conv.mul;
      return {
        vars: { x: v, m: conv.mul, q: fill(conv.en, { x: v }), qh: fill(conv.hi, { x: v }), qm: fill(conv.mr, { x: v }) },
        answer: ans,
        expr: `${v}*${conv.mul}`,
        decoys: [ans + conv.mul, ans - conv.mul, v * (conv.mul + 10), ans + 1],
      };
    },
  );

const METRIC: { mul: number; en: string; hi: string; mr: string }[] = [
  { mul: 100, en: "How many centimetres are there in {x} metres?", hi: "{x} मीटर में कितने सेंटीमीटर होते हैं?", mr: "{x} मीटरमध्ये किती सेंटिमीटर असतात?" },
  { mul: 1000, en: "How many metres are there in {x} kilometres?", hi: "{x} किलोमीटर में कितने मीटर होते हैं?", mr: "{x} किलोमीटरमध्ये किती मीटर असतात?" },
  { mul: 1000, en: "How many grams are there in {x} kilograms?", hi: "{x} किलोग्राम में कितने ग्राम होते हैं?", mr: "{x} किलोग्रॅममध्ये किती ग्रॅम असतात?" },
  { mul: 1000, en: "How many millilitres are there in {x} litres?", hi: "{x} लीटर में कितने मिलीलीटर होते हैं?", mr: "{x} लिटरमध्ये किती मिलिलिटर असतात?" },
];
const fMetric = (tag: string, lvl: number, want: number, x: Range) =>
  T(
    `metric:${tag}`,
    lvl,
    want,
    [x.n, METRIC.length],
    {
      en: ["{q}"], hi: ["{qh}"], mr: ["{qm}"],
      sen: "Multiply by the conversion factor: {x} × {m} = {ans}. The answer is {ans}.",
      shi: "रूपांतरण गुणांक से गुणा करें: {x} × {m} = {ans}। उत्तर {ans} है।",
      smr: "रूपांतरण गुणांकाने गुणा: {x} × {m} = {ans}. उत्तर {ans} आहे.",
    },
    ([i, t]) => {
      const v = at(x, i!), conv = METRIC[t!]!;
      const ans = v * conv.mul;
      return {
        vars: { x: v, m: conv.mul, q: fill(conv.en, { x: v }), qh: fill(conv.hi, { x: v }), qm: fill(conv.mr, { x: v }) },
        answer: ans,
        expr: `${v}*${conv.mul}`,
        decoys: [ans * 10, Math.floor(ans / 10), ans + conv.mul],
      };
    },
  );

const SPEND: SkinSet = {
  en: [
    "You buy one thing for ₹{a} and another for ₹{b}. How much do you spend in all?",
    "Two items cost ₹{a} and ₹{b}. What is the total cost?",
    "A shopkeeper sells you goods worth ₹{a} and ₹{b}. What do you pay altogether?",
  ],
  hi: [
    "आप एक वस्तु ₹{a} की और दूसरी ₹{b} की खरीदते हैं। कुल कितना खर्च होता है?",
    "दो वस्तुओं के दाम ₹{a} और ₹{b} हैं। कुल कीमत कितनी है?",
    "दुकानदार आपको ₹{a} और ₹{b} का सामान देता है। कुल कितना देना होगा?",
  ],
  mr: [
    "तुम्ही एक वस्तू ₹{a} ला आणि दुसरी ₹{b} ला घेता. एकूण किती खर्च होतो?",
    "दोन वस्तूंच्या किमती ₹{a} आणि ₹{b} आहेत. एकूण किंमत किती?",
    "दुकानदार तुम्हाला ₹{a} आणि ₹{b} चा माल देतो. एकूण किती द्यावे लागतील?",
  ],
  sen: "Add the two amounts: ₹{a} + ₹{b} = ₹{ans}. You spend ₹{ans} in all.",
  shi: "दोनों राशियाँ जोड़ें: ₹{a} + ₹{b} = ₹{ans}। कुल खर्च ₹{ans} है।",
  smr: "दोन्ही रकमा मिळवा: ₹{a} + ₹{b} = ₹{ans}. एकूण खर्च ₹{ans} होतो.",
};
const fSpend = (tag: string, lvl: number, want: number, a: Range, b: Range) =>
  T(`spend:${tag}`, lvl, want, [a.n, b.n], SPEND, ([i, j]) => {
    const x = at(a, i!), y = at(b, j!), c = x + y;
    return { vars: { a: x, b: y }, answer: c, expr: `${x}+${y}`, decoys: [c + 10, c - 10, c + 5], render: rupees };
  });

const CHANGE: SkinSet = {
  en: [
    "You pay with a ₹{p} note for something costing ₹{c}. How much change do you get?",
    "An item costs ₹{c} and you hand over ₹{p}. What change comes back?",
  ],
  hi: [
    "₹{c} की वस्तु के लिए आप ₹{p} का नोट देते हैं। कितने पैसे वापस मिलेंगे?",
    "वस्तु की कीमत ₹{c} है और आप ₹{p} देते हैं। कितना वापस मिलेगा?",
  ],
  mr: [
    "₹{c} च्या वस्तूसाठी तुम्ही ₹{p} ची नोट देता. किती पैसे परत मिळतील?",
    "वस्तूची किंमत ₹{c} आहे आणि तुम्ही ₹{p} देता. किती परत मिळतील?",
  ],
  sen: "Change is what you paid minus the cost: ₹{p} − ₹{c} = ₹{ans}. You get ₹{ans} back.",
  shi: "वापसी = दी गई राशि − कीमत: ₹{p} − ₹{c} = ₹{ans}। आपको ₹{ans} वापस मिलेंगे।",
  smr: "परतावा = दिलेली रक्कम − किंमत: ₹{p} − ₹{c} = ₹{ans}. तुम्हाला ₹{ans} परत मिळतील.",
};
const fChange = (tag: string, lvl: number, want: number, pay: number, c: Range) =>
  T(`change:${tag}`, lvl, want, [c.n], CHANGE, ([i]) => {
    const cost = at(c, i!), ans = pay - cost;
    return { vars: { p: pay, c: cost }, answer: ans, expr: `${pay}-${cost}`, decoys: [ans + 10, ans - 10, ans + 1], render: rupees };
  });

/* -------------------------------------------------------------------------- */
/* Families — geometry and mensuration                                         */
/* -------------------------------------------------------------------------- */

const PRECT: SkinSet = {
  en: ["A rectangle is {l} cm long and {w} cm wide. What is its perimeter?", "Find the perimeter of a rectangle with length {l} cm and width {w} cm."],
  hi: ["एक आयत {l} सेमी लंबा और {w} सेमी चौड़ा है। इसका परिमाप क्या है?", "लंबाई {l} सेमी और चौड़ाई {w} सेमी वाले आयत का परिमाप निकालिए।"],
  mr: ["एक आयत {l} सेमी लांब आणि {w} सेमी रुंद आहे. त्याची परिमिती किती?", "लांबी {l} सेमी व रुंदी {w} सेमी असलेल्या आयताची परिमिती काढा."],
  sen: "Perimeter of a rectangle = 2 × (length + width) = 2 × ({l} + {w}) = {ans} cm.",
  shi: "आयत का परिमाप = 2 × (लंबाई + चौड़ाई) = 2 × ({l} + {w}) = {ans} सेमी।",
  smr: "आयताची परिमिती = 2 × (लांबी + रुंदी) = 2 × ({l} + {w}) = {ans} सेमी.",
};
const fPerimRect = (tag: string, lvl: number, want: number, l: Range, w: Range) =>
  T(`prect:${tag}`, lvl, want, [l.n, w.n], PRECT, ([i, j]) => {
    const a = at(l, i!), b = at(w, j!), ans = 2 * (a + b);
    return { vars: { l: a, w: b }, answer: ans, expr: `2*(${a}+${b})`, decoys: [a + b, a * b, ans + 2], render: cm };
  });

const ARECT: SkinSet = {
  en: ["A rectangle is {l} cm long and {w} cm wide. What is its area?", "Find the area of a rectangle with length {l} cm and width {w} cm."],
  hi: ["एक आयत {l} सेमी लंबा और {w} सेमी चौड़ा है। इसका क्षेत्रफल क्या है?", "लंबाई {l} सेमी और चौड़ाई {w} सेमी वाले आयत का क्षेत्रफल निकालिए।"],
  mr: ["एक आयत {l} सेमी लांब आणि {w} सेमी रुंद आहे. त्याचे क्षेत्रफळ किती?", "लांबी {l} सेमी व रुंदी {w} सेमी असलेल्या आयताचे क्षेत्रफळ काढा."],
  sen: "Area of a rectangle = length × width = {l} × {w} = {ans} sq cm.",
  shi: "आयत का क्षेत्रफल = लंबाई × चौड़ाई = {l} × {w} = {ans} वर्ग सेमी।",
  smr: "आयताचे क्षेत्रफळ = लांबी × रुंदी = {l} × {w} = {ans} चौरस सेमी.",
};
const fAreaRect = (tag: string, lvl: number, want: number, l: Range, w: Range) =>
  T(`arect:${tag}`, lvl, want, [l.n, w.n], ARECT, ([i, j]) => {
    const a = at(l, i!), b = at(w, j!), ans = a * b;
    return { vars: { l: a, w: b }, answer: ans, expr: `${a}*${b}`, decoys: [2 * (a + b), ans + a, ans - b], render: sqcm };
  });

const SQGEO: SkinSet = {
  en: ["A square has sides of {a} cm. What is its {what}?", "Find the {what} of a square with side {a} cm."],
  hi: ["एक वर्ग की भुजा {a} सेमी है। इसका {whath} क्या है?", "भुजा {a} सेमी वाले वर्ग का {whath} निकालिए।"],
  mr: ["एका चौरसाची बाजू {a} सेमी आहे. त्याचे {whatm} किती?", "बाजू {a} सेमी असलेल्या चौरसाचे {whatm} काढा."],
  sen: "For a square with side {a} cm, the {what} works out as {work} = {ans}.",
  shi: "भुजा {a} सेमी वाले वर्ग के लिए {whath} = {work} = {ans}।",
  smr: "बाजू {a} सेमी असलेल्या चौरसासाठी {whatm} = {work} = {ans}.",
};
const fSquareGeo = (tag: string, lvl: number, want: number, a: Range, kind: "perimeter" | "area") =>
  T(`sqgeo:${kind}:${tag}`, lvl, want, [a.n], SQGEO, ([i]) => {
    const s = at(a, i!);
    if (kind === "perimeter") {
      const ans = 4 * s;
      return {
        vars: { a: s, what: "perimeter", whath: "परिमाप", whatm: "परिमिती", work: `4 × ${s}` },
        answer: ans, expr: `4*${s}`, decoys: [s * s, 2 * s, ans + 4], render: cm,
      };
    }
    const ans = s * s;
    return {
      vars: { a: s, what: "area", whath: "क्षेत्रफल", whatm: "क्षेत्रफळ", work: `${s} × ${s}` },
      answer: ans, expr: `${s}^2`, decoys: [4 * s, 2 * s, ans + s], render: sqcm,
    };
  });

const ATRI: SkinSet = {
  en: ["A triangle has base {b} cm and height {h} cm. What is its area?", "Find the area of a triangle with base {b} cm and height {h} cm."],
  hi: ["एक त्रिभुज का आधार {b} सेमी और ऊँचाई {h} सेमी है। इसका क्षेत्रफल क्या है?", "आधार {b} सेमी और ऊँचाई {h} सेमी वाले त्रिभुज का क्षेत्रफल निकालिए।"],
  mr: ["एका त्रिकोणाचा पाया {b} सेमी व उंची {h} सेमी आहे. त्याचे क्षेत्रफळ किती?", "पाया {b} सेमी व उंची {h} सेमी असलेल्या त्रिकोणाचे क्षेत्रफळ काढा."],
  sen: "Area of a triangle = ½ × base × height = ½ × {b} × {h} = {ans} sq cm.",
  shi: "त्रिभुज का क्षेत्रफल = ½ × आधार × ऊँचाई = ½ × {b} × {h} = {ans} वर्ग सेमी।",
  smr: "त्रिकोणाचे क्षेत्रफळ = ½ × पाया × उंची = ½ × {b} × {h} = {ans} चौरस सेमी.",
};
const fAreaTri = (tag: string, lvl: number, want: number, b: Range, h: Range) =>
  T(`atri:${tag}`, lvl, want, [b.n, h.n], ATRI, ([i, j]) => {
    const base = 2 * at(b, i!), ht = at(h, j!), ans = (base * ht) / 2;
    return { vars: { b: base, h: ht }, answer: ans, expr: `${base}*${ht}/2`, decoys: [base * ht, ans + base, ans - ht], render: sqcm };
  });

const VOL: SkinSet = {
  en: ["A cuboid measures {l} cm × {w} cm × {h} cm. What is its volume?", "Find the volume of a cuboid of length {l} cm, width {w} cm and height {h} cm."],
  hi: ["एक घनाभ {l} सेमी × {w} सेमी × {h} सेमी का है। इसका आयतन क्या है?", "लंबाई {l} सेमी, चौड़ाई {w} सेमी और ऊँचाई {h} सेमी वाले घनाभ का आयतन निकालिए।"],
  mr: ["एक इष्टिकाचिती {l} सेमी × {w} सेमी × {h} सेमी आहे. तिचे घनफळ किती?", "लांबी {l} सेमी, रुंदी {w} सेमी व उंची {h} सेमी असलेल्या इष्टिकाचितीचे घनफळ काढा."],
  sen: "Volume of a cuboid = l × w × h = {l} × {w} × {h} = {ans} cu cm.",
  shi: "घनाभ का आयतन = लंबाई × चौड़ाई × ऊँचाई = {l} × {w} × {h} = {ans} घन सेमी।",
  smr: "इष्टिकाचितीचे घनफळ = लांबी × रुंदी × उंची = {l} × {w} × {h} = {ans} घन सेमी.",
};
const fVolCuboid = (tag: string, lvl: number, want: number, l: Range, w: Range, h: Range) =>
  T(`vol:${tag}`, lvl, want, [l.n, w.n, h.n], VOL, ([i, j, k]) => {
    const a = at(l, i!), b = at(w, j!), c = at(h, k!), ans = a * b * c;
    return { vars: { l: a, w: b, h: c }, answer: ans, expr: `${a}*${b}*${c}`, decoys: [a * b + c, a + b + c, ans + a], render: cucm };
  });

const CUBE_VOL: SkinSet = {
  en: ["A cube has edges of {a} cm. What is its volume?", "Find the volume of a cube with edge {a} cm."],
  hi: ["एक घन का किनारा {a} सेमी है। इसका आयतन क्या है?", "किनारा {a} सेमी वाले घन का आयतन निकालिए।"],
  mr: ["एका घनाची कड {a} सेमी आहे. त्याचे घनफळ किती?", "कड {a} सेमी असलेल्या घनाचे घनफळ काढा."],
  sen: "Volume of a cube = edge³ = {a} × {a} × {a} = {ans} cu cm.",
  shi: "घन का आयतन = किनारा³ = {a} × {a} × {a} = {ans} घन सेमी।",
  smr: "घनाचे घनफळ = कड³ = {a} × {a} × {a} = {ans} घन सेमी.",
};
const fVolCube = (tag: string, lvl: number, want: number, a: Range) =>
  T(`cubevol:${tag}`, lvl, want, [a.n], CUBE_VOL, ([i]) => {
    const s = at(a, i!), ans = s ** 3;
    return { vars: { a: s }, answer: ans, expr: `${s}^3`, decoys: [s * s, 6 * s * s, 3 * s], render: cucm };
  });

const CIRCLE: SkinSet = {
  en: ["Taking π = 22/7, what is the {what} of a circle with radius {r} cm?", "A circle has radius {r} cm. Using π = 22/7, find its {what}."],
  hi: ["π = 22/7 लेते हुए, त्रिज्या {r} सेमी वाले वृत्त का {whath} क्या है?", "एक वृत्त की त्रिज्या {r} सेमी है। π = 22/7 लेकर इसका {whath} निकालिए।"],
  mr: ["π = 22/7 घेऊन, त्रिज्या {r} सेमी असलेल्या वर्तुळाचे {whatm} किती?", "एका वर्तुळाची त्रिज्या {r} सेमी आहे. π = 22/7 घेऊन त्याचे {whatm} काढा."],
  sen: "With π = 22/7 and r = {r}: {work} = {ans}. The answer is {ans}.",
  shi: "π = 22/7 और r = {r} के साथ: {work} = {ans}। उत्तर {ans} है।",
  smr: "π = 22/7 आणि r = {r} घेता: {work} = {ans}. उत्तर {ans} आहे.",
};
const fCircle = (tag: string, lvl: number, want: number, k: Range, kind: "area" | "circumference") =>
  T(`circle:${kind}:${tag}`, lvl, want, [k.n], CIRCLE, ([i]) => {
    const r = 7 * at(k, i!);
    if (kind === "area") {
      const ans = (22 * r * r) / 7;
      return {
        vars: { r, what: "area", whath: "क्षेत्रफल", whatm: "क्षेत्रफळ", work: `(22/7) × ${r} × ${r}` },
        answer: ans, expr: `22/7*${r}^2`, decoys: [(2 * 22 * r) / 7, ans / 2, ans + r], render: sqcm,
      };
    }
    const ans = (2 * 22 * r) / 7;
    return {
      vars: { r, what: "circumference", whath: "परिधि", whatm: "परीघ", work: `2 × (22/7) × ${r}` },
      answer: ans, expr: `2*22/7*${r}`, decoys: [(22 * r * r) / 7, ans * 2, ans + 7], render: cm,
    };
  });

const CYL: SkinSet = {
  en: ["Taking π = 22/7, find the volume of a cylinder with radius {r} cm and height {h} cm."],
  hi: ["π = 22/7 लेते हुए, त्रिज्या {r} सेमी और ऊँचाई {h} सेमी वाले बेलन का आयतन निकालिए।"],
  mr: ["π = 22/7 घेऊन, त्रिज्या {r} सेमी व उंची {h} सेमी असलेल्या दंडगोलाचे घनफळ काढा."],
  sen: "Volume of a cylinder = πr²h = (22/7) × {r}² × {h} = {ans} cu cm.",
  shi: "बेलन का आयतन = πr²h = (22/7) × {r}² × {h} = {ans} घन सेमी।",
  smr: "दंडगोलाचे घनफळ = πr²h = (22/7) × {r}² × {h} = {ans} घन सेमी.",
};
const fCylVol = (tag: string, lvl: number, want: number, k: Range, h: Range) =>
  T(`cyl:${tag}`, lvl, want, [k.n, h.n], CYL, ([i, j]) => {
    const r = 7 * at(k, i!), ht = at(h, j!);
    const ans = (22 * r * r * ht) / 7;
    return { vars: { r, h: ht }, answer: ans, expr: `22/7*${r}^2*${ht}`, decoys: [(22 * r * ht) / 7, ans / 2, ans + r], render: cucm };
  });

const ANGLE: SkinSet = {
  en: ["Two angles are {kind}. One measures {a}°. What is the other?", "An angle of {a}° and another angle are {kind}. Find the other angle."],
  hi: ["दो कोण {kindh} हैं। एक {a}° का है। दूसरा कितने का है?", "{a}° का एक कोण और दूसरा कोण {kindh} हैं। दूसरा कोण निकालिए।"],
  mr: ["दोन कोन {kindm} आहेत. एक {a}° चा आहे. दुसरा किती?", "{a}° चा कोन व दुसरा कोन {kindm} आहेत. दुसरा कोन काढा."],
  sen: "{kind} angles add to {tot}°, so the other angle is {tot}° − {a}° = {ans}°.",
  shi: "{kindh} कोणों का योग {tot}° होता है, इसलिए दूसरा कोण {tot}° − {a}° = {ans}° है।",
  smr: "{kindm} कोनांची बेरीज {tot}° असते, म्हणून दुसरा कोन {tot}° − {a}° = {ans}° आहे.",
};
const fAngle = (tag: string, lvl: number, want: number, a: Range, kind: "complementary" | "supplementary") =>
  T(`angle:${kind}:${tag}`, lvl, want, [a.n], ANGLE, ([i]) => {
    const tot = kind === "complementary" ? 90 : 180;
    const x = at(a, i!), ans = tot - x;
    const kindh = kind === "complementary" ? "पूरक" : "संपूरक";
    const kindm = kind === "complementary" ? "कोटिकोन" : "पूरककोन";
    return {
      vars: { a: x, kind, kindh, kindm, tot },
      answer: ans, expr: `${tot}-${x}`,
      decoys: [tot === 90 ? 180 - x : 90 - x, ans + 10, ans - 5],
      render: (n) => `${fmt(n)}°`,
    };
  });

const TRIANG: SkinSet = {
  en: ["Two angles of a triangle measure {a}° and {b}°. What is the third angle?"],
  hi: ["एक त्रिभुज के दो कोण {a}° और {b}° के हैं। तीसरा कोण कितने का है?"],
  mr: ["एका त्रिकोणाचे दोन कोन {a}° व {b}° आहेत. तिसरा कोन किती?"],
  sen: "Angles of a triangle add to 180°, so the third is 180° − {a}° − {b}° = {ans}°.",
  shi: "त्रिभुज के कोणों का योग 180° होता है, इसलिए तीसरा कोण 180° − {a}° − {b}° = {ans}° है।",
  smr: "त्रिकोणाच्या कोनांची बेरीज 180° असते, म्हणून तिसरा कोन 180° − {a}° − {b}° = {ans}° आहे.",
};
const fTriAngle = (tag: string, lvl: number, want: number, a: Range, b: Range) =>
  T(`triang:${tag}`, lvl, want, [a.n, b.n], TRIANG, ([i, j]) => {
    const x = at(a, i!), y = at(b, j!), ans = 180 - x - y;
    return { vars: { a: x, b: y }, answer: ans, expr: `180-${x}-${y}`, decoys: [90 - Math.min(x, y), ans + 10, x + y], render: (n) => `${fmt(n)}°` };
  });

/* -------------------------------------------------------------------------- */
/* Families — fractions, decimals, percentages, commercial                     */
/* -------------------------------------------------------------------------- */

const FRACOF: SkinSet = {
  en: ["What is {n}/{d} of {N}?", "Find {n}/{d} of {N}."],
  hi: ["{N} का {n}/{d} कितना है?", "{N} का {n}/{d} निकालिए।"],
  mr: ["{N} चा {n}/{d} किती?", "{N} चा {n}/{d} काढा."],
  sen: "Divide by the denominator, then multiply: {N} ÷ {d} = {u}, and {u} × {n} = {ans}.",
  shi: "हर से भाग दें, फिर गुणा करें: {N} ÷ {d} = {u}, और {u} × {n} = {ans}।",
  smr: "छेदाने भागा, मग गुणा: {N} ÷ {d} = {u}, आणि {u} × {n} = {ans}.",
};
const FRAC_D = [2, 3, 4, 5, 6, 8, 10, 12];
const fFracOf = (tag: string, lvl: number, want: number, u: Range) =>
  T(`fracof:${tag}`, lvl, want, [u.n, FRAC_D.length, 4], FRACOF, ([i, di, ni]) => {
    const d = FRAC_D[di!]!;
    const n = 1 + (ni! % (d - 1));
    const unit = at(u, i!), N = d * unit, ans = n * unit;
    return { vars: { n, d, N, u: unit }, answer: ans, expr: `${N}*${n}/${d}`, decoys: [N - ans, unit, ans + unit] };
  });

const FRACADD: SkinSet = {
  en: ["What is {a}/{d} + {b}/{d}?", "Add the fractions {a}/{d} and {b}/{d}."],
  hi: ["{a}/{d} + {b}/{d} कितना है?", "{a}/{d} और {b}/{d} को जोड़िए।"],
  mr: ["{a}/{d} + {b}/{d} किती?", "{a}/{d} आणि {b}/{d} यांची बेरीज करा."],
  sen: "Same denominator, so add the numerators: {a} + {b} = {s}. The answer is {s}/{d}.",
  shi: "हर समान है, इसलिए अंश जोड़ें: {a} + {b} = {s}। उत्तर {s}/{d} है।",
  smr: "छेद समान आहे, म्हणून अंश मिळवा: {a} + {b} = {s}. उत्तर {s}/{d} आहे.",
};
const fFracAdd = (tag: string, lvl: number, want: number, dLo: number, dHi: number) =>
  T(`fracadd:${tag}`, lvl, want, [6, 6, dHi - dLo + 1], FRACADD, ([ai, bi, k]) => {
    const a = 1 + ai!, b = 1 + bi!;
    const d = Math.max(a + b + 1, dLo + k!);
    const s = a + b;
    return {
      vars: { a, b, d, s },
      answer: s / d,
      expr: `(${a}+${b})/${d}`,
      decoys: [],
      answerText: `${s}/${d}`,
      decoyTexts: [`${s + 1}/${d}`, `${s - 1}/${d}`, `${s}/${d + 1}`, `${a * b}/${d}`],
    };
  });

const EQUIV: SkinSet = {
  en: ["Complete the equivalent fraction: {a}/{b} = ?/{B}.", "{a}/{b} = ?/{B}. What is the missing numerator?"],
  hi: ["तुल्य भिन्न पूरी कीजिए: {a}/{b} = ?/{B}।", "{a}/{b} = ?/{B}। लुप्त अंश क्या है?"],
  mr: ["समतुल्य अपूर्णांक पूर्ण करा: {a}/{b} = ?/{B}.", "{a}/{b} = ?/{B}. गाळलेला अंश किती?"],
  sen: "The denominator was multiplied by {k}, so multiply the numerator too: {a} × {k} = {ans}.",
  shi: "हर को {k} से गुणा किया गया, इसलिए अंश को भी गुणा करें: {a} × {k} = {ans}।",
  smr: "छेदाला {k} ने गुणले, म्हणून अंशालाही गुणा: {a} × {k} = {ans}.",
};
const fEquiv = (tag: string, lvl: number, want: number, k: Range) =>
  T(`equiv:${tag}`, lvl, want, [9, 9, k.n], EQUIV, ([ai, bj, ki]) => {
    const a = 1 + ai!, b = a + 1 + bj!, mult = at(k, ki!);
    const B = b * mult, ans = a * mult;
    return { vars: { a, b, B, k: mult }, answer: ans, expr: `${a}*${mult}`, decoys: [a + mult, b * mult, ans + a] };
  });

const DEC: SkinSet = {
  en: ["What is {a} {op} {b}?", "Calculate {a} {op} {b}.", "{a} {op} {b} = ?"],
  hi: ["{a} {op} {b} कितना है?", "{a} {op} {b} की गणना कीजिए।", "{a} {op} {b} = ?"],
  mr: ["{a} {op} {b} किती?", "{a} {op} {b} ची गणना करा.", "{a} {op} {b} = ?"],
  sen: "Line up the decimal points and work it out: {a} {op} {b} = {ans}.",
  shi: "दशमलव बिंदु मिलाकर हल करें: {a} {op} {b} = {ans}।",
  smr: "दशांश चिन्हे जुळवून सोडवा: {a} {op} {b} = {ans}.",
};
const fDec = (tag: string, lvl: number, want: number, a: Range, b: Range, op: "+" | "-" | "*") =>
  T(`dec:${op}:${tag}`, lvl, want, [a.n, b.n], DEC, ([i, j]) => {
    const x10 = at(a, i!);
    let y10 = at(b, j!);
    if (op === "-" && y10 >= x10) y10 = ((y10 * 7) % (x10 - 1)) + 1;
    const x = x10 / 10, y = y10 / 10;
    const value = op === "+" ? x + y : op === "-" ? x - y : x * y;
    const ans = Math.round(value * 100) / 100;
    const sym = op === "*" ? "×" : op === "-" ? "−" : "+";
    return {
      vars: { a: fmt(x), b: fmt(y), op: sym },
      answer: ans,
      expr: `${fmt(x)}${op}${fmt(y)}`,
      decoys: [ans + 1, ans - 0.1, ans + 0.1, ans * 10],
    };
  });

const PCT: SkinSet = {
  en: ["What is {p}% of {N}?", "Find {p}% of {N}."],
  hi: ["{N} का {p}% कितना है?", "{N} का {p}% निकालिए।"],
  mr: ["{N} च्या {p}% किती?", "{N} च्या {p}% काढा."],
  sen: "{p}% means {p} out of every 100: {N} × {p} ÷ 100 = {ans}.",
  shi: "{p}% का अर्थ है प्रति 100 पर {p}: {N} × {p} ÷ 100 = {ans}।",
  smr: "{p}% म्हणजे दर 100 मागे {p}: {N} × {p} ÷ 100 = {ans}.",
};
const fPct = (tag: string, lvl: number, want: number, u: Range) =>
  T(`pct:${tag}`, lvl, want, [u.n, 19], PCT, ([i, pi]) => {
    const p = 5 * (1 + pi!);
    const N = 20 * at(u, i!), ans = (N * p) / 100;
    return { vars: { p, N }, answer: ans, expr: `${p}*${N}/100`, decoys: [ans + N / 20, ans - N / 20, N - ans, ans + 5] };
  });

const PROFIT: SkinSet = {
  en: ["An article is bought for ₹{cp} and sold for ₹{sp}. What is the profit percentage?"],
  hi: ["एक वस्तु ₹{cp} में खरीदकर ₹{sp} में बेची गई। लाभ प्रतिशत क्या है?"],
  mr: ["एक वस्तू ₹{cp} ला घेऊन ₹{sp} ला विकली. नफ्याची टक्केवारी किती?"],
  sen: "Profit = ₹{sp} − ₹{cp} = ₹{pr}. Profit% = {pr} × 100 ÷ {cp} = {ans}%.",
  shi: "लाभ = ₹{sp} − ₹{cp} = ₹{pr}। लाभ% = {pr} × 100 ÷ {cp} = {ans}%।",
  smr: "नफा = ₹{sp} − ₹{cp} = ₹{pr}. नफा% = {pr} × 100 ÷ {cp} = {ans}%.",
};
const fProfit = (tag: string, lvl: number, want: number, m: Range, p: Range) =>
  T(`profit:${tag}`, lvl, want, [m.n, p.n], PROFIT, ([i, j]) => {
    const cp = 100 * at(m, i!), pct = at(p, j!);
    const pr = at(m, i!) * pct, sp = cp + pr;
    return {
      vars: { cp, sp, pr },
      answer: pct,
      expr: `(${sp}-${cp})*100/${cp}`,
      decoys: [pct + 5, pct - 5, pct * 2, pct + 1],
      render: (n) => `${fmt(n)}%`,
    };
  });

const SI: SkinSet = {
  en: ["Find the simple interest on ₹{P} at {r}% per year for {t} years."],
  hi: ["₹{P} पर {r}% वार्षिक दर से {t} वर्षों का साधारण ब्याज निकालिए।"],
  mr: ["₹{P} वर दरसाल {r}% दराने {t} वर्षांचे सरळ व्याज काढा."],
  sen: "Simple interest = P × R × T ÷ 100 = {P} × {r} × {t} ÷ 100 = ₹{ans}.",
  shi: "साधारण ब्याज = P × R × T ÷ 100 = {P} × {r} × {t} ÷ 100 = ₹{ans}।",
  smr: "सरळ व्याज = P × R × T ÷ 100 = {P} × {r} × {t} ÷ 100 = ₹{ans}.",
};
const fSI = (tag: string, lvl: number, want: number, m: Range, r: Range, t: Range) =>
  T(`si:${tag}`, lvl, want, [m.n, r.n, t.n], SI, ([i, j, k]) => {
    const P = 100 * at(m, i!), rate = at(r, j!), time = at(t, k!);
    const ans = (P * rate * time) / 100;
    return { vars: { P, r: rate, t: time }, answer: ans, expr: `${P}*${rate}*${time}/100`, decoys: [ans + P / 100, ans * 2, ans + rate], render: rupees };
  });

const CI: SkinSet = {
  en: ["Find the compound interest on ₹{P} at {r}% per year for 2 years, compounded yearly."],
  hi: ["₹{P} पर {r}% वार्षिक दर से 2 वर्षों का चक्रवृद्धि ब्याज निकालिए (वार्षिक संयोजन)।"],
  mr: ["₹{P} वर दरसाल {r}% दराने 2 वर्षांचे चक्रवाढ व्याज काढा (वार्षिक चक्रवाढ)."],
  sen: "Amount = P(1 + r/100)² = {P} × (1 + {r}/100)² and CI = amount − {P} = ₹{ans}.",
  shi: "मिश्रधन = P(1 + r/100)² = {P} × (1 + {r}/100)², और चक्रवृद्धि ब्याज = मिश्रधन − {P} = ₹{ans}।",
  smr: "रास = P(1 + r/100)² = {P} × (1 + {r}/100)², आणि चक्रवाढ व्याज = रास − {P} = ₹{ans}.",
};
const fCI = (tag: string, lvl: number, want: number, m: Range, r: Range) =>
  T(`ci:${tag}`, lvl, want, [m.n, r.n], CI, ([i, j]) => {
    const P = 1000 * at(m, i!), rate = at(r, j!);
    const amount = P * (1 + rate / 100) ** 2;
    const ans = Math.round((amount - P) * 100) / 100;
    return { vars: { P, r: rate }, answer: ans, expr: `${P}*(1+${rate}/100)^2-${P}`, decoys: [(P * rate * 2) / 100, ans + P / 100, ans * 2], render: rupees };
  });

const LCMF: SkinSet = {
  en: ["What is the LCM of {a} and {b}?", "Find the least common multiple of {a} and {b}."],
  hi: ["{a} और {b} का लघुत्तम समापवर्त्य (LCM) क्या है?", "{a} और {b} का LCM निकालिए।"],
  mr: ["{a} आणि {b} यांचा लसावि किती?", "{a} व {b} यांचा लसावि काढा."],
  sen: "LCM × HCF = product of the numbers. HCF is {g}, so LCM = {a} × {b} ÷ {g} = {ans}.",
  shi: "LCM × HCF = संख्याओं का गुणनफल। HCF {g} है, इसलिए LCM = {a} × {b} ÷ {g} = {ans}।",
  smr: "लसावि × मसावि = संख्यांचा गुणाकार. मसावि {g} आहे, म्हणून लसावि = {a} × {b} ÷ {g} = {ans}.",
};
const fLcm = (tag: string, lvl: number, want: number, a: Range, b: Range) =>
  T(`lcm:${tag}`, lvl, want, [a.n, b.n], LCMF, ([i, j]) => {
    const x = at(a, i!), y = at(b, j!), g = gcd(x, y), ans = (x * y) / g;
    return { vars: { a: x, b: y, g }, answer: ans, expr: `${x}*${y}/${g}`, decoys: [x * y, ans * 2, ans + g, x + y] };
  });

const HCFF: SkinSet = {
  en: ["What is the HCF of {a} and {b}?", "Find the highest common factor of {a} and {b}."],
  hi: ["{a} और {b} का महत्तम समापवर्तक (HCF) क्या है?", "{a} और {b} का HCF निकालिए।"],
  mr: ["{a} आणि {b} यांचा मसावि किती?", "{a} व {b} यांचा मसावि काढा."],
  sen: "LCM × HCF = product of the numbers. LCM is {l}, so HCF = {a} × {b} ÷ {l} = {ans}.",
  shi: "LCM × HCF = संख्याओं का गुणनफल। LCM {l} है, इसलिए HCF = {a} × {b} ÷ {l} = {ans}।",
  smr: "लसावि × मसावि = संख्यांचा गुणाकार. लसावि {l} आहे, म्हणून मसावि = {a} × {b} ÷ {l} = {ans}.",
};
const fHcf = (tag: string, lvl: number, want: number, g: Range, m1: Range, m2: Range) =>
  T(`hcf:${tag}`, lvl, want, [g.n, m1.n, m2.n], HCFF, ([i, j, k]) => {
    const base = at(g, i!);
    let p = at(m1, j!), q = at(m2, k!);
    if (gcd(p, q) !== 1) {
      q = q + 1;
      if (gcd(p, q) !== 1) p = p + 1;
    }
    if (gcd(p, q) !== 1 || p === q) {
      p = 2; q = 3;
    }
    const x = base * p, y = base * q, l = base * p * q;
    return { vars: { a: x, b: y, l }, answer: base, expr: `${x}*${y}/${l}`, decoys: [base * 2, base + 1, Math.max(2, base - 1), l] };
  });

const RATIO: SkinSet = {
  en: ["₹{T} is divided between two people in the ratio {a}:{b}. How much does the first person get?"],
  hi: ["₹{T} को दो व्यक्तियों में {a}:{b} के अनुपात में बाँटा गया। पहले व्यक्ति को कितना मिलेगा?"],
  mr: ["₹{T} दोन व्यक्तींमध्ये {a}:{b} या प्रमाणात वाटले. पहिल्या व्यक्तीला किती मिळतील?"],
  sen: "Total parts = {a} + {b} = {s}. One part = {T} ÷ {s} = {u}, so the first share is {a} × {u} = ₹{ans}.",
  shi: "कुल भाग = {a} + {b} = {s}। एक भाग = {T} ÷ {s} = {u}, इसलिए पहला हिस्सा {a} × {u} = ₹{ans}।",
  smr: "एकूण भाग = {a} + {b} = {s}. एक भाग = {T} ÷ {s} = {u}, म्हणून पहिला वाटा {a} × {u} = ₹{ans}.",
};
const fRatio = (tag: string, lvl: number, want: number, u: Range) =>
  T(`ratio:${tag}`, lvl, want, [u.n, 8, 8], RATIO, ([i, ai, bi]) => {
    const a = 1 + ai!, bRaw = 1 + bi!;
    const b = bRaw === a ? a + 1 : bRaw;
    const unit = 10 * at(u, i!), s = a + b, T = s * unit, ans = a * unit;
    return { vars: { T, a, b, s, u: unit }, answer: ans, expr: `${T}*${a}/(${a}+${b})`, decoys: [b * unit, T - a * unit - unit, ans + unit], render: rupees };
  });

const UNITC: SkinSet = {
  en: ["{k} identical notebooks cost ₹{T}. What does one notebook cost?", "If {k} identical pens cost ₹{T}, find the cost of one pen."],
  hi: ["{k} एक जैसी कॉपियों की कीमत ₹{T} है। एक कॉपी की कीमत क्या है?", "यदि {k} एक जैसे पेनों की कीमत ₹{T} है, तो एक पेन की कीमत निकालिए।"],
  mr: ["{k} सारख्या वह्यांची किंमत ₹{T} आहे. एका वहीची किंमत किती?", "जर {k} सारख्या पेनांची किंमत ₹{T} असेल, तर एका पेनाची किंमत काढा."],
  sen: "Divide the total by the count: ₹{T} ÷ {k} = ₹{ans} for one.",
  shi: "कुल को संख्या से भाग दें: ₹{T} ÷ {k} = ₹{ans} प्रति नग।",
  smr: "एकूण रक्कम संख्येने भागा: ₹{T} ÷ {k} = ₹{ans} प्रति नग.",
};
const fUnitCost = (tag: string, lvl: number, want: number, k: Range, u: Range) =>
  T(`unitc:${tag}`, lvl, want, [k.n, u.n], UNITC, ([i, j]) => {
    const count = at(k, i!), unit = at(u, j!), T = count * unit;
    return { vars: { k: count, T }, answer: unit, expr: `${T}/${count}`, decoys: [unit + 1, unit - 1, unit + count], render: rupees };
  });

const SPEED: SkinSet = {
  en: ["A car covers {d} km in {t} hours at a steady speed. What is its speed?"],
  hi: ["एक कार समान चाल से {t} घंटों में {d} किमी तय करती है। उसकी चाल क्या है?"],
  mr: ["एक कार सम वेगाने {t} तासांत {d} किमी अंतर कापते. तिचा वेग किती?"],
  sen: "Speed = distance ÷ time = {d} ÷ {t} = {ans} km/h.",
  shi: "चाल = दूरी ÷ समय = {d} ÷ {t} = {ans} किमी/घंटा।",
  smr: "वेग = अंतर ÷ वेळ = {d} ÷ {t} = {ans} किमी/तास.",
};
const fSpeed = (tag: string, lvl: number, want: number, v: Range, t: Range) =>
  T(`speed:${tag}`, lvl, want, [v.n, t.n], SPEED, ([i, j]) => {
    const speed = at(v, i!), time = at(t, j!), d = speed * time;
    return { vars: { d, t: time }, answer: speed, expr: `${d}/${time}`, decoys: [speed + 5, speed - 5, d - time], render: (n) => `${fmt(n)} km/h` };
  });

const AVG: SkinSet = {
  en: ["Find the average of {n1}, {n2}, {n3}, {n4} and {n5}."],
  hi: ["{n1}, {n2}, {n3}, {n4} और {n5} का औसत निकालिए।"],
  mr: ["{n1}, {n2}, {n3}, {n4} आणि {n5} यांची सरासरी काढा."],
  sen: "Add them and divide by 5: ({n1} + {n2} + {n3} + {n4} + {n5}) ÷ 5 = {ans}.",
  shi: "सबको जोड़कर 5 से भाग दें: ({n1} + {n2} + {n3} + {n4} + {n5}) ÷ 5 = {ans}।",
  smr: "बेरीज करून 5 ने भागा: ({n1} + {n2} + {n3} + {n4} + {n5}) ÷ 5 = {ans}.",
};
const OFFSETS = [
  [-2, -1, 0, 1, 2], [-4, -2, 0, 2, 4], [-6, -3, 0, 4, 5], [-8, -1, 2, 3, 4], [-5, -4, 1, 3, 5],
  [-9, -2, 0, 5, 6], [-3, -2, -1, 2, 4], [-7, 0, 1, 2, 4], [-10, -5, 3, 5, 7], [-6, -5, 2, 4, 5],
];
const fAvg = (tag: string, lvl: number, want: number, m: Range) =>
  T(`avg:${tag}`, lvl, want, [m.n, OFFSETS.length], AVG, ([i, oi]) => {
    const mean = at(m, i!);
    const nums = OFFSETS[oi!]!.map((o) => mean + o);
    const [n1, n2, n3, n4, n5] = nums as [number, number, number, number, number];
    return {
      vars: { n1, n2, n3, n4, n5 },
      answer: mean,
      expr: `(${n1}+${n2}+${n3}+${n4}+${n5})/5`,
      decoys: [mean + 1, mean - 1, mean + 5],
    };
  });

/* -------------------------------------------------------------------------- */
/* Families — algebra and senior maths                                         */
/* -------------------------------------------------------------------------- */

const SOLVE: SkinSet = {
  en: ["Solve for x: {a}x + {b} = {c}.", "If {a}x + {b} = {c}, what is x?"],
  hi: ["x के लिए हल कीजिए: {a}x + {b} = {c}।", "यदि {a}x + {b} = {c}, तो x क्या है?"],
  mr: ["x साठी सोडवा: {a}x + {b} = {c}.", "जर {a}x + {b} = {c}, तर x किती?"],
  sen: "Move {b} across: {a}x = {c} − {b} = {r}. Then x = {r} ÷ {a} = {ans}.",
  shi: "{b} को दूसरी ओर ले जाएँ: {a}x = {c} − {b} = {r}। फिर x = {r} ÷ {a} = {ans}।",
  smr: "{b} पलीकडे न्या: {a}x = {c} − {b} = {r}. मग x = {r} ÷ {a} = {ans}.",
};
const fSolve = (tag: string, lvl: number, want: number, a: Range, x: Range, b: Range) =>
  T(`solve:${tag}`, lvl, want, [a.n, x.n, b.n], SOLVE, ([i, j, k]) => {
    const coefficient = at(a, i!), xv = at(x, j!), bv = at(b, k!);
    const c = coefficient * xv + bv, r = c - bv;
    return { vars: { a: coefficient, b: bv, c, r }, answer: xv, expr: `(${c}-${bv})/${coefficient}`, decoys: [xv + 1, xv - 1, xv + coefficient] };
  });

const EVALL: SkinSet = {
  en: ["If x = {k}, what is the value of {p}x + {q}?", "Evaluate {p}x + {q} at x = {k}."],
  hi: ["यदि x = {k}, तो {p}x + {q} का मान क्या है?", "x = {k} पर {p}x + {q} का मान निकालिए।"],
  mr: ["जर x = {k}, तर {p}x + {q} ची किंमत किती?", "x = {k} असताना {p}x + {q} ची किंमत काढा."],
  sen: "Substitute x = {k}: {p} × {k} + {q} = {ans}.",
  shi: "x = {k} रखें: {p} × {k} + {q} = {ans}।",
  smr: "x = {k} ठेवा: {p} × {k} + {q} = {ans}.",
};
const fEvalLin = (tag: string, lvl: number, want: number, p: Range, q: Range, k: Range) =>
  T(`evallin:${tag}`, lvl, want, [p.n, q.n, k.n], EVALL, ([i, j, m]) => {
    const pv = at(p, i!), qv = at(q, j!), kv = at(k, m!);
    const ans = pv * kv + qv;
    return { vars: { p: pv, q: qv, k: kv }, answer: ans, expr: `${pv}*${kv}+${qv}`, decoys: [ans - qv, ans + pv, pv * (kv + qv)] };
  });

const POLY: SkinSet = {
  en: ["If p(x) = x² + {b}x + {c}, what is p({k})?", "Evaluate x² + {b}x + {c} at x = {k}."],
  hi: ["यदि p(x) = x² + {b}x + {c}, तो p({k}) क्या है?", "x = {k} पर x² + {b}x + {c} का मान निकालिए।"],
  mr: ["जर p(x) = x² + {b}x + {c}, तर p({k}) किती?", "x = {k} असताना x² + {b}x + {c} ची किंमत काढा."],
  sen: "Substitute x = {k}: {k}² + {b} × {k} + {c} = {ans}.",
  shi: "x = {k} रखें: {k}² + {b} × {k} + {c} = {ans}।",
  smr: "x = {k} ठेवा: {k}² + {b} × {k} + {c} = {ans}.",
};
const fPoly = (tag: string, lvl: number, want: number, b: Range, c: Range, k: Range) =>
  T(`poly:${tag}`, lvl, want, [b.n, c.n, k.n], POLY, ([i, j, m]) => {
    const bv = at(b, i!), cv = at(c, j!), kv = at(k, m!);
    const ans = kv * kv + bv * kv + cv;
    return { vars: { b: bv, c: cv, k: kv }, answer: ans, expr: `${kv}^2+(${bv})*${kv}+(${cv})`, decoys: [ans - cv, ans + kv, kv * kv] };
  });

const POW: SkinSet = {
  en: ["What is {a} to the power {e}?", "Evaluate {a}^{e}.", "Find the value of {a} raised to {e}."],
  hi: ["{a} की घात {e} कितनी है?", "{a}^{e} का मान निकालिए।", "{a} की {e}वीं घात का मान क्या है?"],
  mr: ["{a} चा {e} वा घात किती?", "{a}^{e} ची किंमत काढा.", "{a} च्या {e} व्या घाताची किंमत किती?"],
  sen: "Multiply {a} by itself {e} times: the result is {ans}.",
  shi: "{a} को {e} बार आपस में गुणा करें: परिणाम {ans} है।",
  smr: "{a} ला स्वतःशी {e} वेळा गुणा: उत्तर {ans} येते.",
};
const fPow = (tag: string, lvl: number, want: number, a: Range, e: Range) =>
  T(`pow:${tag}`, lvl, want, [a.n, e.n], POW, ([i, j]) => {
    const base = at(a, i!), exp = at(e, j!), ans = base ** exp;
    return { vars: { a: base, e: exp }, answer: ans, expr: `${base}^${exp}`, decoys: [base * exp, ans * base, base ** (exp - 1)] };
  });

const SQ: SkinSet = {
  en: ["What is the square of {n}?", "Find {n}²."],
  hi: ["{n} का वर्ग क्या है?", "{n}² निकालिए।"],
  mr: ["{n} चा वर्ग किती?", "{n}² काढा."],
  sen: "The square is the number times itself: {n} × {n} = {ans}.",
  shi: "वर्ग = संख्या × वही संख्या: {n} × {n} = {ans}।",
  smr: "वर्ग = संख्या × तीच संख्या: {n} × {n} = {ans}.",
};
const fSquare = (tag: string, lvl: number, want: number, n: Range) =>
  T(`square:${tag}`, lvl, want, [n.n], SQ, ([i]) => {
    const x = at(n, i!), ans = x * x;
    return { vars: { n: x }, answer: ans, expr: `${x}^2`, decoys: [2 * x, ans + x, (x + 1) * (x + 1)] };
  });

const SQRT: SkinSet = {
  en: ["What is the square root of {N}?", "Find √{N}."],
  hi: ["{N} का वर्गमूल क्या है?", "√{N} निकालिए।"],
  mr: ["{N} चे वर्गमूळ किती?", "√{N} काढा."],
  sen: "{ans} × {ans} = {N}, so the square root of {N} is {ans}.",
  shi: "{ans} × {ans} = {N}, इसलिए {N} का वर्गमूल {ans} है।",
  smr: "{ans} × {ans} = {N}, म्हणून {N} चे वर्गमूळ {ans} आहे.",
};
const fSqrt = (tag: string, lvl: number, want: number, n: Range) =>
  T(`sqrt:${tag}`, lvl, want, [n.n], SQRT, ([i]) => {
    const x = at(n, i!), N = x * x;
    return { vars: { N }, answer: x, expr: `(${N})^0.5`, decoys: [x + 1, x - 1, Math.round(N / 2)] };
  });

const CUBEF: SkinSet = {
  en: ["What is the cube of {n}?", "Find {n}³."],
  hi: ["{n} का घन क्या है?", "{n}³ निकालिए।"],
  mr: ["{n} चा घन किती?", "{n}³ काढा."],
  sen: "The cube is the number used three times: {n} × {n} × {n} = {ans}.",
  shi: "घन = संख्या × संख्या × संख्या: {n} × {n} × {n} = {ans}।",
  smr: "घन = संख्या × संख्या × संख्या: {n} × {n} × {n} = {ans}.",
};
const fCube = (tag: string, lvl: number, want: number, n: Range) =>
  T(`cube:${tag}`, lvl, want, [n.n], CUBEF, ([i]) => {
    const x = at(n, i!), ans = x ** 3;
    return { vars: { n: x }, answer: ans, expr: `${x}^3`, decoys: [x * x, 3 * x, ans + x] };
  });

const CBRT: SkinSet = {
  en: ["What is the cube root of {N}?", "Find ∛{N}."],
  hi: ["{N} का घनमूल क्या है?", "∛{N} निकालिए।"],
  mr: ["{N} चे घनमूळ किती?", "∛{N} काढा."],
  sen: "{ans} × {ans} × {ans} = {N}, so the cube root of {N} is {ans}.",
  shi: "{ans} × {ans} × {ans} = {N}, इसलिए {N} का घनमूल {ans} है।",
  smr: "{ans} × {ans} × {ans} = {N}, म्हणून {N} चे घनमूळ {ans} आहे.",
};
const fCbrt = (tag: string, lvl: number, want: number, n: Range) =>
  T(`cbrt:${tag}`, lvl, want, [n.n], CBRT, ([i]) => {
    const x = at(n, i!), N = x ** 3;
    return { vars: { N }, answer: x, expr: `(${N})^(1/3)`, decoys: [x + 1, x - 1, Math.round(N / 3)] };
  });

const APN: SkinSet = {
  en: ["An arithmetic progression starts at {a} with common difference {d}. What is its {n}th term?"],
  hi: ["एक समांतर श्रेढ़ी {a} से शुरू होती है और सार्व अंतर {d} है। इसका {n}वाँ पद क्या है?"],
  mr: ["एक अंकगणिती श्रेढी {a} पासून सुरू होते व सामान्य फरक {d} आहे. तिचे {n} वे पद किती?"],
  sen: "nth term = a + (n − 1)d = {a} + ({n} − 1) × {d} = {ans}.",
  shi: "nवाँ पद = a + (n − 1)d = {a} + ({n} − 1) × {d} = {ans}।",
  smr: "n वे पद = a + (n − 1)d = {a} + ({n} − 1) × {d} = {ans}.",
};
const fApN = (tag: string, lvl: number, want: number, a: Range, d: Range, n: Range) =>
  T(`apn:${tag}`, lvl, want, [a.n, d.n, n.n], APN, ([i, j, k]) => {
    const av = at(a, i!), dv = at(d, j!), nv = at(n, k!);
    const ans = av + (nv - 1) * dv;
    return { vars: { a: av, d: dv, n: nv }, answer: ans, expr: `${av}+(${nv}-1)*${dv}`, decoys: [ans + dv, ans - dv, av + nv * dv] };
  });

const APS: SkinSet = {
  en: ["An arithmetic progression starts at {a} with common difference {d}. What is the sum of its first {n} terms?"],
  hi: ["एक समांतर श्रेढ़ी {a} से शुरू होती है और सार्व अंतर {d} है। इसके पहले {n} पदों का योग क्या है?"],
  mr: ["एक अंकगणिती श्रेढी {a} पासून सुरू होते व सामान्य फरक {d} आहे. तिच्या पहिल्या {n} पदांची बेरीज किती?"],
  sen: "Sum = n/2 × (2a + (n − 1)d) = {n}/2 × (2 × {a} + ({n} − 1) × {d}) = {ans}.",
  shi: "योग = n/2 × (2a + (n − 1)d) = {n}/2 × (2 × {a} + ({n} − 1) × {d}) = {ans}।",
  smr: "बेरीज = n/2 × (2a + (n − 1)d) = {n}/2 × (2 × {a} + ({n} − 1) × {d}) = {ans}.",
};
const fApSum = (tag: string, lvl: number, want: number, a: Range, d: Range, n: Range) =>
  T(`aps:${tag}`, lvl, want, [a.n, d.n, n.n], APS, ([i, j, k]) => {
    const av = at(a, i!), dv = at(d, j!), nv = at(n, k!);
    const ans = (nv * (2 * av + (nv - 1) * dv)) / 2;
    return { vars: { a: av, d: dv, n: nv }, answer: ans, expr: `${nv}/2*(2*${av}+(${nv}-1)*${dv})`, decoys: [ans + nv, ans - dv, nv * av] };
  });

const GPN: SkinSet = {
  en: ["A geometric progression starts at {a} with common ratio {r}. What is its {n}th term?"],
  hi: ["एक गुणोत्तर श्रेढ़ी {a} से शुरू होती है और सार्व अनुपात {r} है। इसका {n}वाँ पद क्या है?"],
  mr: ["एक भूमिती श्रेढी {a} पासून सुरू होते व सामान्य गुणोत्तर {r} आहे. तिचे {n} वे पद किती?"],
  sen: "nth term = a × r^(n−1) = {a} × {r}^({n}−1) = {ans}.",
  shi: "nवाँ पद = a × r^(n−1) = {a} × {r}^({n}−1) = {ans}।",
  smr: "n वे पद = a × r^(n−1) = {a} × {r}^({n}−1) = {ans}.",
};
const fGpN = (tag: string, lvl: number, want: number, a: Range, r: Range, n: Range) =>
  T(`gpn:${tag}`, lvl, want, [a.n, r.n, n.n], GPN, ([i, j, k]) => {
    const av = at(a, i!), rv = at(r, j!), nv = at(n, k!);
    const ans = av * rv ** (nv - 1);
    return { vars: { a: av, r: rv, n: nv }, answer: ans, expr: `${av}*${rv}^(${nv}-1)`, decoys: [ans * rv, Math.round(ans / rv), av * rv * nv] };
  });

const QUAD: SkinSet = {
  en: ["What is the larger root of x² − {b}x + {c} = 0?", "Solve x² − {b}x + {c} = 0 and give the larger root."],
  hi: ["x² − {b}x + {c} = 0 का बड़ा मूल क्या है?", "x² − {b}x + {c} = 0 को हल करके बड़ा मूल बताइए।"],
  mr: ["x² − {b}x + {c} = 0 चे मोठे मूळ किती?", "x² − {b}x + {c} = 0 सोडवून मोठे मूळ सांगा."],
  sen: "It factors as (x − {p})(x − {q}) = 0, since {p} + {q} = {b} and {p} × {q} = {c}. The larger root is {ans}.",
  shi: "यह (x − {p})(x − {q}) = 0 में विभाजित होता है, क्योंकि {p} + {q} = {b} और {p} × {q} = {c}। बड़ा मूल {ans} है।",
  smr: "याचे अवयव (x − {p})(x − {q}) = 0, कारण {p} + {q} = {b} आणि {p} × {q} = {c}. मोठे मूळ {ans} आहे.",
};
const fQuad = (tag: string, lvl: number, want: number, p: Range, gap: Range) =>
  T(`quad:${tag}`, lvl, want, [p.n, gap.n], QUAD, ([i, j]) => {
    const small = at(p, i!), q = small + at(gap, j!);
    const b = small + q, c = small * q;
    return { vars: { b, c, p: small, q }, answer: q, expr: `(${b}+(${b}^2-4*${c})^0.5)/2`, decoys: [small, q + 1, b] };
  });

const NCR: SkinSet = {
  en: ["In how many ways can {r} students be chosen from {n}?", "What is the value of C({n}, {r})?"],
  hi: ["{n} विद्यार्थियों में से {r} को कितने तरीकों से चुना जा सकता है?", "C({n}, {r}) का मान क्या है?"],
  mr: ["{n} विद्यार्थ्यांतून {r} किती प्रकारे निवडता येतील?", "C({n}, {r}) ची किंमत किती?"],
  sen: "C(n, r) = n! ÷ (r!(n−r)!): C({n}, {r}) = {ans}.",
  shi: "C(n, r) = n! ÷ (r!(n−r)!): C({n}, {r}) = {ans}।",
  smr: "C(n, r) = n! ÷ (r!(n−r)!): C({n}, {r}) = {ans}.",
};
const fNcr = (tag: string, lvl: number, want: number, n: Range, r: Range) =>
  T(`ncr:${tag}`, lvl, want, [n.n, r.n], NCR, ([i, j]) => {
    const nv = at(n, i!), rv = at(r, j!);
    let num = "", den = "", ans = 1;
    for (let t = 0; t < rv; t++) {
      num += (t ? "*" : "") + (nv - t);
      den += (t ? "*" : "") + (t + 1);
      ans = (ans * (nv - t)) / (t + 1);
    }
    return { vars: { n: nv, r: rv }, answer: ans, expr: `${num}/(${den})`, decoys: [ans * rv, ans + nv, Math.round(ans / 2)] };
  });

const NPR: SkinSet = {
  en: ["In how many ways can {r} of {n} runners finish first and second{third}?", "What is the value of P({n}, {r})?"],
  hi: ["{n} धावकों में से {r} स्थानों को कितने क्रमों में भरा जा सकता है?", "P({n}, {r}) का मान क्या है?"],
  mr: ["{n} धावपटूंतून {r} स्थाने किती क्रमांनी भरता येतील?", "P({n}, {r}) ची किंमत किती?"],
  sen: "P(n, r) multiplies r falling factors: P({n}, {r}) = {ans}.",
  shi: "P(n, r) में r घटते गुणनखंड होते हैं: P({n}, {r}) = {ans}।",
  smr: "P(n, r) मध्ये r उतरते घटक असतात: P({n}, {r}) = {ans}.",
};
const fNpr = (tag: string, lvl: number, want: number, n: Range, r: Range) =>
  T(`npr:${tag}`, lvl, want, [n.n, r.n], NPR, ([i, j]) => {
    const nv = at(n, i!), rv = at(r, j!);
    let expr = "", ans = 1;
    for (let t = 0; t < rv; t++) {
      expr += (t ? "*" : "") + (nv - t);
      ans *= nv - t;
    }
    return { vars: { n: nv, r: rv, third: rv > 2 ? " and third" : "" }, answer: ans, expr, decoys: [ans / (nv - rv + 1), ans * 2, ans + nv] };
  });

const DET: SkinSet = {
  en: ["Find the determinant of the 2×2 matrix with rows [{a}, {b}] and [{c}, {d}]."],
  hi: ["उस 2×2 आव्यूह का सारणिक निकालिए जिसकी पंक्तियाँ [{a}, {b}] और [{c}, {d}] हैं।"],
  mr: ["ज्या 2×2 सारणीच्या ओळी [{a}, {b}] आणि [{c}, {d}] आहेत तिचा निर्धारक काढा."],
  sen: "det = ad − bc = ({a})({d}) − ({b})({c}) = {ans}.",
  shi: "सारणिक = ad − bc = ({a})({d}) − ({b})({c}) = {ans}।",
  smr: "निर्धारक = ad − bc = ({a})({d}) − ({b})({c}) = {ans}.",
};
const fDet = (tag: string, lvl: number, want: number, r: Range) =>
  T(`det:${tag}`, lvl, want, [r.n, r.n, r.n, r.n], DET, ([i, j, k, m]) => {
    const half = Math.floor(r.n / 2);
    const v = (x: number) => at(r, x) - half;
    const a = v(i!), b = v(j!), c = v(k!), d = v(m!);
    const ans = a * d - b * c;
    return { vars: { a, b, c, d }, answer: ans, expr: `(${a})*(${d})-(${b})*(${c})`, decoys: [a * d + b * c, -ans, ans + 1] };
  });

const DOT: SkinSet = {
  en: ["Find the dot product of the vectors ({a1}, {a2}, {a3}) and ({b1}, {b2}, {b3})."],
  hi: ["सदिशों ({a1}, {a2}, {a3}) और ({b1}, {b2}, {b3}) का अदिश गुणनफल निकालिए।"],
  mr: ["({a1}, {a2}, {a3}) आणि ({b1}, {b2}, {b3}) या सदिशांचा अदिश गुणाकार काढा."],
  sen: "Multiply matching components and add: ({a1})({b1}) + ({a2})({b2}) + ({a3})({b3}) = {ans}.",
  shi: "संगत घटक गुणा कर जोड़ें: ({a1})({b1}) + ({a2})({b2}) + ({a3})({b3}) = {ans}।",
  smr: "जुळणारे घटक गुणून मिळवा: ({a1})({b1}) + ({a2})({b2}) + ({a3})({b3}) = {ans}.",
};
const fDot = (tag: string, lvl: number, want: number, r: Range) =>
  T(`dot:${tag}`, lvl, want, [r.n, r.n, r.n, r.n, r.n, r.n], DOT, (c) => {
    const half = Math.floor(r.n / 2);
    const v = (x: number) => at(r, x) - half;
    const [a1, a2, a3, b1, b2, b3] = [v(c[0]!), v(c[1]!), v(c[2]!), v(c[3]!), v(c[4]!), v(c[5]!)];
    const ans = a1 * b1 + a2 * b2 + a3 * b3;
    return {
      vars: { a1, a2, a3, b1, b2, b3 },
      answer: ans,
      expr: `(${a1})*(${b1})+(${a2})*(${b2})+(${a3})*(${b3})`,
      decoys: [ans + 1, -ans === ans ? ans + 2 : -ans, ans - 2],
    };
  });

const DERIV: SkinSet = {
  en: ["If f(x) = {a}x² + {b}x + {c}, what is f′({k})?", "Find the derivative of {a}x² + {b}x + {c} at x = {k}."],
  hi: ["यदि f(x) = {a}x² + {b}x + {c}, तो f′({k}) क्या है?", "x = {k} पर {a}x² + {b}x + {c} का अवकलज निकालिए।"],
  mr: ["जर f(x) = {a}x² + {b}x + {c}, तर f′({k}) किती?", "x = {k} असताना {a}x² + {b}x + {c} चे अवकलज काढा."],
  sen: "f′(x) = 2 × {a}x + {b}, so f′({k}) = 2 × {a} × {k} + {b} = {ans}.",
  shi: "f′(x) = 2 × {a}x + {b}, इसलिए f′({k}) = 2 × {a} × {k} + {b} = {ans}।",
  smr: "f′(x) = 2 × {a}x + {b}, म्हणून f′({k}) = 2 × {a} × {k} + {b} = {ans}.",
};
const fDeriv = (tag: string, lvl: number, want: number, a: Range, b: Range, k: Range) =>
  T(`deriv:${tag}`, lvl, want, [a.n, b.n, k.n, 5], DERIV, ([i, j, m, ci]) => {
    const av = at(a, i!), bv = at(b, j!), kv = at(k, m!), c = 1 + ci!;
    const ans = 2 * av * kv + bv;
    return { vars: { a: av, b: bv, c, k: kv }, answer: ans, expr: `2*${av}*${kv}+${bv}`, decoys: [ans - bv, av * kv + bv, ans + av] };
  });

const INTEG: SkinSet = {
  en: ["Evaluate the definite integral of (2x + {b}) from x = {p} to x = {q}."],
  hi: ["x = {p} से x = {q} तक (2x + {b}) का निश्चित समाकल निकालिए।"],
  mr: ["x = {p} पासून x = {q} पर्यंत (2x + {b}) चे निश्चित संकलन काढा."],
  sen: "The antiderivative is x² + {b}x. Evaluate: ({q}² + {b}×{q}) − ({p}² + {b}×{p}) = {ans}.",
  shi: "प्रतिअवकलज x² + {b}x है। मान: ({q}² + {b}×{q}) − ({p}² + {b}×{p}) = {ans}।",
  smr: "प्रतिसंकलन x² + {b}x आहे. किंमत: ({q}² + {b}×{q}) − ({p}² + {b}×{p}) = {ans}.",
};
const fInteg = (tag: string, lvl: number, want: number, b: Range, p: Range, w: Range) =>
  T(`integ:${tag}`, lvl, want, [b.n, p.n, w.n], INTEG, ([i, j, k]) => {
    const bv = at(b, i!), pv = at(p, j!), qv = pv + at(w, k!);
    const ans = qv * qv + bv * qv - (pv * pv + bv * pv);
    return { vars: { b: bv, p: pv, q: qv }, answer: ans, expr: `${qv}^2+${bv}*${qv}-(${pv}^2+${bv}*${pv})`, decoys: [ans + bv, ans - qv, ans + 2] };
  });

const TRIPLES: [number, number, number][] = [
  [3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41], [12, 35, 37], [11, 60, 61],
];
const DIST: SkinSet = {
  en: ["What is the distance between the points ({x1}, {y1}) and ({x2}, {y2})?"],
  hi: ["बिंदुओं ({x1}, {y1}) और ({x2}, {y2}) के बीच की दूरी क्या है?"],
  mr: ["({x1}, {y1}) आणि ({x2}, {y2}) या बिंदूंमधील अंतर किती?"],
  sen: "Distance = √((x₂−x₁)² + (y₂−y₁)²) = √({dx}² + {dy}²) = {ans}.",
  shi: "दूरी = √((x₂−x₁)² + (y₂−y₁)²) = √({dx}² + {dy}²) = {ans}।",
  smr: "अंतर = √((x₂−x₁)² + (y₂−y₁)²) = √({dx}² + {dy}²) = {ans}.",
};
const fDist = (tag: string, lvl: number, want: number, o: Range, k: Range) =>
  T(`dist:${tag}`, lvl, want, [o.n, o.n, k.n, TRIPLES.length], DIST, ([xi, yi, ki, ti]) => {
    const [ta, tb, tc] = TRIPLES[ti!]!;
    const scale = at(k, ki!);
    const x1 = at(o, xi!), y1 = at(o, yi!);
    const dx = ta * scale, dy = tb * scale;
    const x2 = x1 + dx, y2 = y1 + dy, ans = tc * scale;
    return {
      vars: { x1, y1, x2, y2, dx, dy },
      answer: ans,
      expr: `((${x2}-${x1})^2+(${y2}-${y1})^2)^0.5`,
      decoys: [dx + dy, ans + 1, Math.abs(dx - dy) || ans + 2],
    };
  });

const SLOPE: SkinSet = {
  en: ["What is the slope of the line through ({x1}, {y1}) and ({x2}, {y2})?"],
  hi: ["({x1}, {y1}) और ({x2}, {y2}) से गुज़रने वाली रेखा की ढाल क्या है?"],
  mr: ["({x1}, {y1}) आणि ({x2}, {y2}) मधून जाणाऱ्या रेषेचा उतार किती?"],
  sen: "Slope = (y₂ − y₁) ÷ (x₂ − x₁) = ({y2} − {y1}) ÷ ({x2} − {x1}) = {ans}.",
  shi: "ढाल = (y₂ − y₁) ÷ (x₂ − x₁) = ({y2} − {y1}) ÷ ({x2} − {x1}) = {ans}।",
  smr: "उतार = (y₂ − y₁) ÷ (x₂ − x₁) = ({y2} − {y1}) ÷ ({x2} − {x1}) = {ans}.",
};
const fSlope = (tag: string, lvl: number, want: number, m: Range, dx: Range, o: Range) =>
  T(`slope:${tag}`, lvl, want, [m.n, dx.n, o.n, o.n], SLOPE, ([mi, di, xi, yi]) => {
    const half = Math.floor(m.n / 2);
    const slope = at(m, mi!) - half || half + 1;
    const run = at(dx, di!);
    const x1 = at(o, xi!), y1 = at(o, yi!);
    const x2 = x1 + run, y2 = y1 + slope * run;
    return { vars: { x1, y1, x2, y2 }, answer: slope, expr: `(${y2}-${y1})/(${x2}-${x1})`, decoys: [-slope || slope + 1, slope + 1, slope - 1] };
  });

const PROB: SkinSet = {
  en: ["A bag holds {r} red and {b} blue marbles. One is drawn at random. What is the probability it is red?"],
  hi: ["एक थैले में {r} लाल और {b} नीले कंचे हैं। एक कंचा यादृच्छिक निकाला जाता है। उसके लाल होने की प्रायिकता क्या है?"],
  mr: ["एका पिशवीत {r} लाल आणि {b} निळ्या गोट्या आहेत. एक गोटी सहज काढली. ती लाल असण्याची संभाव्यता किती?"],
  sen: "P(red) = favourable ÷ total = {r} ÷ ({r} + {b}) = {ans}.",
  shi: "P(लाल) = अनुकूल ÷ कुल = {r} ÷ ({r} + {b}) = {ans}।",
  smr: "P(लाल) = अनुकूल ÷ एकूण = {r} ÷ ({r} + {b}) = {ans}.",
};
const fProb = (tag: string, lvl: number, want: number, r: Range, b: Range) =>
  T(`prob:${tag}`, lvl, want, [r.n, b.n], PROB, ([i, j]) => {
    const red = at(r, i!), blue0 = at(b, j!);
    // red === blue would make the "blue/total" decoy NUMERICALLY equal to the
    // reduced answer under a different spelling — two correct options, and a
    // child marked wrong for picking the honest one.
    const blue = blue0 === red ? blue0 + 1 : blue0;
    const total = red + blue, g = gcd(red, total);
    const ansText = `${red / g}/${total / g}`;
    return {
      vars: { r: red, b: blue },
      answer: red / total,
      expr: `${red}/(${red}+${blue})`,
      decoys: [],
      answerText: ansText,
      decoyTexts: [
        `${blue}/${total}` === ansText ? `${blue + 1}/${total}` : `${blue}/${total}`,
        `${red}/${blue === red ? blue + 1 : blue}`,
        `1/${total}` === ansText ? `2/${total + 1}` : `1/${total}`,
        `${red}/${total + 1}`,
      ],
    };
  });

const TRIG: SkinSet = {
  en: ["A right triangle has legs {o} and {a} with hypotenuse {h}. For the angle opposite the side of length {o}, what is {fn} of that angle?"],
  hi: ["एक समकोण त्रिभुज की भुजाएँ {o} और {a} हैं तथा कर्ण {h} है। लंबाई {o} वाली भुजा के सामने के कोण के लिए {fn} का मान क्या है?"],
  mr: ["एका काटकोन त्रिकोणाच्या बाजू {o} व {a} असून कर्ण {h} आहे. लांबी {o} च्या बाजूसमोरील कोनासाठी {fn} ची किंमत किती?"],
  sen: "For that angle, opposite = {o}, adjacent = {a}, hypotenuse = {h}; so {fn} = {work} = {ans}.",
  shi: "उस कोण के लिए सम्मुख = {o}, आसन्न = {a}, कर्ण = {h}; अतः {fn} = {work} = {ans}।",
  smr: "त्या कोनासाठी समोरील = {o}, लगतची = {a}, कर्ण = {h}; म्हणून {fn} = {work} = {ans}.",
};
const fTrig = (tag: string, lvl: number, want: number, k: Range) =>
  T(`trig:${tag}`, lvl, want, [k.n, TRIPLES.length, 3], TRIG, ([ki, ti, fi]) => {
    const [o0, a0, h0] = TRIPLES[ti!]!;
    const scale = at(k, ki!);
    const o = o0 * scale, a = a0 * scale, h = h0 * scale;
    const fn = ["sin", "cos", "tan"][fi!]!;
    const [num, den] = fn === "sin" ? [o0, h0] : fn === "cos" ? [a0, h0] : [o0, a0];
    const g = gcd(num, den);
    const ansText = `${num / g}/${den / g}`;
    const all = [`${o0}/${h0}`, `${a0}/${h0}`, `${o0}/${a0}`, `${a0}/${o0}`, `${h0}/${o0}`];
    return {
      vars: { o, a, h, fn, work: `${num * scale}/${den * scale}` },
      answer: num / den,
      expr: `${num}/${den}`,
      decoys: [],
      answerText: ansText,
      decoyTexts: all.filter((t) => t !== ansText),
    };
  });

/* ========================================================================== */
/* The grade plans                                                             */
/* ========================================================================== */

function mkTopic(
  grade: number,
  position: number,
  key: string,
  nameEn: string,
  nameHi: string,
  nameMr: string,
  templates: Template[],
): TopicSpec {
  return {
    slug: `drill-g${grade}-${key}`,
    classLevel: grade,
    chapter: `Class ${grade} drills`,
    name: nameEn,
    summary: `Generated practice drills for class ${grade}. Every answer is machine-checked.`,
    hi: { name: nameHi, summary: `कक्षा ${grade} के लिए अभ्यास प्रश्न। हर उत्तर मशीन से जाँचा गया है।` },
    mr: { name: nameMr, summary: `इयत्ता ${grade} साठी सरावाचे प्रश्न. प्रत्येक उत्तर मशीनने तपासले आहे.` },
    position,
    templates,
  };
}

const GRADE_TARGET = 100_500;

/**
 * The mixed-practice filler that tops every grade up to GRADE_TARGET. Its
 * parameter bands are DISJOINT PER GRADE (base slides with the grade) so ten
 * grades drawing from the same families can never exhaust each other's stems.
 */
function filler(grade: number, position: number, deficit: number): TopicSpec {
  const weights = [0.08, 0.15, 0.25, 0.25, 0.17, 0.1];
  const wants = weights.map((w) => Math.floor(deficit * w));
  wants[5] = deficit - wants.slice(0, 5).reduce((a, b) => a + b, 0);
  const base = 10_000 + (grade - 3) * 9_000;
  const mulBase = 1_000 + (grade - 3) * 800;
  const divBase = 100 + (grade - 3) * 80;
  const g = `g${grade}`;
  return mkTopic(grade, position, "mixed", "Mixed practice", "मिश्रित अभ्यास", "संमिश्र सराव", [
    fAdd(`${g}mixL1`, 1, wants[0]!, R(base, base + 4499), R(base, base + 4499)),
    fSub(`${g}mixL2`, 2, wants[1]!, R(base + 4500, base + 8999), R(base, base + 4499)),
    fMul(`${g}mixL3`, 3, wants[2]!, R(mulBase, mulBase + 799), R(11, 99)),
    fDiv(`${g}mixL4`, 4, wants[3]!, R(divBase, divBase + 79), R(11, 99)),
    fAdd(`${g}mixL5`, 5, wants[4]!, R(base + 4500, base + 8999), R(base + 4500, base + 8999)),
    fSub(`${g}mixL6`, 6, wants[5]!, R(base, base + 4499), R(1000 + (grade - 3) * 350, 1000 + (grade - 3) * 350 + 349)),
  ]);
}

function curriculum(grade: number): TopicSpec[] {
  const g = `g${grade}`;
  switch (grade) {
    case 3:
      return [
        mkTopic(3, 0, "addsub", "Addition and subtraction", "जोड़ और घटाव", "बेरीज आणि वजाबाकी", [
          fAdd(`${g}a1`, 1, 800, R(10, 49), R(10, 49)),
          fAdd(`${g}a2`, 2, 1500, R(50, 99), R(10, 99)),
          fSub(`${g}a3`, 3, 2500, R(60, 99), R(10, 59)),
          fAdd(`${g}a4`, 4, 2500, R(100, 499), R(100, 499)),
          fSub(`${g}a5`, 5, 1750, R(500, 999), R(100, 499)),
          fAdd(`${g}a6`, 6, 1000, R(1000, 4999), R(1000, 4999)),
        ]),
        mkTopic(3, 1, "tables", "Multiplication tables", "पहाड़े", "पाढे", [
          fMul(`${g}t1`, 1, 450, R(2, 9), R(2, 19)),
          fMul(`${g}t2`, 2, 1500, R(2, 9), R(20, 99)),
          fMul(`${g}t3`, 3, 2500, R(10, 19), R(11, 99)),
          fMul(`${g}t4`, 4, 2500, R(20, 49), R(11, 99)),
          fMul(`${g}t5`, 5, 1750, R(50, 99), R(11, 99)),
          fMul(`${g}t6`, 6, 1000, R(100, 999), R(2, 9)),
        ]),
        mkTopic(3, 2, "division", "Division", "भाग", "भागाकार", [
          fDiv(`${g}d1`, 1, 200, R(2, 9), R(2, 9)),
          fDiv(`${g}d2`, 2, 250, R(2, 9), R(10, 19)),
          fDiv(`${g}d3`, 3, 2200, R(10, 99), R(2, 9)),
          fDiv(`${g}d4`, 4, 2500, R(10, 99), R(10, 19)),
          fRem(`${g}d5`, 5, 1750, R(10, 99), R(3, 9), R(1, 8)),
          fRem(`${g}d6`, 6, 1000, R(100, 999), R(3, 9), R(1, 8)),
        ]),
        mkTopic(3, 3, "place", "Place value and rounding", "स्थानीय मान और पूर्णांकन", "स्थानिक किंमत व पूर्णांकन", [
          fRound(`${g}p1`, 1, 140, R(11, 99), 10),
          fRound(`${g}p2`, 2, 1400, R(101, 999), 10),
          fPlace(`${g}p3`, 3, 2500, 4),
          fRound(`${g}p4`, 4, 2500, R(1001, 9999), 100),
          fPlace(`${g}p5`, 5, 1750, 5),
          fRound(`${g}p6`, 6, 1000, R(10001, 99999), 1000),
        ]),
        mkTopic(3, 4, "money", "Money", "पैसे", "पैसे", [
          fSpend(`${g}m1`, 1, 800, R(11, 59), R(11, 59)),
          fSpend(`${g}m2`, 2, 1500, R(60, 199), R(25, 199)),
          fChange(`${g}m3`, 3, 120, 100, R(11, 88)),
          fChange(`${g}m4`, 4, 670, 500, R(38, 461)),
          fChange(`${g}m5`, 5, 1750, 2000, R(115, 1885)),
          fSpend(`${g}m6`, 6, 1000, R(200, 999), R(200, 999)),
        ]),
        mkTopic(3, 5, "units", "Time and measurement", "समय और मापन", "वेळ आणि मापन", [
          fTime(`${g}u1`, 1, 150, R(2, 49)),
          fTime(`${g}u2`, 2, 480, R(50, 199)),
          fMetric(`${g}u3`, 3, 630, R(2, 199)),
          fTime(`${g}u4`, 4, 2500, R(200, 999)),
          fMetric(`${g}u5`, 5, 1750, R(200, 999)),
          fTime(`${g}u6`, 6, 1000, R(1000, 9999)),
        ]),
        mkTopic(3, 6, "shapes", "Perimeter and area", "परिमाप और क्षेत्रफल", "परिमिती आणि क्षेत्रफळ", [
          fSquareGeo(`${g}s1`, 1, 75, R(2, 49), "perimeter"),
          fPerimRect(`${g}s2`, 2, 1200, R(11, 99), R(2, 10)),
          fSquareGeo(`${g}s3`, 3, 155, R(2, 99), "area"),
          fPerimRect(`${g}s4`, 4, 2500, R(100, 499), R(11, 99)),
          fAreaRect(`${g}s5`, 5, 1100, R(11, 99), R(2, 9)),
          fAreaRect(`${g}s6`, 6, 1000, R(12, 99), R(11, 99)),
        ]),
      ];
    case 4:
      return [
        mkTopic(4, 0, "bigmul", "Multiplying bigger numbers", "बड़ी संख्याओं का गुणा", "मोठ्या संख्यांचा गुणाकार", [
          fMul(`${g}b1`, 1, 800, R(11, 25), R(100, 199)),
          fMul(`${g}b2`, 2, 1500, R(26, 49), R(100, 299)),
          fMul(`${g}b3`, 3, 2500, R(50, 99), R(100, 499)),
          fMul(`${g}b4`, 4, 2500, R(100, 299), R(300, 999)),
          fMul(`${g}b5`, 5, 1750, R(300, 599), R(300, 999)),
          fMul(`${g}b6`, 6, 1000, R(600, 999), R(300, 999)),
        ]),
        mkTopic(4, 1, "longdiv", "Long division", "लंबा भाग", "दीर्घ भागाकार", [
          fDiv(`${g}l1`, 1, 800, R(100, 199), R(2, 9)),
          fDiv(`${g}l2`, 2, 1500, R(100, 299), R(11, 19)),
          fDiv(`${g}l3`, 3, 2500, R(100, 499), R(21, 49)),
          fRem(`${g}l4`, 4, 2500, R(100, 299), R(11, 19), R(1, 10)),
          fRem(`${g}l5`, 5, 1750, R(100, 499), R(21, 49), R(1, 20)),
          fDiv(`${g}l6`, 6, 1000, R(500, 999), R(51, 99)),
        ]),
        mkTopic(4, 2, "factors", "Factors and multiples", "गुणनखंड और गुणज", "अवयव आणि पट", [
          fLcm(`${g}f1`, 1, 190, R(2, 12), R(2, 12)),
          fLcm(`${g}f2`, 2, 540, R(2, 20), R(13, 30)),
          fHcf(`${g}f3`, 3, 1500, R(2, 15), R(2, 12), R(2, 12)),
          fLcm(`${g}f4`, 4, 1800, R(21, 60), R(2, 30)),
          fHcf(`${g}f5`, 5, 1200, R(16, 30), R(2, 12), R(2, 12)),
          fLcm(`${g}f6`, 6, 1000, R(31, 60), R(31, 60)),
        ]),
        mkTopic(4, 3, "fracintro", "Fractions", "भिन्न", "अपूर्णांक", [
          fFracOf(`${g}fr1`, 1, 800, R(2, 30)),
          fEquiv(`${g}fr2`, 2, 640, R(2, 6)),
          fFracOf(`${g}fr3`, 3, 2200, R(31, 90)),
          fEquiv(`${g}fr4`, 4, 770, R(7, 12)),
          fFracAdd(`${g}fr5`, 5, 400, 5, 18),
          fFracOf(`${g}fr6`, 6, 1000, R(91, 150)),
        ]),
        mkTopic(4, 4, "money4", "Money problems", "पैसों के सवाल", "पैशांची गणिते", [
          fSpend(`${g}mo1`, 1, 800, R(1000, 2999), R(1000, 2999)),
          fChange(`${g}mo2`, 2, 900, 1000, R(115, 985)),
          fUnitCost(`${g}mo3`, 3, 1700, R(2, 12), R(2, 99)),
          fSpend(`${g}mo4`, 4, 2500, R(3000, 9999), R(1000, 9999)),
          fChange(`${g}mo5`, 5, 1750, 5000, R(1115, 4885)),
          fUnitCost(`${g}mo6`, 6, 1000, R(13, 25), R(100, 299)),
        ]),
        mkTopic(4, 5, "units4", "Measurement conversions", "मापन रूपांतरण", "मापन रूपांतरण", [
          fMetric(`${g}u1`, 1, 600, R(1000, 1199)),
          fTime(`${g}u2`, 2, 1500, R(10000, 10499)),
          fMetric(`${g}u3`, 3, 2500, R(1200, 1999)),
          fTime(`${g}u4`, 4, 2500, R(10500, 11499)),
          fMetric(`${g}u5`, 5, 1750, R(2000, 2999)),
          fTime(`${g}u6`, 6, 1000, R(11500, 11999)),
        ]),
        mkTopic(4, 6, "geo4", "Rectangles: perimeter and area", "आयत: परिमाप और क्षेत्रफल", "आयत: परिमिती व क्षेत्रफळ", [
          fPerimRect(`${g}ge1`, 1, 800, R(500, 999), R(100, 499)),
          fAreaRect(`${g}ge2`, 2, 1500, R(100, 199), R(11, 99)),
          fPerimRect(`${g}ge3`, 3, 2500, R(1000, 4999), R(100, 999)),
          fAreaRect(`${g}ge4`, 4, 2500, R(200, 499), R(11, 99)),
          fSquareGeo(`${g}ge5`, 5, 155, R(100, 199), "perimeter"),
          fAreaRect(`${g}ge6`, 6, 1000, R(500, 999), R(11, 99)),
        ]),
      ];
    case 5:
      return [
        mkTopic(5, 0, "decimals", "Decimals", "दशमलव", "दशांश", [
          fDec(`${g}de1`, 1, 800, R(11, 99), R(11, 99), "+"),
          fDec(`${g}de2`, 2, 1500, R(101, 999), R(11, 99), "+"),
          fDec(`${g}de3`, 3, 2500, R(101, 999), R(11, 99), "-"),
          fDec(`${g}de4`, 4, 2500, R(11, 99), R(2, 19), "*"),
          fDec(`${g}de5`, 5, 1750, R(1001, 9999), R(101, 999), "-"),
          fDec(`${g}de6`, 6, 1000, R(101, 299), R(11, 19), "*"),
        ]),
        mkTopic(5, 1, "frac5", "Fraction arithmetic", "भिन्नों की गणना", "अपूर्णांकांची गणना", [
          fFracAdd(`${g}fa1`, 1, 300, 19, 32),
          fFracOf(`${g}fa2`, 2, 1500, R(151, 220)),
          fEquiv(`${g}fa3`, 3, 1000, R(13, 20)),
          fFracOf(`${g}fa4`, 4, 2200, R(221, 320)),
          fFracAdd(`${g}fa5`, 5, 380, 33, 45),
          fFracOf(`${g}fa6`, 6, 1000, R(321, 400)),
        ]),
        mkTopic(5, 2, "avg5", "Averages", "औसत", "सरासरी", [
          fAvg(`${g}av1`, 1, 500, R(20, 99)),
          fAvg(`${g}av2`, 2, 1500, R(100, 299)),
          fAvg(`${g}av3`, 3, 1500, R(300, 499)),
          fAvg(`${g}av4`, 4, 1500, R(500, 699)),
          fAvg(`${g}av5`, 5, 1500, R(700, 899)),
          fAvg(`${g}av6`, 6, 780, R(900, 999)),
        ]),
        mkTopic(5, 3, "unitary", "The unitary method", "ऐकिक नियम", "एकमान पद्धत", [
          fUnitCost(`${g}un1`, 1, 500, R(26, 32), R(2, 99)),
          fSpeed(`${g}un2`, 2, 550, R(5, 90), R(2, 9)),
          fUnitCost(`${g}un3`, 3, 1600, R(33, 44), R(2, 99)),
          fSpeed(`${g}un4`, 4, 1300, R(91, 299), R(2, 9)),
          fUnitCost(`${g}un5`, 5, 1700, R(45, 56), R(2, 99)),
          fSpeed(`${g}un6`, 6, 1000, R(300, 480), R(2, 9)),
        ]),
        mkTopic(5, 4, "volume", "Volume", "आयतन", "घनफळ", [
          fVolCube(`${g}vo1`, 1, 75, R(2, 49)),
          fVolCuboid(`${g}vo2`, 2, 1500, R(2, 20), R(2, 20), R(2, 20)),
          fVolCuboid(`${g}vo3`, 3, 2500, R(21, 40), R(2, 20), R(2, 20)),
          fVolCuboid(`${g}vo4`, 4, 2500, R(41, 99), R(2, 30), R(2, 20)),
          fVolCuboid(`${g}vo5`, 5, 1750, R(100, 199), R(2, 30), R(2, 20)),
          fVolCube(`${g}vo6`, 6, 100, R(50, 120)),
        ]),
        mkTopic(5, 5, "pct5", "Percentages", "प्रतिशत", "शेकडेवारी", [
          fPct(`${g}pc1`, 1, 500, R(2, 20)),
          fPct(`${g}pc2`, 2, 900, R(21, 50)),
          fPct(`${g}pc3`, 3, 1400, R(51, 99)),
          fPct(`${g}pc4`, 4, 1400, R(100, 149)),
          fPct(`${g}pc5`, 5, 1400, R(150, 199)),
          fPct(`${g}pc6`, 6, 1000, R(200, 249)),
        ]),
      ];
    case 6:
      return [
        mkTopic(6, 0, "integers", "Integers", "पूर्णांक", "पूर्णांक", [
          fInt(`${g}in1`, 1, 800, R(2, 20), R(2, 20)),
          fInt(`${g}in2`, 2, 1500, R(21, 60), R(2, 60)),
          fInt(`${g}in3`, 3, 2500, R(61, 199), R(2, 199)),
          fInt(`${g}in4`, 4, 2500, R(200, 499), R(2, 499)),
          fInt(`${g}in5`, 5, 1750, R(500, 999), R(2, 999)),
          fInt(`${g}in6`, 6, 1000, R(1000, 1999), R(2, 1999)),
        ]),
        mkTopic(6, 1, "ratio", "Ratio and proportion", "अनुपात और समानुपात", "गुणोत्तर आणि प्रमाण", [
          fRatio(`${g}ra1`, 1, 700, R(2, 24)),
          fRatio(`${g}ra2`, 2, 1400, R(25, 49)),
          fRatio(`${g}ra3`, 3, 2100, R(50, 99)),
          fUnitCost(`${g}ra4`, 4, 1700, R(57, 68), R(2, 99)),
          fRatio(`${g}ra5`, 5, 1700, R(100, 149)),
          fSpeed(`${g}ra6`, 6, 1000, R(481, 660), R(2, 9)),
        ]),
        mkTopic(6, 2, "angles", "Angles", "कोण", "कोन", [
          fAngle(`${g}an1`, 1, 110, R(10, 80), "complementary"),
          fAngle(`${g}an2`, 2, 255, R(10, 170), "supplementary"),
          fTriAngle(`${g}an3`, 3, 2500, R(20, 80), R(20, 80)),
          fTriAngle(`${g}an4`, 4, 400, R(81, 100), R(20, 60)),
          fTriAngle(`${g}an5`, 5, 900, R(20, 80), R(81, 99)),
          fTriAngle(`${g}an6`, 6, 600, R(101, 140), R(20, 39)),
        ]),
        mkTopic(6, 3, "algintro", "A first look at algebra", "बीजगणित की शुरुआत", "बीजगणिताची सुरुवात", [
          fEvalLin(`${g}al1`, 1, 800, R(2, 9), R(1, 20), R(2, 9)),
          fSolve(`${g}al2`, 2, 1500, R(2, 9), R(2, 20), R(1, 30)),
          fEvalLin(`${g}al3`, 3, 2500, R(2, 12), R(21, 60), R(10, 19)),
          fSolve(`${g}al4`, 4, 2500, R(2, 12), R(21, 50), R(31, 60)),
          fEvalLin(`${g}al5`, 5, 1750, R(13, 19), R(1, 60), R(2, 19)),
          fSolve(`${g}al6`, 6, 1000, R(13, 19), R(2, 50), R(1, 60)),
        ]),
        mkTopic(6, 4, "lcmhcf", "LCM and HCF", "लघुत्तम और महत्तम", "लसावि आणि मसावि", [
          fLcm(`${g}lh1`, 1, 500, R(61, 80), R(2, 30)),
          fHcf(`${g}lh2`, 2, 1200, R(31, 45), R(2, 12), R(2, 12)),
          fLcm(`${g}lh3`, 3, 2000, R(61, 99), R(31, 99)),
          fHcf(`${g}lh4`, 4, 1600, R(46, 60), R(2, 12), R(2, 12)),
          fLcm(`${g}lh5`, 5, 850, R(81, 99), R(2, 30)),
          fHcf(`${g}lh6`, 6, 1000, R(61, 75), R(2, 12), R(2, 12)),
        ]),
        mkTopic(6, 5, "mensuration6", "Perimeter and area", "परिमाप और क्षेत्रफल", "परिमिती व क्षेत्रफळ", [
          fSquareGeo(`${g}me1`, 1, 150, R(200, 299), "perimeter"),
          fAreaTri(`${g}me2`, 2, 1500, R(2, 30), R(2, 60)),
          fSquareGeo(`${g}me3`, 3, 155, R(200, 299), "area"),
          fAreaTri(`${g}me4`, 4, 2500, R(31, 80), R(2, 99)),
          fAreaRect(`${g}me5`, 5, 1750, R(1000, 1999), R(11, 99)),
          fAreaTri(`${g}me6`, 6, 1000, R(81, 120), R(2, 99)),
        ]),
      ];
    case 7:
      return [
        mkTopic(7, 0, "int7", "Integers, further", "पूर्णांक, आगे", "पूर्णांक, पुढे", [
          fInt(`${g}i1`, 1, 800, R(2000, 2999), R(2, 999)),
          fInt(`${g}i2`, 2, 1500, R(3000, 3999), R(2, 999)),
          fInt(`${g}i3`, 3, 2500, R(4000, 4999), R(2, 1999)),
          fInt(`${g}i4`, 4, 2500, R(5000, 5999), R(2, 1999)),
          fInt(`${g}i5`, 5, 1750, R(6000, 6999), R(2, 2999)),
          fInt(`${g}i6`, 6, 1000, R(7000, 7999), R(2, 2999)),
        ]),
        mkTopic(7, 1, "eq7", "Simple equations", "सरल समीकरण", "साधी समीकरणे", [
          fSolve(`${g}e1`, 1, 800, R(2, 9), R(51, 99), R(61, 99)),
          fSolve(`${g}e2`, 2, 1500, R(2, 12), R(100, 199), R(1, 99)),
          fSolve(`${g}e3`, 3, 2500, R(13, 25), R(51, 150), R(1, 99)),
          fSolve(`${g}e4`, 4, 2500, R(26, 40), R(2, 99), R(100, 199)),
          fSolve(`${g}e5`, 5, 1750, R(41, 60), R(2, 99), R(200, 299)),
          fSolve(`${g}e6`, 6, 1000, R(61, 80), R(2, 99), R(300, 399)),
        ]),
        mkTopic(7, 2, "profit", "Profit and loss", "लाभ और हानि", "नफा आणि तोटा", [
          fProfit(`${g}p1`, 1, 490, R(2, 20), R(5, 30)),
          fProfit(`${g}p2`, 2, 1000, R(21, 50), R(5, 40)),
          fProfit(`${g}p3`, 3, 2500, R(51, 99), R(5, 60)),
          fProfit(`${g}p4`, 4, 2000, R(100, 149), R(5, 60)),
          fProfit(`${g}p5`, 5, 1750, R(150, 199), R(5, 60)),
          fProfit(`${g}p6`, 6, 1000, R(200, 249), R(5, 60)),
        ]),
        mkTopic(7, 3, "si7", "Simple interest", "साधारण ब्याज", "सरळ व्याज", [
          fSI(`${g}s1`, 1, 680, R(2, 20), R(2, 10), R(2, 5)),
          fSI(`${g}s2`, 2, 1450, R(21, 50), R(2, 12), R(2, 6)),
          fSI(`${g}s3`, 3, 2500, R(51, 99), R(2, 15), R(2, 8)),
          fSI(`${g}s4`, 4, 2500, R(100, 199), R(2, 15), R(2, 9)),
          fSI(`${g}s5`, 5, 1750, R(200, 299), R(2, 15), R(2, 9)),
          fSI(`${g}s6`, 6, 1000, R(300, 399), R(2, 15), R(2, 9)),
        ]),
        mkTopic(7, 4, "exp7", "Exponents", "घातांक", "घातांक", [
          fSquare(`${g}x1`, 1, 150, R(2, 99)),
          fPow(`${g}x2`, 2, 130, R(2, 15), R(2, 5)),
          fSquare(`${g}x3`, 3, 780, R(100, 599)),
          fCube(`${g}x4`, 4, 90, R(2, 60)),
          fPow(`${g}x5`, 5, 100, R(16, 30), R(2, 4)),
          fSquare(`${g}x6`, 6, 620, R(600, 999)),
        ]),
        mkTopic(7, 5, "dec7", "Decimal operations", "दशमलव संक्रियाएँ", "दशांश क्रिया", [
          fDec(`${g}d1`, 1, 800, R(301, 999), R(101, 299), "-"),
          fDec(`${g}d2`, 2, 1500, R(10001, 19999), R(101, 999), "+"),
          fDec(`${g}d3`, 3, 2500, R(300, 999), R(21, 99), "*"),
          fDec(`${g}d4`, 4, 2500, R(20000, 29999), R(1001, 9999), "-"),
          fDec(`${g}d5`, 5, 1750, R(1000, 2999), R(101, 199), "*"),
          fDec(`${g}d6`, 6, 1000, R(30000, 39999), R(10001, 19999), "+"),
        ]),
      ];
    case 8:
      return [
        mkTopic(8, 0, "lineq", "Linear equations", "रैखिक समीकरण", "रेषीय समीकरणे", [
          fSolve(`${g}l1`, 1, 800, R(81, 99), R(2, 99), R(1, 99)),
          fSolve(`${g}l2`, 2, 1500, R(100, 125), R(2, 99), R(1, 99)),
          fSolve(`${g}l3`, 3, 2500, R(126, 160), R(2, 99), R(100, 199)),
          fSolve(`${g}l4`, 4, 2500, R(161, 199), R(2, 99), R(200, 299)),
          fSolve(`${g}l5`, 5, 1750, R(200, 249), R(2, 99), R(300, 399)),
          fSolve(`${g}l6`, 6, 1000, R(250, 299), R(2, 99), R(400, 499)),
        ]),
        mkTopic(8, 1, "roots", "Squares, cubes and roots", "वर्ग, घन और मूल", "वर्ग, घन आणि मुळे", [
          fSquare(`${g}r1`, 1, 700, R(1000, 1499)),
          fSqrt(`${g}r2`, 2, 470, R(2, 300)),
          fCube(`${g}r3`, 3, 140, R(61, 150)),
          fCbrt(`${g}r4`, 4, 90, R(2, 60)),
          fSqrt(`${g}r5`, 5, 470, R(301, 600)),
          fCbrt(`${g}r6`, 6, 100, R(61, 130)),
        ]),
        mkTopic(8, 2, "ci8", "Compound interest", "चक्रवृद्धि ब्याज", "चक्रवाढ व्याज", [
          fCI(`${g}c1`, 1, 130, R(2, 20), R(2, 10)),
          fCI(`${g}c2`, 2, 220, R(21, 40), R(2, 15)),
          fCI(`${g}c3`, 3, 300, R(41, 60), R(2, 20)),
          fCI(`${g}c4`, 4, 300, R(61, 80), R(2, 20)),
          fCI(`${g}c5`, 5, 280, R(81, 99), R(2, 20)),
          fCI(`${g}c6`, 6, 310, R(100, 120), R(2, 20)),
        ]),
        mkTopic(8, 3, "circle8", "Circles", "वृत्त", "वर्तुळे", [
          fCircle(`${g}ci1`, 1, 60, R(1, 40), "circumference"),
          fCircle(`${g}ci2`, 2, 60, R(1, 40), "area"),
          fCircle(`${g}ci3`, 3, 90, R(41, 99), "circumference"),
          fCircle(`${g}ci4`, 4, 90, R(41, 99), "area"),
          fCircle(`${g}ci5`, 5, 80, R(100, 150), "circumference"),
          fCircle(`${g}ci6`, 6, 80, R(100, 150), "area"),
        ]),
        mkTopic(8, 4, "solids", "Solids: volume", "ठोस: आयतन", "घनाकृती: घनफळ", [
          fVolCube(`${g}so1`, 1, 100, R(121, 199)),
          fCylVol(`${g}so2`, 2, 400, R(1, 20), R(2, 30)),
          fVolCuboid(`${g}so3`, 3, 2500, R(200, 299), R(2, 30), R(2, 20)),
          fCylVol(`${g}so4`, 4, 450, R(21, 40), R(2, 30)),
          fVolCuboid(`${g}so5`, 5, 1750, R(300, 399), R(2, 30), R(2, 20)),
          fCylVol(`${g}so6`, 6, 450, R(41, 60), R(2, 30)),
        ]),
        mkTopic(8, 5, "poly8", "Evaluating polynomials", "बहुपद का मान", "बहुपदींची किंमत", [
          fEvalLin(`${g}po1`, 1, 800, R(20, 29), R(1, 99), R(2, 20)),
          fPoly(`${g}po2`, 2, 1500, R(-9, 9), R(-15, 15), R(2, 8)),
          fEvalLin(`${g}po3`, 3, 2500, R(30, 45), R(1, 99), R(2, 30)),
          fPoly(`${g}po4`, 4, 2500, R(-12, 12), R(-20, 20), R(9, 15)),
          fEvalLin(`${g}po5`, 5, 1750, R(46, 60), R(1, 99), R(2, 40)),
          fPoly(`${g}po6`, 6, 1000, R(-15, 15), R(-25, 25), R(16, 22)),
        ]),
      ];
    case 9:
      return [
        mkTopic(9, 0, "poly9", "Polynomials", "बहुपद", "बहुपदी", [
          fPoly(`${g}p1`, 1, 800, R(-20, 20), R(-30, 30), R(23, 28)),
          fPoly(`${g}p2`, 2, 1500, R(-25, 25), R(-35, 35), R(29, 34)),
          fPoly(`${g}p3`, 3, 2500, R(-30, 30), R(-40, 40), R(35, 42)),
          fPoly(`${g}p4`, 4, 2500, R(-35, 35), R(-45, 45), R(43, 50)),
          fPoly(`${g}p5`, 5, 1750, R(-40, 40), R(-50, 50), R(51, 58)),
          fPoly(`${g}p6`, 6, 1000, R(-45, 45), R(-55, 55), R(59, 66)),
        ]),
        mkTopic(9, 1, "coord", "Coordinate geometry", "निर्देशांक ज्यामिति", "निर्देशक भूमिती", [
          fDist(`${g}co1`, 1, 800, R(0, 20), R(1, 8)),
          fSlope(`${g}co2`, 2, 1500, R(0, 12), R(1, 9), R(0, 15)),
          fDist(`${g}co3`, 3, 2500, R(21, 45), R(1, 8)),
          fSlope(`${g}co4`, 4, 2500, R(0, 12), R(1, 9), R(16, 35)),
          fDist(`${g}co5`, 5, 1750, R(46, 70), R(1, 8)),
          fSlope(`${g}co6`, 6, 1000, R(0, 12), R(1, 9), R(36, 55)),
        ]),
        mkTopic(9, 2, "tri9", "Triangles: area", "त्रिभुज: क्षेत्रफल", "त्रिकोण: क्षेत्रफळ", [
          fAreaTri(`${g}t1`, 1, 800, R(121, 160), R(2, 99)),
          fAreaTri(`${g}t2`, 2, 1500, R(161, 220), R(2, 99)),
          fAreaTri(`${g}t3`, 3, 2500, R(221, 320), R(2, 99)),
          fAreaTri(`${g}t4`, 4, 2500, R(321, 420), R(2, 99)),
          fAreaTri(`${g}t5`, 5, 1750, R(421, 520), R(2, 99)),
          fAreaTri(`${g}t6`, 6, 1000, R(521, 620), R(2, 99)),
        ]),
        mkTopic(9, 3, "stats9", "Statistics", "सांख्यिकी", "संख्याशास्त्र", [
          fAvg(`${g}st1`, 1, 800, R(1000, 1199)),
          fAvg(`${g}st2`, 2, 1500, R(1200, 1499)),
          fAvg(`${g}st3`, 3, 2500, R(1500, 1899)),
          fAvg(`${g}st4`, 4, 2500, R(1900, 2299)),
          fAvg(`${g}st5`, 5, 1750, R(2300, 2599)),
          fAvg(`${g}st6`, 6, 1000, R(2600, 2799)),
        ]),
        mkTopic(9, 4, "prob9", "Probability", "प्रायिकता", "संभाव्यता", [
          fProb(`${g}pr1`, 1, 300, R(1, 20), R(1, 20)),
          fProb(`${g}pr2`, 2, 700, R(21, 50), R(1, 30)),
          fProb(`${g}pr3`, 3, 900, R(1, 40), R(31, 60)),
          fProb(`${g}pr4`, 4, 900, R(41, 75), R(1, 35)),
          fProb(`${g}pr5`, 5, 800, R(51, 85), R(36, 70)),
          fProb(`${g}pr6`, 6, 500, R(86, 110), R(1, 40)),
        ]),
        mkTopic(9, 5, "solids9", "Surface areas and volumes", "पृष्ठ क्षेत्रफल और आयतन", "पृष्ठफळ आणि घनफळ", [
          fVolCuboid(`${g}so1`, 1, 800, R(400, 499), R(2, 30), R(2, 20)),
          fCylVol(`${g}so2`, 2, 450, R(61, 80), R(2, 30)),
          fVolCuboid(`${g}so3`, 3, 2500, R(500, 649), R(2, 40), R(2, 25)),
          fCylVol(`${g}so4`, 4, 430, R(81, 99), R(2, 30)),
          fVolCuboid(`${g}so5`, 5, 1750, R(650, 799), R(2, 40), R(2, 25)),
          fVolCube(`${g}so6`, 6, 120, R(200, 299)),
        ]),
      ];
    case 10:
      return [
        mkTopic(10, 0, "quad", "Quadratic equations", "द्विघात समीकरण", "वर्गसमीकरणे", [
          fQuad(`${g}q1`, 1, 700, R(1, 30), R(1, 30)),
          fQuad(`${g}q2`, 2, 700, R(31, 60), R(1, 30)),
          fQuad(`${g}q3`, 3, 700, R(61, 90), R(1, 30)),
          fQuad(`${g}q4`, 4, 700, R(91, 120), R(1, 30)),
          fQuad(`${g}q5`, 5, 700, R(121, 150), R(1, 30)),
          fQuad(`${g}q6`, 6, 700, R(151, 180), R(1, 30)),
        ]),
        mkTopic(10, 1, "ap", "Arithmetic progressions", "समांतर श्रेढ़ी", "अंकगणिती श्रेढी", [
          fApN(`${g}a1`, 1, 800, R(2, 60), R(2, 30), R(5, 60)),
          fApSum(`${g}a2`, 2, 1500, R(2, 60), R(2, 30), R(5, 60)),
          fApN(`${g}a3`, 3, 2500, R(61, 150), R(2, 40), R(5, 80)),
          fApSum(`${g}a4`, 4, 2500, R(61, 150), R(2, 40), R(5, 80)),
          fApN(`${g}a5`, 5, 1750, R(151, 250), R(2, 50), R(5, 99)),
          fApSum(`${g}a6`, 6, 1000, R(151, 250), R(2, 50), R(5, 99)),
        ]),
        mkTopic(10, 2, "trig", "Trigonometric ratios", "त्रिकोणमितीय अनुपात", "त्रिकोणमितीय गुणोत्तरे", [
          fTrig(`${g}t1`, 1, 180, R(1, 10)),
          fTrig(`${g}t2`, 2, 300, R(11, 27)),
          fTrig(`${g}t3`, 3, 350, R(28, 46)),
          fTrig(`${g}t4`, 4, 350, R(47, 65)),
          fTrig(`${g}t5`, 5, 300, R(66, 82)),
          fTrig(`${g}t6`, 6, 250, R(83, 99)),
        ]),
        mkTopic(10, 3, "prob10", "Probability", "प्रायिकता", "संभाव्यता", [
          fProb(`${g}pr1`, 1, 500, R(111, 140), R(1, 40)),
          fProb(`${g}pr2`, 2, 900, R(141, 175), R(1, 45)),
          fProb(`${g}pr3`, 3, 1200, R(176, 215), R(1, 50)),
          fProb(`${g}pr4`, 4, 1200, R(216, 255), R(1, 50)),
          fProb(`${g}pr5`, 5, 1000, R(256, 290), R(1, 45)),
          fProb(`${g}pr6`, 6, 700, R(291, 320), R(1, 40)),
        ]),
        mkTopic(10, 4, "coord10", "Coordinate geometry", "निर्देशांक ज्यामिति", "निर्देशक भूमिती", [
          fDist(`${g}co1`, 1, 800, R(71, 95), R(1, 8)),
          fSlope(`${g}co2`, 2, 1500, R(0, 12), R(1, 9), R(56, 75)),
          fDist(`${g}co3`, 3, 2500, R(96, 125), R(1, 8)),
          fSlope(`${g}co4`, 4, 2500, R(0, 12), R(1, 9), R(76, 99)),
          fDist(`${g}co5`, 5, 1750, R(126, 155), R(1, 8)),
          fSlope(`${g}co6`, 6, 1000, R(0, 12), R(1, 9), R(100, 125)),
        ]),
        mkTopic(10, 5, "interest10", "Interest, revisited", "ब्याज, दोबारा", "व्याज, पुन्हा", [
          fSI(`${g}si1`, 1, 800, R(400, 499), R(2, 15), R(2, 9)),
          fCI(`${g}si2`, 2, 450, R(121, 150), R(2, 20)),
          fSI(`${g}si3`, 3, 2500, R(500, 699), R(2, 15), R(2, 9)),
          fCI(`${g}si4`, 4, 600, R(151, 190), R(2, 20)),
          fSI(`${g}si5`, 5, 1750, R(700, 899), R(2, 15), R(2, 9)),
          fCI(`${g}si6`, 6, 440, R(191, 220), R(2, 20)),
        ]),
      ];
    case 11:
      return [
        mkTopic(11, 0, "counting", "Permutations and combinations", "क्रमचय और संचय", "क्रमांतरण आणि संयोग", [
          fNpr(`${g}c1`, 1, 95, R(5, 30), R(2, 3)),
          fNcr(`${g}c2`, 2, 130, R(5, 30), R(2, 4)),
          fNpr(`${g}c3`, 3, 100, R(31, 60), R(2, 3)),
          fNcr(`${g}c4`, 4, 130, R(31, 60), R(2, 4)),
          fNpr(`${g}c5`, 5, 90, R(61, 90), R(2, 3)),
          fNcr(`${g}c6`, 6, 120, R(61, 90), R(2, 4)),
        ]),
        mkTopic(11, 1, "seq11", "Sequences and series", "अनुक्रम और श्रेणी", "श्रेढी आणि श्रेणी", [
          fApN(`${g}s1`, 1, 800, R(251, 350), R(2, 60), R(5, 99)),
          fGpN(`${g}s2`, 2, 100, R(1, 6), R(2, 4), R(3, 9)),
          fApSum(`${g}s3`, 3, 2500, R(251, 350), R(2, 60), R(5, 99)),
          fGpN(`${g}s4`, 4, 100, R(7, 12), R(2, 4), R(3, 9)),
          fApN(`${g}s5`, 5, 1750, R(351, 450), R(2, 70), R(5, 99)),
          fApSum(`${g}s6`, 6, 1000, R(351, 450), R(2, 70), R(5, 99)),
        ]),
        mkTopic(11, 2, "lines", "Straight lines", "सरल रेखाएँ", "सरळ रेषा", [
          fSlope(`${g}l1`, 1, 800, R(0, 12), R(1, 9), R(126, 145)),
          fDist(`${g}l2`, 2, 1500, R(156, 185), R(1, 8)),
          fSlope(`${g}l3`, 3, 2500, R(0, 12), R(1, 9), R(146, 175)),
          fDist(`${g}l4`, 4, 2500, R(186, 215), R(1, 8)),
          fSlope(`${g}l5`, 5, 1750, R(0, 12), R(1, 9), R(176, 205)),
          fDist(`${g}l6`, 6, 1000, R(216, 245), R(1, 8)),
        ]),
        mkTopic(11, 3, "trig11", "Trigonometry, further", "त्रिकोणमिति, आगे", "त्रिकोणमिती, पुढे", [
          fTrig(`${g}t1`, 1, 180, R(100, 110)),
          fTrig(`${g}t2`, 2, 300, R(111, 127)),
          fTrig(`${g}t3`, 3, 350, R(128, 146)),
          fTrig(`${g}t4`, 4, 350, R(147, 165)),
          fTrig(`${g}t5`, 5, 300, R(166, 182)),
          fTrig(`${g}t6`, 6, 250, R(183, 199)),
        ]),
        mkTopic(11, 4, "stats11", "Statistics", "सांख्यिकी", "संख्याशास्त्र", [
          fAvg(`${g}st1`, 1, 800, R(2800, 2999)),
          fAvg(`${g}st2`, 2, 1500, R(3000, 3299)),
          fAvg(`${g}st3`, 3, 2500, R(3300, 3699)),
          fAvg(`${g}st4`, 4, 2500, R(3700, 4099)),
          fAvg(`${g}st5`, 5, 1750, R(4100, 4399)),
          fAvg(`${g}st6`, 6, 1000, R(4400, 4599)),
        ]),
        mkTopic(11, 5, "quad11", "Quadratics, further", "द्विघात, आगे", "वर्गसमीकरणे, पुढे", [
          fQuad(`${g}q1`, 1, 700, R(181, 210), R(1, 30)),
          fQuad(`${g}q2`, 2, 700, R(211, 240), R(1, 30)),
          fQuad(`${g}q3`, 3, 700, R(241, 270), R(1, 30)),
          fQuad(`${g}q4`, 4, 700, R(271, 300), R(1, 30)),
          fQuad(`${g}q5`, 5, 700, R(301, 330), R(1, 30)),
          fQuad(`${g}q6`, 6, 700, R(331, 360), R(1, 30)),
        ]),
      ];
    case 12:
      return [
        mkTopic(12, 0, "matrices", "Matrices and determinants", "आव्यूह और सारणिक", "सारण्या आणि निर्धारक", [
          fDet(`${g}m1`, 1, 800, R(0, 10)),
          fDet(`${g}m2`, 2, 1500, R(0, 14)),
          fDet(`${g}m3`, 3, 2500, R(0, 18)),
          fDet(`${g}m4`, 4, 2500, R(0, 22)),
          fDet(`${g}m5`, 5, 1750, R(0, 26)),
          fDet(`${g}m6`, 6, 1000, R(0, 30)),
        ]),
        mkTopic(12, 1, "vectors", "Vectors", "सदिश", "सदिश", [
          fDot(`${g}v1`, 1, 800, R(0, 8)),
          fDot(`${g}v2`, 2, 1500, R(0, 10)),
          fDot(`${g}v3`, 3, 2500, R(0, 12)),
          fDot(`${g}v4`, 4, 2500, R(0, 14)),
          fDot(`${g}v5`, 5, 1750, R(0, 16)),
          fDot(`${g}v6`, 6, 1000, R(0, 18)),
        ]),
        mkTopic(12, 2, "deriv", "Derivatives", "अवकलज", "अवकलज", [
          fDeriv(`${g}d1`, 1, 800, R(1, 9), R(-9, 9), R(1, 6)),
          fDeriv(`${g}d2`, 2, 1500, R(1, 12), R(-12, 12), R(7, 12)),
          fDeriv(`${g}d3`, 3, 2500, R(1, 15), R(-15, 15), R(13, 20)),
          fDeriv(`${g}d4`, 4, 2500, R(1, 18), R(-18, 18), R(21, 28)),
          fDeriv(`${g}d5`, 5, 1750, R(1, 21), R(-21, 21), R(29, 36)),
          fDeriv(`${g}d6`, 6, 1000, R(1, 24), R(-24, 24), R(37, 44)),
        ]),
        mkTopic(12, 3, "integ", "Definite integrals", "निश्चित समाकल", "निश्चित संकलन", [
          fInteg(`${g}i1`, 1, 800, R(1, 20), R(0, 10), R(1, 10)),
          fInteg(`${g}i2`, 2, 1500, R(1, 30), R(0, 12), R(11, 20)),
          fInteg(`${g}i3`, 3, 2500, R(1, 40), R(0, 14), R(21, 32)),
          fInteg(`${g}i4`, 4, 2500, R(1, 50), R(0, 16), R(33, 44)),
          fInteg(`${g}i5`, 5, 1750, R(1, 60), R(0, 18), R(45, 56)),
          fInteg(`${g}i6`, 6, 1000, R(1, 70), R(0, 20), R(57, 68)),
        ]),
        mkTopic(12, 4, "prob12", "Probability", "प्रायिकता", "संभाव्यता", [
          fProb(`${g}p1`, 1, 500, R(321, 350), R(1, 40)),
          fProb(`${g}p2`, 2, 900, R(351, 385), R(1, 45)),
          fProb(`${g}p3`, 3, 1200, R(386, 425), R(1, 50)),
          fProb(`${g}p4`, 4, 1200, R(426, 465), R(1, 50)),
          fProb(`${g}p5`, 5, 1000, R(466, 500), R(1, 45)),
          fProb(`${g}p6`, 6, 700, R(501, 530), R(1, 40)),
        ]),
        mkTopic(12, 5, "series12", "Series and sums", "श्रेणियाँ और योग", "श्रेणी आणि बेरजा", [
          fApSum(`${g}s1`, 1, 800, R(451, 550), R(2, 80), R(5, 99)),
          fGpN(`${g}s2`, 2, 100, R(13, 18), R(2, 4), R(3, 9)),
          fApSum(`${g}s3`, 3, 2500, R(551, 650), R(2, 80), R(5, 99)),
          fApN(`${g}s4`, 4, 2500, R(451, 550), R(2, 80), R(5, 99)),
          fApSum(`${g}s5`, 5, 1750, R(651, 750), R(2, 80), R(5, 99)),
          fApN(`${g}s6`, 6, 1000, R(551, 650), R(2, 80), R(5, 99)),
        ]),
      ];
    default:
      throw new Error(`no plan for grade ${grade}`);
  }
}

function gradeTopics(grade: number): TopicSpec[] {
  const topics = curriculum(grade);
  const planned = topics.flatMap((t) => t.templates).reduce((a, t) => a + t.want, 0);
  const deficit = GRADE_TARGET - planned;
  if (deficit <= 0) throw new Error(`grade ${grade}: curriculum already at ${planned}, filler cannot be empty`);
  topics.push(filler(grade, topics.length, deficit));
  return topics;
}

main().catch(async (error) => {
  console.error(error);
  await db.$disconnect();
  process.exit(1);
});
