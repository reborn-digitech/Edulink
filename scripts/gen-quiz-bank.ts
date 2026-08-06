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
): { choices: string[]; answerIndex: number; order: number[] } {
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
  return { choices: shuffled, answerIndex: shuffled.indexOf(correct), order };
}

/* -------------------------------------------------------------------------- */
/* Shapes                                                                      */
/* -------------------------------------------------------------------------- */

type Subject = "MATHS" | "SCIENCE" | "HISTORY" | "GEOGRAPHY" | "CIVICS" | "ECONOMICS";

type GenQ = {
  level: number;
  stem: string;
  choices: string[];
  answerIndex: number;
  solution: string;
  /**
   * Null ONLY for fact-recall questions (capitals, symbols, event years) —
   * answers a machine cannot derive. Those come exclusively from the curated
   * fact tables below, are a small fraction of the bank, and are counted out
   * loud as unproven. Everything numerical carries an expression.
   */
  checkExpr: string | null;
  hi: { stem: string; solution: string; choices?: string[] };
  mr: { stem: string; solution: string; choices?: string[] };
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
  subject: Subject;
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
  if (q.checkExpr === null) {
    // A recall question: no expression to prove. Structure was still checked,
    // and the translated choice arrays must stay aligned with the original —
    // a different length would leave answerIndex pointing at the wrong option.
    for (const lang of ["hi", "mr"] as const) {
      const tr = q[lang].choices;
      if (tr && tr.length !== q.choices.length) die(`${lang} choices misaligned`);
      if (tr && tr.some((c) => !c.trim())) die(`${lang} has a blank choice`);
    }
    if (!q.hi.stem.trim() || !q.mr.stem.trim()) die("missing translation stem");
    return;
  }
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
let checkedCount = 0;
let recallCount = 0;

function generateTopic(topic: TopicSpec): GenQ[] {
  const out: GenQ[] = [];
  const levels = new Set<number>();
  for (const tmpl of topic.templates) {
    if (tmpl.want <= 0) {
      throw new Error(`${topic.slug}/${tmpl.key}: want ${tmpl.want} — a filler's deficit ran below its fixed wants`);
    }
    let kept = 0;
    // Oversample: dedup skips cost variants, so ask the walk for extra room.
    for (const idx of walk(tmpl.space, tmpl.space, tmpl.key)) {
      if (kept === tmpl.want) break;
      const q = tmpl.make(idx);
      validate(q, `${topic.slug}/${tmpl.key}[${idx}]`);
      const fp = sha(q.stem.trim().toLowerCase()).slice(0, 12);
      if (seenStems.has(fp)) continue;
      seenStems.add(fp);
      if (q.checkExpr === null) recallCount++;
      else checkedCount++;
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
      subject: topic.subject,
      classLevel: topic.classLevel,
      chapter: topic.chapter,
      name: topic.name,
      slug: topic.slug,
      summary: topic.summary,
      position: topic.position,
    },
    update: {
      subject: topic.subject,
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
      // Numbers do not translate, so numeric questions reuse the original
      // choices; NAME choices (capitals, elements) carry per-language arrays,
      // validated same-length so answerIndex can never point at the wrong one.
      choices: JSON.stringify(q[language].choices ?? q.choices),
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
  // none today, but the guard costs nothing) can never be collateral. Rows
  // whose stem survived a plan change keep their content-hash id, which means
  // createMany skipDuplicates leaves them untouched — so a question that moved
  // rungs (same stem, new level) must have its stored difficulty repaired here
  // or the ladder in the DB would silently disagree with the plan.
  const keep = new Map(rows.map((r) => [r.id, r.difficulty]));
  const existing = await db.quizQuestion.findMany({
    where: { topicId: row.id, source: GEN_SOURCE },
    select: { id: true, difficulty: true },
  });
  const stale: string[] = [];
  const drifted = new Map<number, string[]>();
  for (const e of existing) {
    const want = keep.get(e.id);
    if (want === undefined) stale.push(e.id);
    else if (want !== e.difficulty) {
      const bucket = drifted.get(want) ?? [];
      bucket.push(e.id);
      drifted.set(want, bucket);
    }
  }
  for (const [level, ids] of drifted) {
    for (let i = 0; i < ids.length; i += BATCH) {
      await db.quizQuestion.updateMany({
        where: { id: { in: ids.slice(i, i + BATCH) } },
        data: { difficulty: level },
      });
    }
  }
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

  // On a FULL run, generated topics the new plan no longer names are deleted
  // before anything is written — "redo the bank" must not leave the old one
  // interleaved with the new. Matched by the drill- prefix, so hand-written
  // topics cannot be touched; partial runs (--grade) skip this on purpose.
  if (!dry && !only) {
    const planned = grades.flatMap((g) => gradeTopics(g).map((t) => t.slug));
    const obsolete = await db.quizTopic.findMany({
      where: { slug: { startsWith: "drill-", notIn: planned } },
      select: { id: true, slug: true },
    });
    if (obsolete.length) {
      await db.quizTopic.deleteMany({ where: { id: { in: obsolete.map((o) => o.id) } } });
      console.log(`Deleted ${obsolete.length} obsolete generated topics.\n`);
    }
  }

  for (const grade of grades) {
    const topics = gradeTopics(grade);
    let gradeTotal = 0;
    const bySubject: Record<string, number> = {};
    for (const topic of topics) {
      if (allSlugs.has(topic.slug)) throw new Error(`duplicate slug ${topic.slug}`);
      allSlugs.add(topic.slug);
      const questions = generateTopic(topic);
      for (const q of questions) levelTotals[q.level - 1]!++;
      gradeTotal += questions.length;
      bySubject[topic.subject] = (bySubject[topic.subject] ?? 0) + questions.length;
      if (!dry) await importTopic(topic, questions);
      console.log(
        `  ${topic.slug.padEnd(34)} ${String(questions.length).padStart(6)} questions${dry ? " (dry)" : ""}`,
      );
    }
    perGrade[grade] = gradeTotal;
    grand += gradeTotal;
    console.log(
      `Grade ${grade}: ${gradeTotal} — ${Object.entries(bySubject)
        .sort()
        .map(([s, n]) => `${s} ${n}`)
        .join(", ")}\n`,
    );
    if (gradeTotal < 100_000) {
      throw new Error(`grade ${grade} produced ${gradeTotal} — the ask is ~100,000 per grade`);
    }
  }

  console.log("— generated drill bank —");
  console.log(`  questions            ${grand}`);
  console.log(`  by level             ${levelTotals.map((n, i) => `L${i + 1}:${n}`).join("  ")}`);
  console.log(`  arithmetic-checked   ${checkedCount}  (checkExpr evaluated against the marked answer)`);
  console.log(
    `  fact-recall          ${recallCount}  ← from the curated fact tables, unproven by machine`,
  );
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
  /** Null only for fact-recall — see GenQ.checkExpr. */
  expr: string | null;
  decoys: number[];
  render?: (n: number) => string;
  /** Fraction- and name-style questions provide the exact option strings. */
  answerText?: string;
  decoyTexts?: string[];
  /** For NAME choices: per-language arrays aligned to [answer, ...decoys]. */
  textHi?: string[];
  textMr?: string[];
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
      // Name choices translate; the SAME shuffle order is applied to every
      // language so answerIndex stays true in all three. The order indexes
      // [answer, ...decoys], so a duplicate decoy — which optionsText would
      // silently filter, shifting everything — is a template bug, refused.
      if (m.textHi || m.textMr) {
        const four = [m.answerText!, ...(m.decoyTexts ?? []).slice(0, 3)];
        if (new Set(four).size !== 4) throw new Error(`${key}: recall decoys collide: ${four.join(" | ")}`);
        for (const all of [m.textHi, m.textMr]) {
          if (all && all.length !== (m.decoyTexts ?? []).length + 1) {
            throw new Error(`${key}: translated choice array misaligned`);
          }
        }
      }
      const order = "order" in picked ? (picked as { order: number[] }).order : null;
      const trChoices = (all?: string[]) =>
        all && order ? order.map((i) => all[i]!) : undefined;
      return {
        level,
        stem: fill(skins.en[skin]!, vars),
        choices: picked.choices,
        answerIndex: picked.answerIndex,
        solution: fill(skins.sen, vars),
        checkExpr: m.expr,
        hi: { stem: fill(skins.hi[skin]!, vars), solution: fill(skins.shi, vars), choices: trChoices(m.textHi) },
        mr: { stem: fill(skins.mr[skin]!, vars), solution: fill(skins.smr, vars), choices: trChoices(m.textMr) },
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

/* ==========================================================================
   FACT TABLES — the only source recall questions may draw from.

   Each row is one human-checkable fact. Reviewing the TABLE reviews every
   question generated from it, which is what makes recall generation honest
   at all: the per-question risk collapses onto a few hundred rows a person
   can actually read. Devanagari names are the author's, under the same
   native-reader caveat as the rest of the app.
   ========================================================================== */

type Fact = { en: string; hi: string; mr: string; ansEn: string; ansHi: string; ansMr: string };

/** Indian states and their capitals. Haryana is deliberately absent: it
 * shares Chandigarh with Punjab, which would make the reverse question
 * ("Chandigarh is the capital of…?") have two right answers. */
const STATES: Fact[] = [
  { en: "Maharashtra", hi: "महाराष्ट्र", mr: "महाराष्ट्र", ansEn: "Mumbai", ansHi: "मुंबई", ansMr: "मुंबई" },
  { en: "Karnataka", hi: "कर्नाटक", mr: "कर्नाटक", ansEn: "Bengaluru", ansHi: "बेंगलुरु", ansMr: "बेंगळुरू" },
  { en: "Tamil Nadu", hi: "तमिलनाडु", mr: "तामिळनाडू", ansEn: "Chennai", ansHi: "चेन्नई", ansMr: "चेन्नई" },
  { en: "Kerala", hi: "केरल", mr: "केरळ", ansEn: "Thiruvananthapuram", ansHi: "तिरुवनंतपुरम", ansMr: "तिरुवनंतपुरम" },
  { en: "Gujarat", hi: "गुजरात", mr: "गुजरात", ansEn: "Gandhinagar", ansHi: "गांधीनगर", ansMr: "गांधीनगर" },
  { en: "Rajasthan", hi: "राजस्थान", mr: "राजस्थान", ansEn: "Jaipur", ansHi: "जयपुर", ansMr: "जयपूर" },
  { en: "Punjab", hi: "पंजाब", mr: "पंजाब", ansEn: "Chandigarh", ansHi: "चंडीगढ़", ansMr: "चंदीगड" },
  { en: "Uttar Pradesh", hi: "उत्तर प्रदेश", mr: "उत्तर प्रदेश", ansEn: "Lucknow", ansHi: "लखनऊ", ansMr: "लखनौ" },
  { en: "Madhya Pradesh", hi: "मध्य प्रदेश", mr: "मध्य प्रदेश", ansEn: "Bhopal", ansHi: "भोपाल", ansMr: "भोपाळ" },
  { en: "West Bengal", hi: "पश्चिम बंगाल", mr: "पश्चिम बंगाल", ansEn: "Kolkata", ansHi: "कोलकाता", ansMr: "कोलकाता" },
  { en: "Bihar", hi: "बिहार", mr: "बिहार", ansEn: "Patna", ansHi: "पटना", ansMr: "पाटणा" },
  { en: "Odisha", hi: "ओडिशा", mr: "ओडिशा", ansEn: "Bhubaneswar", ansHi: "भुवनेश्वर", ansMr: "भुवनेश्वर" },
  { en: "Assam", hi: "असम", mr: "आसाम", ansEn: "Dispur", ansHi: "दिसपुर", ansMr: "दिसपूर" },
  { en: "Telangana", hi: "तेलंगाना", mr: "तेलंगणा", ansEn: "Hyderabad", ansHi: "हैदराबाद", ansMr: "हैदराबाद" },
  { en: "Andhra Pradesh", hi: "आंध्र प्रदेश", mr: "आंध्र प्रदेश", ansEn: "Amaravati", ansHi: "अमरावती", ansMr: "अमरावती" },
  { en: "Jharkhand", hi: "झारखंड", mr: "झारखंड", ansEn: "Ranchi", ansHi: "रांची", ansMr: "रांची" },
  { en: "Chhattisgarh", hi: "छत्तीसगढ़", mr: "छत्तीसगड", ansEn: "Raipur", ansHi: "रायपुर", ansMr: "रायपूर" },
  { en: "Uttarakhand", hi: "उत्तराखंड", mr: "उत्तराखंड", ansEn: "Dehradun", ansHi: "देहरादून", ansMr: "डेहराडून" },
  { en: "Himachal Pradesh", hi: "हिमाचल प्रदेश", mr: "हिमाचल प्रदेश", ansEn: "Shimla", ansHi: "शिमला", ansMr: "शिमला" },
  { en: "Goa", hi: "गोवा", mr: "गोवा", ansEn: "Panaji", ansHi: "पणजी", ansMr: "पणजी" },
  { en: "Sikkim", hi: "सिक्किम", mr: "सिक्कीम", ansEn: "Gangtok", ansHi: "गंगटोक", ansMr: "गंगटोक" },
  { en: "Manipur", hi: "मणिपुर", mr: "मणिपूर", ansEn: "Imphal", ansHi: "इंफाल", ansMr: "इंफाळ" },
  { en: "Meghalaya", hi: "मेघालय", mr: "मेघालय", ansEn: "Shillong", ansHi: "शिलांग", ansMr: "शिलाँग" },
  { en: "Tripura", hi: "त्रिपुरा", mr: "त्रिपुरा", ansEn: "Agartala", ansHi: "अगरतला", ansMr: "आगरताळा" },
  { en: "Nagaland", hi: "नागालैंड", mr: "नागालँड", ansEn: "Kohima", ansHi: "कोहिमा", ansMr: "कोहिमा" },
  { en: "Mizoram", hi: "मिजोरम", mr: "मिझोराम", ansEn: "Aizawl", ansHi: "आइजोल", ansMr: "ऐझॉल" },
  { en: "Arunachal Pradesh", hi: "अरुणाचल प्रदेश", mr: "अरुणाचल प्रदेश", ansEn: "Itanagar", ansHi: "ईटानगर", ansMr: "इटानगर" },
];

const COUNTRIES: Fact[] = [
  { en: "India", hi: "भारत", mr: "भारत", ansEn: "New Delhi", ansHi: "नई दिल्ली", ansMr: "नवी दिल्ली" },
  { en: "Nepal", hi: "नेपाल", mr: "नेपाळ", ansEn: "Kathmandu", ansHi: "काठमांडू", ansMr: "काठमांडू" },
  { en: "China", hi: "चीन", mr: "चीन", ansEn: "Beijing", ansHi: "बीजिंग", ansMr: "बीजिंग" },
  { en: "Japan", hi: "जापान", mr: "जपान", ansEn: "Tokyo", ansHi: "टोक्यो", ansMr: "टोकियो" },
  { en: "France", hi: "फ्रांस", mr: "फ्रान्स", ansEn: "Paris", ansHi: "पेरिस", ansMr: "पॅरिस" },
  { en: "Germany", hi: "जर्मनी", mr: "जर्मनी", ansEn: "Berlin", ansHi: "बर्लिन", ansMr: "बर्लिन" },
  { en: "Italy", hi: "इटली", mr: "इटली", ansEn: "Rome", ansHi: "रोम", ansMr: "रोम" },
  { en: "Spain", hi: "स्पेन", mr: "स्पेन", ansEn: "Madrid", ansHi: "मैड्रिड", ansMr: "माद्रिद" },
  { en: "the United Kingdom", hi: "यूनाइटेड किंगडम", mr: "युनायटेड किंग्डम", ansEn: "London", ansHi: "लंदन", ansMr: "लंडन" },
  { en: "the United States", hi: "संयुक्त राज्य अमेरिका", mr: "अमेरिका", ansEn: "Washington DC", ansHi: "वॉशिंगटन डीसी", ansMr: "वॉशिंग्टन डीसी" },
  { en: "Russia", hi: "रूस", mr: "रशिया", ansEn: "Moscow", ansHi: "मॉस्को", ansMr: "मॉस्को" },
  { en: "Brazil", hi: "ब्राज़ील", mr: "ब्राझील", ansEn: "Brasilia", ansHi: "ब्रासीलिया", ansMr: "ब्राझिलिया" },
  { en: "Australia", hi: "ऑस्ट्रेलिया", mr: "ऑस्ट्रेलिया", ansEn: "Canberra", ansHi: "कैनबरा", ansMr: "कॅनबेरा" },
  { en: "Canada", hi: "कनाडा", mr: "कॅनडा", ansEn: "Ottawa", ansHi: "ओटावा", ansMr: "ओटावा" },
  { en: "Egypt", hi: "मिस्र", mr: "इजिप्त", ansEn: "Cairo", ansHi: "काहिरा", ansMr: "कैरो" },
  { en: "Kenya", hi: "केन्या", mr: "केनिया", ansEn: "Nairobi", ansHi: "नैरोबी", ansMr: "नैरोबी" },
  { en: "Iran", hi: "ईरान", mr: "इराण", ansEn: "Tehran", ansHi: "तेहरान", ansMr: "तेहरान" },
  { en: "Bangladesh", hi: "बांग्लादेश", mr: "बांगलादेश", ansEn: "Dhaka", ansHi: "ढाका", ansMr: "ढाका" },
  { en: "Pakistan", hi: "पाकिस्तान", mr: "पाकिस्तान", ansEn: "Islamabad", ansHi: "इस्लामाबाद", ansMr: "इस्लामाबाद" },
  { en: "Indonesia", hi: "इंडोनेशिया", mr: "इंडोनेशिया", ansEn: "Jakarta", ansHi: "जकार्ता", ansMr: "जकार्ता" },
  { en: "Thailand", hi: "थाईलैंड", mr: "थायलंड", ansEn: "Bangkok", ansHi: "बैंकॉक", ansMr: "बँकॉक" },
  { en: "Greece", hi: "यूनान", mr: "ग्रीस", ansEn: "Athens", ansHi: "एथेंस", ansMr: "अथेन्स" },
  { en: "Turkey", hi: "तुर्की", mr: "तुर्की", ansEn: "Ankara", ansHi: "अंकारा", ansMr: "अंकारा" },
  { en: "Argentina", hi: "अर्जेंटीना", mr: "अर्जेंटिना", ansEn: "Buenos Aires", ansHi: "ब्यूनस आयर्स", ansMr: "ब्युनोस आयर्स" },
];

/** Chemical elements and symbols. Transliterated names serve hi and mr both,
 * matching how Indian chemistry classrooms actually say them. */
const ELEMENTS: Fact[] = (
  [
    ["Hydrogen", "हाइड्रोजन", "H"], ["Helium", "हीलियम", "He"], ["Lithium", "लीथियम", "Li"],
    ["Carbon", "कार्बन", "C"], ["Nitrogen", "नाइट्रोजन", "N"], ["Oxygen", "ऑक्सीजन", "O"],
    ["Sodium", "सोडियम", "Na"], ["Magnesium", "मैग्नीशियम", "Mg"], ["Aluminium", "ऐलुमिनियम", "Al"],
    ["Silicon", "सिलिकॉन", "Si"], ["Phosphorus", "फ़ॉस्फोरस", "P"], ["Sulphur", "सल्फर", "S"],
    ["Chlorine", "क्लोरीन", "Cl"], ["Potassium", "पोटैशियम", "K"], ["Calcium", "कैल्शियम", "Ca"],
    ["Iron", "आयरन", "Fe"], ["Copper", "कॉपर", "Cu"], ["Zinc", "ज़िंक", "Zn"],
    ["Silver", "सिल्वर", "Ag"], ["Gold", "गोल्ड", "Au"], ["Mercury", "मरकरी", "Hg"],
    ["Lead", "लेड", "Pb"], ["Tin", "टिन", "Sn"], ["Nickel", "निकल", "Ni"],
  ] as [string, string, string][]
).map(([en, dev, sym]) => ({ en, hi: dev, mr: dev, ansEn: sym, ansHi: sym, ansMr: sym }));

/** SI units by quantity. */
const SI_UNITS: Fact[] = [
  { en: "length", hi: "लंबाई", mr: "लांबी", ansEn: "metre", ansHi: "मीटर", ansMr: "मीटर" },
  { en: "mass", hi: "द्रव्यमान", mr: "वस्तुमान", ansEn: "kilogram", ansHi: "किलोग्राम", ansMr: "किलोग्रॅम" },
  { en: "time", hi: "समय", mr: "वेळ", ansEn: "second", ansHi: "सेकंड", ansMr: "सेकंद" },
  { en: "electric current", hi: "विद्युत धारा", mr: "विद्युत धारा", ansEn: "ampere", ansHi: "ऐम्पियर", ansMr: "अँपिअर" },
  { en: "temperature", hi: "ताप", mr: "तापमान", ansEn: "kelvin", ansHi: "केल्विन", ansMr: "केल्व्हिन" },
  { en: "force", hi: "बल", mr: "बल", ansEn: "newton", ansHi: "न्यूटन", ansMr: "न्यूटन" },
  { en: "pressure", hi: "दाब", mr: "दाब", ansEn: "pascal", ansHi: "पास्कल", ansMr: "पास्कल" },
  { en: "energy", hi: "ऊर्जा", mr: "ऊर्जा", ansEn: "joule", ansHi: "जूल", ansMr: "ज्यूल" },
  { en: "power", hi: "शक्ति", mr: "शक्ती", ansEn: "watt", ansHi: "वाट", ansMr: "वॅट" },
  { en: "frequency", hi: "आवृत्ति", mr: "वारंवारता", ansEn: "hertz", ansHi: "हर्ट्ज़", ansMr: "हर्ट्झ" },
  { en: "electric charge", hi: "विद्युत आवेश", mr: "विद्युत प्रभार", ansEn: "coulomb", ansHi: "कूलॉम", ansMr: "कुलोम" },
  { en: "potential difference", hi: "विभवांतर", mr: "विभवांतर", ansEn: "volt", ansHi: "वोल्ट", ansMr: "व्होल्ट" },
  { en: "resistance", hi: "प्रतिरोध", mr: "रोध", ansEn: "ohm", ansHi: "ओम", ansMr: "ओम" },
];

/** Events with settled, single-year dates only — anything contested stays out. */
const EVENTS: { en: string; hi: string; mr: string; year: number }[] = [
  { en: "Vasco da Gama reaching Calicut", hi: "वास्को डी गामा का कालीकट पहुँचना", mr: "वास्को द गामा कालिकतला पोहोचणे", year: 1498 },
  { en: "the First Battle of Panipat", hi: "पानीपत की पहली लड़ाई", mr: "पानिपतची पहिली लढाई", year: 1526 },
  { en: "the chartering of the East India Company", hi: "ईस्ट इंडिया कंपनी की स्थापना", mr: "ईस्ट इंडिया कंपनीची स्थापना", year: 1600 },
  { en: "the coronation of Shivaji Maharaj", hi: "शिवाजी महाराज का राज्याभिषेक", mr: "शिवाजी महाराजांचा राज्याभिषेक", year: 1674 },
  { en: "the Battle of Plassey", hi: "प्लासी का युद्ध", mr: "प्लासीची लढाई", year: 1757 },
  { en: "the Battle of Buxar", hi: "बक्सर का युद्ध", mr: "बक्सारची लढाई", year: 1764 },
  { en: "the beginning of the French Revolution", hi: "फ्रांसीसी क्रांति की शुरुआत", mr: "फ्रेंच राज्यक्रांतीची सुरुवात", year: 1789 },
  { en: "the abolition of sati", hi: "सती प्रथा का अंत", mr: "सती प्रथेचे उच्चाटन", year: 1829 },
  { en: "the first railway line from Bombay to Thane", hi: "बंबई से ठाणे तक पहली रेल", mr: "मुंबई ते ठाणे पहिली रेल्वे", year: 1853 },
  { en: "the Revolt of 1857", hi: "1857 की क्रांति", mr: "1857 चा उठाव", year: 1857 },
  { en: "the founding of the Indian National Congress", hi: "भारतीय राष्ट्रीय कांग्रेस की स्थापना", mr: "भारतीय राष्ट्रीय काँग्रेसची स्थापना", year: 1885 },
  { en: "the Partition of Bengal", hi: "बंगाल का विभाजन", mr: "बंगालची फाळणी", year: 1905 },
  { en: "the beginning of the First World War", hi: "प्रथम विश्व युद्ध की शुरुआत", mr: "पहिल्या महायुद्धाची सुरुवात", year: 1914 },
  { en: "the end of the First World War", hi: "प्रथम विश्व युद्ध का अंत", mr: "पहिल्या महायुद्धाचा शेवट", year: 1918 },
  { en: "the Jallianwala Bagh massacre", hi: "जलियाँवाला बाग हत्याकांड", mr: "जालियनवाला बाग हत्याकांड", year: 1919 },
  { en: "the launch of the Non-Cooperation Movement", hi: "असहयोग आंदोलन की शुरुआत", mr: "असहकार चळवळीची सुरुवात", year: 1920 },
  { en: "the Purna Swaraj resolution at Lahore", hi: "लाहौर में पूर्ण स्वराज प्रस्ताव", mr: "लाहोरचा संपूर्ण स्वराज्य ठराव", year: 1929 },
  { en: "the Dandi March", hi: "दांडी यात्रा", mr: "दांडी यात्रा", year: 1930 },
  { en: "the Government of India Act", hi: "भारत सरकार अधिनियम", mr: "भारत सरकार कायदा", year: 1935 },
  { en: "the beginning of the Second World War", hi: "द्वितीय विश्व युद्ध की शुरुआत", mr: "दुसऱ्या महायुद्धाची सुरुवात", year: 1939 },
  { en: "the Quit India Movement", hi: "भारत छोड़ो आंदोलन", mr: "चले जाव चळवळ", year: 1942 },
  { en: "the end of the Second World War", hi: "द्वितीय विश्व युद्ध का अंत", mr: "दुसऱ्या महायुद्धाचा शेवट", year: 1945 },
  { en: "the independence of India", hi: "भारत की स्वतंत्रता", mr: "भारताचे स्वातंत्र्य", year: 1947 },
  { en: "the adoption of the Constitution", hi: "संविधान को अंगीकार करना", mr: "संविधानाचा स्वीकार", year: 1949 },
  { en: "the Constitution coming into force", hi: "संविधान का लागू होना", mr: "संविधान अंमलात येणे", year: 1950 },
  { en: "the launch of Sputnik", hi: "स्पूतनिक का प्रक्षेपण", mr: "स्पुटनिकचे प्रक्षेपण", year: 1957 },
  { en: "the first Moon landing", hi: "चंद्रमा पर पहला कदम", mr: "चंद्रावर पहिले पाऊल", year: 1969 },
];

/** Constitution numbers. Small, numeric, and checkable by any civics teacher. */
const CIV_NUMBERS: { en: string; hi: string; mr: string; value: number }[] = [
  { en: "the minimum voting age in India", hi: "भारत में मतदान की न्यूनतम आयु", mr: "भारतात मतदानाचे किमान वय", value: 18 },
  { en: "the minimum age to contest a Lok Sabha election", hi: "लोकसभा चुनाव लड़ने की न्यूनतम आयु", mr: "लोकसभा निवडणूक लढवण्याचे किमान वय", value: 25 },
  { en: "the minimum age to be a Rajya Sabha member", hi: "राज्यसभा सदस्य बनने की न्यूनतम आयु", mr: "राज्यसभा सदस्य होण्याचे किमान वय", value: 30 },
  { en: "the minimum age to be President of India", hi: "भारत का राष्ट्रपति बनने की न्यूनतम आयु", mr: "भारताचे राष्ट्रपती होण्याचे किमान वय", value: 35 },
  { en: "the term of the Lok Sabha, in years", hi: "लोकसभा का कार्यकाल (वर्षों में)", mr: "लोकसभेचा कार्यकाळ (वर्षांत)", value: 5 },
  { en: "the term of a Rajya Sabha member, in years", hi: "राज्यसभा सदस्य का कार्यकाल (वर्षों में)", mr: "राज्यसभा सदस्याचा कार्यकाळ (वर्षांत)", value: 6 },
  { en: "the number of fundamental duties in the Constitution", hi: "संविधान में मौलिक कर्तव्यों की संख्या", mr: "संविधानातील मूलभूत कर्तव्यांची संख्या", value: 11 },
  { en: "the number of schedules in the Constitution", hi: "संविधान की अनुसूचियों की संख्या", mr: "संविधानाच्या अनुसूचींची संख्या", value: 12 },
];

/* --------------------------------------------------------------------------
   Recall families — every question drawn from a table row.
   -------------------------------------------------------------------------- */

/** Three decoys = the answers of the next three table rows, so they are the
 * same KIND of thing as the answer and never accidentally equal to it. */
function fRecall(tag: string, lvl: number, want: number, rows: Fact[], skins: SkinSet): Template {
  return T(`recall:${tag}`, lvl, want, [rows.length], skins, ([i]) => {
    const row = rows[i!]!;
    const pick = (k: number) => rows[(i! + k) % rows.length]!;
    const [d1, d2, d3] = [pick(1), pick(2), pick(3)];
    return {
      vars: { q: row.en, qh: row.hi, qm: row.mr },
      answer: 0,
      expr: null,
      decoys: [],
      answerText: row.ansEn,
      decoyTexts: [d1.ansEn, d2.ansEn, d3.ansEn],
      textHi: [row.ansHi, d1.ansHi, d2.ansHi, d3.ansHi],
      textMr: [row.ansMr, d1.ansMr, d2.ansMr, d3.ansMr],
    };
  });
}

const reverseFacts = (rows: Fact[]): Fact[] =>
  rows.map((r) => ({ en: r.ansEn, hi: r.ansHi, mr: r.ansMr, ansEn: r.en, ansHi: r.hi, ansMr: r.mr }));

const CAPITAL_SKIN: SkinSet = {
  en: ["What is the capital of {q}?", "Name the capital of {q}."],
  hi: ["{qh} की राजधानी क्या है?", "{qh} की राजधानी बताइए।"],
  mr: ["{qm} ची राजधानी कोणती?", "{qm} ची राजधानी सांगा."],
  sen: "The capital of {q} is {ans}. Find it on the map once and it will stay found.",
  shi: "{qh} की राजधानी {ans} है। नक्शे पर एक बार खोज लें, याद रह जाएगी।",
  smr: "{qm} ची राजधानी {ans} आहे. नकाशावर एकदा शोधा, लक्षात राहील.",
};
const OF_CAPITAL_SKIN: SkinSet = {
  en: ["{q} is the capital of which state?", "Which state has {q} as its capital?"],
  hi: ["{qh} किस राज्य की राजधानी है?", "किस राज्य की राजधानी {qh} है?"],
  mr: ["{qm} ही कोणत्या राज्याची राजधानी आहे?", "कोणत्या राज्याची राजधानी {qm} आहे?"],
  sen: "{q} is the capital of {ans}. Find it on the map once and it will stay found.",
  shi: "{qh} {ans} की राजधानी है। नक्शे पर एक बार खोज लें, याद रह जाएगी।",
  smr: "{qm} ही {ans} ची राजधानी आहे. नकाशावर एकदा शोधा, लक्षात राहील.",
};
const ELEMENT_SKIN: SkinSet = {
  en: ["What is the chemical symbol of {q}?", "Which symbol stands for {q}?"],
  hi: ["{qh} का रासायनिक प्रतीक क्या है?", "{qh} के लिए कौन-सा प्रतीक है?"],
  mr: ["{qm} चे रासायनिक चिन्ह कोणते?", "{qm} साठी कोणते चिन्ह आहे?"],
  sen: "The symbol of {q} is {ans}, as the periodic table writes it.",
  shi: "{qh} का प्रतीक {ans} है, जैसा आवर्त सारणी में लिखा है।",
  smr: "{qm} चे चिन्ह {ans} आहे, आवर्त सारणीत असेच लिहिले आहे.",
};
const SYMBOL_SKIN: SkinSet = {
  en: ["Which element has the symbol {q}?", "The symbol {q} stands for which element?"],
  hi: ["प्रतीक {qh} किस तत्व का है?", "{qh} प्रतीक किस तत्व के लिए है?"],
  mr: ["{qm} हे चिन्ह कोणत्या मूलद्रव्याचे आहे?", "{qm} चिन्ह कोणत्या मूलद्रव्यासाठी आहे?"],
  sen: "The symbol {q} stands for {ans}, as the periodic table writes it.",
  shi: "प्रतीक {qh} तत्व {ans} का है, जैसा आवर्त सारणी में लिखा है।",
  smr: "{qm} हे चिन्ह {ans} या मूलद्रव्याचे आहे, आवर्त सारणीत असेच आहे.",
};
const UNIT_SKIN: SkinSet = {
  en: ["What is the SI unit of {q}?", "Name the SI unit of {q}."],
  hi: ["{qh} की SI इकाई क्या है?", "{qh} की SI इकाई बताइए।"],
  mr: ["{qm} चे SI एकक कोणते?", "{qm} चे SI एकक सांगा."],
  sen: "The SI unit of {q} is the {ans}.",
  shi: "{qh} की SI इकाई {ans} है।",
  smr: "{qm} चे SI एकक {ans} आहे.",
};

/** "In which year…" — numeric recall; choices are nearby plausible years. */
const YEAR_SKIN: SkinSet = {
  en: ["In which year did {q} take place?", "{q} — which year?"],
  hi: ["{qh} किस वर्ष हुआ?", "{qh} — कौन-सा वर्ष?"],
  mr: ["{qm} कोणत्या वर्षी घडले?", "{qm} — कोणते वर्ष?"],
  sen: "It happened in {ans}. Place it on your timeline next to what came before and after.",
  shi: "यह {ans} में हुआ। इसे अपनी समयरेखा पर आगे-पीछे की घटनाओं के पास रखिए।",
  smr: "हे {ans} मध्ये घडले. आधी-नंतरच्या घटनांच्या शेजारी हे कालरेषेवर ठेवा.",
};
const fEventYear = (tag: string, lvl: number, want: number, from: number, to: number) => {
  const rows = EVENTS.filter((e) => e.year >= from && e.year <= to);
  return T(`histyear:${tag}`, lvl, want, [rows.length], YEAR_SKIN, ([i]) => {
    const e = rows[i!]!;
    return {
      vars: { q: e.en, qh: e.hi, qm: e.mr },
      answer: e.year,
      expr: null,
      decoys: [e.year + 10, e.year - 10, e.year + 3, e.year - 7],
    };
  });
};

const fCivNumber = (tag: string, lvl: number, want: number) =>
  T(
    `civnum:${tag}`,
    lvl,
    want,
    [CIV_NUMBERS.length],
    {
      en: ["What is {q}?", "State {q}."],
      hi: ["{qh} क्या है?", "{qh} बताइए।"],
      mr: ["{qm} किती आहे?", "{qm} सांगा."],
      sen: "The Constitution and election law set {q} at {ans}.",
      shi: "{qh} संविधान और चुनाव कानून के अनुसार {ans} है।",
      smr: "{qm} संविधान व निवडणूक कायद्यानुसार {ans} आहे.",
    },
    ([i]) => {
      const row = CIV_NUMBERS[i!]!;
      return {
        vars: { q: row.en, qh: row.hi, qm: row.mr },
        answer: row.value,
        expr: null,
        decoys: [row.value + 2, Math.max(1, row.value - 2), row.value + 5],
      };
    },
  );

/* --------------------------------------------------------------------------
   Science — numericals, every one checkExpr-proven.
   -------------------------------------------------------------------------- */

const mkSci =
  (key: string, skins: SkinSet, build: (c: number[], r1: Range, r2: Range) => MadeQ) =>
  (tag: string, lvl: number, want: number, r1: Range, r2: Range) =>
    T(`${key}:${tag}`, lvl, want, [r1.n, r2.n], skins, (c) => build(c, r1, r2));

const fSciSpeed = mkSci(
  "scispeed",
  {
    en: ["A cyclist rides {d} km in {t} hours at a steady pace. What is the speed?", "An object moves {d} km in {t} hours. Find its speed."],
    hi: ["एक साइकिल सवार {t} घंटों में {d} किमी चलता है। चाल क्या है?", "कोई वस्तु {t} घंटों में {d} किमी चलती है। उसकी चाल निकालिए।"],
    mr: ["एक सायकलस्वार {t} तासांत {d} किमी जातो. वेग किती?", "एक वस्तू {t} तासांत {d} किमी जाते. तिचा वेग काढा."],
    sen: "Speed = distance ÷ time = {d} ÷ {t} = {ans} km/h.",
    shi: "चाल = दूरी ÷ समय = {d} ÷ {t} = {ans} किमी/घंटा।",
    smr: "वेग = अंतर ÷ वेळ = {d} ÷ {t} = {ans} किमी/तास.",
  },
  ([i, j], r1, r2) => {
    const v = at(r1, i!), t = at(r2, j!), d = v * t;
    return { vars: { d, t }, answer: v, expr: `${d}/${t}`, decoys: [v + 5, v - 5, d - t], render: (n) => `${fmt(n)} km/h` };
  },
);

const fSciDensity = mkSci(
  "scidensity",
  {
    en: ["A block has mass {m} g and volume {v} cm³. What is its density?", "Find the density of an object of mass {m} g and volume {v} cm³."],
    hi: ["एक गुटके का द्रव्यमान {m} ग्राम और आयतन {v} सेमी³ है। घनत्व क्या है?", "द्रव्यमान {m} ग्राम और आयतन {v} सेमी³ वाली वस्तु का घनत्व निकालिए।"],
    mr: ["एका ठोकळ्याचे वस्तुमान {m} ग्रॅम व आकारमान {v} सेमी³ आहे. घनता किती?", "वस्तुमान {m} ग्रॅम व आकारमान {v} सेमी³ असलेल्या वस्तूची घनता काढा."],
    sen: "Density = mass ÷ volume = {m} ÷ {v} = {ans} g/cm³.",
    shi: "घनत्व = द्रव्यमान ÷ आयतन = {m} ÷ {v} = {ans} ग्राम/सेमी³।",
    smr: "घनता = वस्तुमान ÷ आकारमान = {m} ÷ {v} = {ans} ग्रॅम/सेमी³.",
  },
  ([i, j], r1, r2) => {
    const rho = at(r1, i!), v = at(r2, j!), m = rho * v;
    return { vars: { m, v }, answer: rho, expr: `${m}/${v}`, decoys: [rho + 1, rho + 2, m - v], render: (n) => `${fmt(n)} g/cm³` };
  },
);

const fSciForce = mkSci(
  "sciforce",
  {
    en: ["A mass of {m} kg accelerates at {a} m/s². What force acts on it?", "Find the force on a {m} kg body accelerating at {a} m/s²."],
    hi: ["{m} किग्रा का पिंड {a} मी/से² से त्वरित होता है। उस पर कितना बल लगता है?", "{a} मी/से² से त्वरित {m} किग्रा के पिंड पर बल निकालिए।"],
    mr: ["{m} किग्रॅ वस्तुमान {a} मी/से² ने त्वरित होते. त्यावर किती बल आहे?", "{a} मी/से² त्वरण असलेल्या {m} किग्रॅ वस्तूवरील बल काढा."],
    sen: "Force = mass × acceleration = {m} × {a} = {ans} N.",
    shi: "बल = द्रव्यमान × त्वरण = {m} × {a} = {ans} न्यूटन।",
    smr: "बल = वस्तुमान × त्वरण = {m} × {a} = {ans} न्यूटन.",
  },
  ([i, j], r1, r2) => {
    const m = at(r1, i!), a = at(r2, j!), f = m * a;
    return { vars: { m, a }, answer: f, expr: `${m}*${a}`, decoys: [f + m, f - a, m + a], render: (n) => `${fmt(n)} N` };
  },
);

const fSciOhm = mkSci(
  "sciohm",
  {
    en: ["A current of {i} A flows through a resistance of {r} Ω. What is the potential difference?", "Find V when I = {i} A and R = {r} Ω."],
    hi: ["{r} ओम के प्रतिरोध से {i} ऐम्पियर धारा बहती है। विभवांतर क्या है?", "I = {i} A और R = {r} Ω हो तो V निकालिए।"],
    mr: ["{r} ओम रोधातून {i} अँपिअर धारा वाहते. विभवांतर किती?", "I = {i} A आणि R = {r} Ω असता V काढा."],
    sen: "Ohm's law: V = I × R = {i} × {r} = {ans} V.",
    shi: "ओम का नियम: V = I × R = {i} × {r} = {ans} वोल्ट।",
    smr: "ओमचा नियम: V = I × R = {i} × {r} = {ans} व्होल्ट.",
  },
  ([i, j], r1, r2) => {
    const cur = at(r1, i!), res = at(r2, j!), v = cur * res;
    return { vars: { i: cur, r: res }, answer: v, expr: `${cur}*${res}`, decoys: [v + res, v - cur, cur + res], render: (n) => `${fmt(n)} V` };
  },
);

const fSciWork = mkSci(
  "sciwork",
  {
    en: ["A force of {f} N moves an object {d} m in its own direction. How much work is done?", "Find the work done by {f} N over {d} m."],
    hi: ["{f} न्यूटन का बल वस्तु को अपनी दिशा में {d} मीटर खिसकाता है। कितना कार्य हुआ?", "{d} मीटर पर {f} न्यूटन बल का कार्य निकालिए।"],
    mr: ["{f} न्यूटन बल वस्तूला त्याच दिशेने {d} मीटर सरकवते. किती कार्य झाले?", "{d} मीटरवर {f} न्यूटन बलाचे कार्य काढा."],
    sen: "Work = force × distance = {f} × {d} = {ans} J.",
    shi: "कार्य = बल × दूरी = {f} × {d} = {ans} जूल।",
    smr: "कार्य = बल × अंतर = {f} × {d} = {ans} ज्यूल.",
  },
  ([i, j], r1, r2) => {
    const f = at(r1, i!), d = at(r2, j!), w = f * d;
    return { vars: { f, d }, answer: w, expr: `${f}*${d}`, decoys: [w + f, w - d, f + d], render: (n) => `${fmt(n)} J` };
  },
);

const fSciPower = mkSci(
  "scipower",
  {
    en: ["A machine does {w} J of work in {t} seconds. What is its power?", "Find the power of a machine doing {w} J in {t} s."],
    hi: ["एक मशीन {t} सेकंड में {w} जूल कार्य करती है। उसकी शक्ति क्या है?", "{t} सेकंड में {w} जूल कार्य करने वाली मशीन की शक्ति निकालिए।"],
    mr: ["एक यंत्र {t} सेकंदांत {w} ज्यूल कार्य करते. त्याची शक्ती किती?", "{t} सेकंदांत {w} ज्यूल कार्य करणाऱ्या यंत्राची शक्ती काढा."],
    sen: "Power = work ÷ time = {w} ÷ {t} = {ans} W.",
    shi: "शक्ति = कार्य ÷ समय = {w} ÷ {t} = {ans} वाट।",
    smr: "शक्ती = कार्य ÷ वेळ = {w} ÷ {t} = {ans} वॅट.",
  },
  ([i, j], r1, r2) => {
    const p = at(r1, i!), t = at(r2, j!), w = p * t;
    return { vars: { w, t }, answer: p, expr: `${w}/${t}`, decoys: [p + 10, p - 10, w - t], render: (n) => `${fmt(n)} W` };
  },
);

const fSciWave = mkSci(
  "sciwave",
  {
    en: ["A wave has frequency {f} Hz and wavelength {l} m. What is its speed?", "Find the speed of a wave with f = {f} Hz and λ = {l} m."],
    hi: ["एक तरंग की आवृत्ति {f} हर्ट्ज़ और तरंगदैर्घ्य {l} मीटर है। उसकी चाल क्या है?", "f = {f} Hz और λ = {l} m वाली तरंग की चाल निकालिए।"],
    mr: ["एका तरंगाची वारंवारता {f} हर्ट्झ व तरंगलांबी {l} मीटर आहे. त्याचा वेग किती?", "f = {f} Hz आणि λ = {l} m असलेल्या तरंगाचा वेग काढा."],
    sen: "Wave speed = frequency × wavelength = {f} × {l} = {ans} m/s.",
    shi: "तरंग चाल = आवृत्ति × तरंगदैर्घ्य = {f} × {l} = {ans} मी/से।",
    smr: "तरंग वेग = वारंवारता × तरंगलांबी = {f} × {l} = {ans} मी/से.",
  },
  ([i, j], r1, r2) => {
    const f = at(r1, i!), l = at(r2, j!), v = f * l;
    return { vars: { f, l }, answer: v, expr: `${f}*${l}`, decoys: [v + f, v - l, f + l], render: (n) => `${fmt(n)} m/s` };
  },
);

const HEAT_C = [390, 420, 900, 1000, 2100, 4200];
const fSciHeat = (tag: string, lvl: number, want: number, m: Range, dt: Range) =>
  T(
    `sciheat:${tag}`,
    lvl,
    want,
    [m.n, dt.n, HEAT_C.length],
    {
      en: ["A {m} kg sample with specific heat {c} J/kg·°C warms by {dt}°C. How much heat was absorbed?"],
      hi: ["{m} किग्रा का नमूना, विशिष्ट ऊष्मा {c} जूल/किग्रा·°C, {dt}°C गर्म होता है। कितनी ऊष्मा अवशोषित हुई?"],
      mr: ["{m} किग्रॅ नमुना, विशिष्ट उष्मा {c} ज्यूल/किग्रॅ·°C, {dt}°C ने तापतो. किती उष्णता शोषली गेली?"],
      sen: "Q = m × c × ΔT = {m} × {c} × {dt} = {ans} J.",
      shi: "Q = m × c × ΔT = {m} × {c} × {dt} = {ans} जूल।",
      smr: "Q = m × c × ΔT = {m} × {c} × {dt} = {ans} ज्यूल.",
    },
    ([i, j, k]) => {
      const mass = at(m, i!), delta = at(dt, j!), c = HEAT_C[k!]!;
      const q = mass * c * delta;
      return { vars: { m: mass, c, dt: delta }, answer: q, expr: `${mass}*${c}*${delta}`, decoys: [q / 2, q + c, mass * c], render: (n) => `${fmt(n)} J` };
    },
  );

const fSciCF = (tag: string, lvl: number, want: number, c5: Range) =>
  T(
    `scicf:${tag}`,
    lvl,
    want,
    [c5.n],
    {
      en: ["Convert {c}°C to Fahrenheit.", "What is {c}°C in °F?"],
      hi: ["{c}°C को फ़ारेनहाइट में बदलिए।", "{c}°C कितने °F होते हैं?"],
      mr: ["{c}°C फॅरेनहाइटमध्ये रूपांतरित करा.", "{c}°C म्हणजे किती °F?"],
      sen: "°F = 9 × °C ÷ 5 + 32 = 9 × {c} ÷ 5 + 32 = {ans}°F.",
      shi: "°F = 9 × °C ÷ 5 + 32 = 9 × {c} ÷ 5 + 32 = {ans}°F।",
      smr: "°F = 9 × °C ÷ 5 + 32 = 9 × {c} ÷ 5 + 32 = {ans}°F.",
    },
    ([i]) => {
      const c = 5 * at(c5, i!);
      const f = (9 * c) / 5 + 32;
      return { vars: { c }, answer: f, expr: `9*${c}/5+32`, decoys: [f - 32, c + 32, f + 5], render: (n) => `${fmt(n)}°F` };
    },
  );

const fSciMoles = (tag: string, lvl: number, want: number, k: Range) =>
  T(
    `scimoles:${tag}`,
    lvl,
    want,
    [k.n, 10],
    {
      en: ["A substance has molar mass {M} g/mol. How many moles are in {m} g of it?"],
      hi: ["किसी पदार्थ का मोलर द्रव्यमान {M} ग्राम/मोल है। उसके {m} ग्राम में कितने मोल हैं?"],
      mr: ["एका पदार्थाचे मोलर वस्तुमान {M} ग्रॅम/मोल आहे. त्याच्या {m} ग्रॅममध्ये किती मोल आहेत?"],
      sen: "Moles = mass ÷ molar mass = {m} ÷ {M} = {ans} mol.",
      shi: "मोल = द्रव्यमान ÷ मोलर द्रव्यमान = {m} ÷ {M} = {ans} मोल।",
      smr: "मोल = वस्तुमान ÷ मोलर वस्तुमान = {m} ÷ {M} = {ans} मोल.",
    },
    ([i, j]) => {
      const MOLAR = [2, 4, 12, 14, 16, 18, 28, 32, 44, 64];
      const M = MOLAR[j!]!, n = at(k, i!), m = n * M;
      return { vars: { M, m }, answer: n, expr: `${m}/${M}`, decoys: [n + 1, n - 1, m - M], render: (n2) => `${fmt(n2)} mol` };
    },
  );

/* --------------------------------------------------------------------------
   Science — the upper rungs. Every chapter climbs L1→L6: single-formula work
   at the bottom, then rearranged formulas, then the multi-step compositions
   that Olympiad and NSO papers actually ask. All checkExpr-proven.
   -------------------------------------------------------------------------- */

const SCIDIST: SkinSet = {
  en: ["A bus travels at {v} km/h for {t} hours. How far does it go?", "At a steady {v} km/h, what distance is covered in {t} hours?"],
  hi: ["एक बस {t} घंटों तक {v} किमी/घंटा से चलती है। वह कितनी दूर जाती है?", "{v} किमी/घंटा की स्थिर चाल से {t} घंटों में कितनी दूरी तय होगी?"],
  mr: ["एक बस {t} तास {v} किमी/तास वेगाने जाते. ती किती दूर जाते?", "{v} किमी/तास या स्थिर वेगाने {t} तासांत किती अंतर कापले जाईल?"],
  sen: "Distance = speed × time = {v} × {t} = {ans} km.",
  shi: "दूरी = चाल × समय = {v} × {t} = {ans} किमी।",
  smr: "अंतर = वेग × वेळ = {v} × {t} = {ans} किमी.",
};
const fSciDist = (tag: string, lvl: number, want: number, v: Range, t: Range) =>
  T(`scidist:${tag}`, lvl, want, [v.n, t.n], SCIDIST, ([i, j]) => {
    const s = at(v, i!), tt = at(t, j!), d = s * tt;
    return { vars: { v: s, t: tt }, answer: d, expr: `${s}*${tt}`, decoys: [d + s, d - tt, s + tt], render: (n) => `${fmt(n)} km` };
  });

const SCITIME: SkinSet = {
  en: ["A train covers {d} km at a steady {v} km/h. How long does the journey take?", "How many hours does it take to travel {d} km at {v} km/h?"],
  hi: ["एक रेलगाड़ी {v} किमी/घंटा की स्थिर चाल से {d} किमी तय करती है। यात्रा में कितना समय लगेगा?", "{v} किमी/घंटा से {d} किमी जाने में कितने घंटे लगेंगे?"],
  mr: ["एक रेल्वे {v} किमी/तास या स्थिर वेगाने {d} किमी अंतर कापते. प्रवासाला किती वेळ लागेल?", "{v} किमी/तास वेगाने {d} किमी जाण्यास किती तास लागतील?"],
  sen: "Time = distance ÷ speed = {d} ÷ {v} = {ans} hours.",
  shi: "समय = दूरी ÷ चाल = {d} ÷ {v} = {ans} घंटे।",
  smr: "वेळ = अंतर ÷ वेग = {d} ÷ {v} = {ans} तास.",
};
const fSciTime = (tag: string, lvl: number, want: number, v: Range, t: Range) =>
  T(`scitime:${tag}`, lvl, want, [v.n, t.n], SCITIME, ([i, j]) => {
    const s = at(v, i!), tt = at(t, j!), d = s * tt;
    return { vars: { d, v: s }, answer: tt, expr: `${d}/${s}`, decoys: [tt + 1, tt + 2, d - s], render: (n) => `${fmt(n)} h` };
  });

const SCIAVG: SkinSet = {
  en: [
    "A cyclist rides at {v1} km/h for {t} hours, then at {v2} km/h for another {t} hours. What is the average speed for the whole ride?",
    "A car does {d1} km in the first {t} hours and {d2} km in the next {t} hours. Find its average speed.",
  ],
  hi: [
    "एक साइकिल सवार {t} घंटे {v1} किमी/घंटा से, फिर {t} घंटे {v2} किमी/घंटा से चलता है। पूरी यात्रा की औसत चाल क्या है?",
    "एक कार पहले {t} घंटों में {d1} किमी और अगले {t} घंटों में {d2} किमी चलती है। उसकी औसत चाल निकालिए।",
  ],
  mr: [
    "एक सायकलस्वार {t} तास {v1} किमी/तास वेगाने, मग {t} तास {v2} किमी/तास वेगाने जातो. संपूर्ण प्रवासाचा सरासरी वेग किती?",
    "एक कार पहिल्या {t} तासांत {d1} किमी आणि पुढील {t} तासांत {d2} किमी जाते. तिचा सरासरी वेग काढा.",
  ],
  sen: "Average speed = total distance ÷ total time = ({d1} + {d2}) ÷ ({t} + {t}) = {ans} km/h.",
  shi: "औसत चाल = कुल दूरी ÷ कुल समय = ({d1} + {d2}) ÷ ({t} + {t}) = {ans} किमी/घंटा।",
  smr: "सरासरी वेग = एकूण अंतर ÷ एकूण वेळ = ({d1} + {d2}) ÷ ({t} + {t}) = {ans} किमी/तास.",
};
const fSciAvgSpeed = (tag: string, lvl: number, want: number, v1r: Range, kr: Range, tr: Range) =>
  T(`sciavg:${tag}`, lvl, want, [v1r.n, kr.n, tr.n], SCIAVG, ([i, j, k]) => {
    const v1 = at(v1r, i!), v2 = v1 + 2 * at(kr, j!), t = at(tr, k!);
    const d1 = v1 * t, d2 = v2 * t, avg = (v1 + v2) / 2;
    return { vars: { v1, v2, t, d1, d2 }, answer: avg, expr: `(${d1}+${d2})/(${t}+${t})`, decoys: [avg + 2, avg - 2, v2], render: (n) => `${fmt(n)} km/h` };
  });

const SCITRIP: SkinSet = {
  en: [
    "A bus covers {d1} km in {t1} hours, then {d2} km in {t2} more hours. What is the average speed over the whole trip?",
    "On a journey, a van does {d1} km in the first {t1} hours and {d2} km in the remaining {t2} hours. Find the average speed.",
  ],
  hi: [
    "एक बस {t1} घंटों में {d1} किमी, फिर {t2} और घंटों में {d2} किमी चलती है। पूरी यात्रा की औसत चाल क्या है?",
    "एक यात्रा में वैन पहले {t1} घंटों में {d1} किमी और बाकी {t2} घंटों में {d2} किमी चलती है। औसत चाल निकालिए।",
  ],
  mr: [
    "एक बस {t1} तासांत {d1} किमी, मग आणखी {t2} तासांत {d2} किमी जाते. संपूर्ण प्रवासाचा सरासरी वेग किती?",
    "एका प्रवासात व्हॅन पहिल्या {t1} तासांत {d1} किमी आणि उरलेल्या {t2} तासांत {d2} किमी जाते. सरासरी वेग काढा.",
  ],
  sen: "Average speed = total distance ÷ total time = ({d1} + {d2}) ÷ ({t1} + {t2}) = {ans} km/h.",
  shi: "औसत चाल = कुल दूरी ÷ कुल समय = ({d1} + {d2}) ÷ ({t1} + {t2}) = {ans} किमी/घंटा।",
  smr: "सरासरी वेग = एकूण अंतर ÷ एकूण वेळ = ({d1} + {d2}) ÷ ({t1} + {t2}) = {ans} किमी/तास.",
};
/** avg banded; t1 = t2·j so v2 = avg − δ·j stays an integer. */
const fSciTrip = (tag: string, lvl: number, want: number, avgR: Range) =>
  T(`scitrip:${tag}`, lvl, want, [avgR.n, 5, 3, 4], SCITRIP, ([i, j, k, l]) => {
    const avg = at(avgR, i!), t2 = 2 + j!, mul = 1 + k!, delta = 1 + l!;
    const t1 = t2 * mul, v1 = avg + delta, v2 = avg - delta * mul;
    const d1 = v1 * t1, d2 = v2 * t2;
    return { vars: { d1, t1, d2, t2 }, answer: avg, expr: `(${d1}+${d2})/(${t1}+${t2})`, decoys: [avg + 3, avg - 3, v1], render: (n) => `${fmt(n)} km/h` };
  });

const SCIROUND: SkinSet = {
  en: [
    "A plane flies {d} km to a city at {v1} km/h and returns over the same {d} km at {v2} km/h. What is the average speed for the round trip?",
    "A boat goes {d} km downstream at {v1} km/h and comes back the same {d} km at {v2} km/h. Find the average speed of the whole trip.",
  ],
  hi: [
    "एक विमान {v1} किमी/घंटा से {d} किमी दूर शहर जाता है और वही {d} किमी {v2} किमी/घंटा से लौटता है। पूरे सफ़र की औसत चाल क्या है?",
    "एक नाव {v1} किमी/घंटा से {d} किमी धारा की ओर जाती है और वही {d} किमी {v2} किमी/घंटा से लौटती है। पूरे सफ़र की औसत चाल निकालिए।",
  ],
  mr: [
    "एक विमान {v1} किमी/तास वेगाने {d} किमी दूरच्या शहरी जाते आणि तेच {d} किमी {v2} किमी/तास वेगाने परत येते. संपूर्ण फेरीचा सरासरी वेग किती?",
    "एक नाव {v1} किमी/तास वेगाने {d} किमी प्रवाहाबरोबर जाते आणि तेच {d} किमी {v2} किमी/तास वेगाने परत येते. संपूर्ण फेरीचा सरासरी वेग काढा.",
  ],
  sen: "Average speed = total distance ÷ total time = 2 × {d} ÷ ({d}/{v1} + {d}/{v2}) = {ans} km/h — NOT the midpoint of the two speeds.",
  shi: "औसत चाल = कुल दूरी ÷ कुल समय = 2 × {d} ÷ ({d}/{v1} + {d}/{v2}) = {ans} किमी/घंटा — दोनों चालों का मध्य नहीं।",
  smr: "सरासरी वेग = एकूण अंतर ÷ एकूण वेळ = 2 × {d} ÷ ({d}/{v1} + {d}/{v2}) = {ans} किमी/तास — दोन वेगांचा मध्य नव्हे.",
};
/** v1 = 3m, v2 = 6m, d = 6mj → both leg times integer; answer 4m. */
const fSciRoundTrip = (tag: string, lvl: number, want: number, mR: Range, jR: Range) =>
  T(`sciround:${tag}`, lvl, want, [mR.n, jR.n], SCIROUND, ([i, j]) => {
    const m = at(mR, i!), v1 = 3 * m, v2 = 6 * m, d = 6 * m * at(jR, j!);
    const avg = 4 * m;
    return { vars: { d, v1, v2 }, answer: avg, expr: `2*${d}/(${d}/${v1}+${d}/${v2})`, decoys: [(v1 + v2) / 2, avg + m, v2], render: (n) => `${fmt(n)} km/h` };
  });

const SCIMASS: SkinSet = {
  en: ["A liquid has density {r} g/cm³. What is the mass of {v} cm³ of it?", "Find the mass of {v} cm³ of a material of density {r} g/cm³."],
  hi: ["एक द्रव का घनत्व {r} ग्राम/सेमी³ है। उसके {v} सेमी³ का द्रव्यमान क्या है?", "{r} ग्राम/सेमी³ घनत्व वाले पदार्थ के {v} सेमी³ का द्रव्यमान निकालिए।"],
  mr: ["एका द्रवाची घनता {r} ग्रॅम/सेमी³ आहे. त्याच्या {v} सेमी³ चे वस्तुमान किती?", "{r} ग्रॅम/सेमी³ घनतेच्या पदार्थाच्या {v} सेमी³ चे वस्तुमान काढा."],
  sen: "Mass = density × volume = {r} × {v} = {ans} g.",
  shi: "द्रव्यमान = घनत्व × आयतन = {r} × {v} = {ans} ग्राम।",
  smr: "वस्तुमान = घनता × आकारमान = {r} × {v} = {ans} ग्रॅम.",
};
const fSciMass = (tag: string, lvl: number, want: number, r: Range, v: Range) =>
  T(`scimass:${tag}`, lvl, want, [r.n, v.n], SCIMASS, ([i, j]) => {
    const rho = at(r, i!), vol = at(v, j!), m = rho * vol;
    return { vars: { r: rho, v: vol }, answer: m, expr: `${rho}*${vol}`, decoys: [m + rho, m - vol, rho + vol], render: (n) => `${fmt(n)} g` };
  });

const SCIVOL: SkinSet = {
  en: ["A block of density {r} g/cm³ has mass {m} g. What is its volume?", "Find the volume of {m} g of a material whose density is {r} g/cm³."],
  hi: ["{r} ग्राम/सेमी³ घनत्व के गुटके का द्रव्यमान {m} ग्राम है। उसका आयतन क्या है?", "{r} ग्राम/सेमी³ घनत्व वाले पदार्थ के {m} ग्राम का आयतन निकालिए।"],
  mr: ["{r} ग्रॅम/सेमी³ घनतेच्या ठोकळ्याचे वस्तुमान {m} ग्रॅम आहे. त्याचे आकारमान किती?", "{r} ग्रॅम/सेमी³ घनतेच्या पदार्थाच्या {m} ग्रॅमचे आकारमान काढा."],
  sen: "Volume = mass ÷ density = {m} ÷ {r} = {ans} cm³.",
  shi: "आयतन = द्रव्यमान ÷ घनत्व = {m} ÷ {r} = {ans} सेमी³।",
  smr: "आकारमान = वस्तुमान ÷ घनता = {m} ÷ {r} = {ans} सेमी³.",
};
const fSciVol = (tag: string, lvl: number, want: number, r: Range, v: Range) =>
  T(`scivol:${tag}`, lvl, want, [r.n, v.n], SCIVOL, ([i, j]) => {
    const rho = at(r, i!), vol = at(v, j!), m = rho * vol;
    return { vars: { m, r: rho }, answer: vol, expr: `${m}/${rho}`, decoys: [vol + 2, vol - 1, m - rho], render: (n) => `${fmt(n)} cm³` };
  });

const SCIMIX: SkinSet = {
  en: [
    "Two blocks are glued together: one of mass {m1} g and volume {v1} cm³, the other of mass {m2} g and volume {v2} cm³. What is the density of the combined block?",
    "A {m1} g, {v1} cm³ piece and a {m2} g, {v2} cm³ piece are joined. Find the density of the whole.",
  ],
  hi: [
    "दो गुटके जोड़े गए: एक {m1} ग्राम और {v1} सेमी³ का, दूसरा {m2} ग्राम और {v2} सेमी³ का। जुड़े हुए गुटके का घनत्व क्या है?",
    "{m1} ग्राम, {v1} सेमी³ का टुकड़ा और {m2} ग्राम, {v2} सेमी³ का टुकड़ा जोड़े गए। पूरे का घनत्व निकालिए।",
  ],
  mr: [
    "दोन ठोकळे जोडले: एक {m1} ग्रॅम व {v1} सेमी³ चा, दुसरा {m2} ग्रॅम व {v2} सेमी³ चा. जोडलेल्या ठोकळ्याची घनता किती?",
    "{m1} ग्रॅम, {v1} सेमी³ चा तुकडा आणि {m2} ग्रॅम, {v2} सेमी³ चा तुकडा जोडले. संपूर्णाची घनता काढा.",
  ],
  sen: "Density of the whole = total mass ÷ total volume = ({m1} + {m2}) ÷ ({v1} + {v2}) = {ans} g/cm³.",
  shi: "पूरे का घनत्व = कुल द्रव्यमान ÷ कुल आयतन = ({m1} + {m2}) ÷ ({v1} + {v2}) = {ans} ग्राम/सेमी³।",
  smr: "संपूर्णाची घनता = एकूण वस्तुमान ÷ एकूण आकारमान = ({m1} + {m2}) ÷ ({v1} + {v2}) = {ans} ग्रॅम/सेमी³.",
};
/** Combined density lands exactly on rho: m1 = (rho+1)·v1, m2 = rho·v2 − v1. */
const fSciMix = (tag: string, lvl: number, want: number, r: Range, v1r: Range, v2r: Range) =>
  T(`scimix:${tag}`, lvl, want, [r.n, v1r.n, v2r.n], SCIMIX, ([i, j, k]) => {
    const rho = at(r, i!), v1 = at(v1r, j!), v2 = at(v2r, k!);
    const m1 = (rho + 1) * v1, m2 = rho * v2 - v1;
    return { vars: { m1, v1, m2, v2 }, answer: rho, expr: `(${m1}+${m2})/(${v1}+${v2})`, decoys: [rho + 1, rho - 1, rho + 2], render: (n) => `${fmt(n)} g/cm³` };
  });

const SCIALLOY: SkinSet = {
  en: [
    "Equal volumes ({v} cm³ each) of two materials with densities {a} g/cm³ and {b} g/cm³ are fused into one piece. What is the density of the alloy?",
    "An alloy is made from {v} cm³ of a metal of density {a} g/cm³ and {v} cm³ of another of density {b} g/cm³. Find the alloy's density.",
  ],
  hi: [
    "{a} ग्राम/सेमी³ और {b} ग्राम/सेमी³ घनत्व वाले दो पदार्थों के बराबर आयतन ({v} सेमी³ प्रत्येक) मिलाए गए। मिश्र धातु का घनत्व क्या है?",
    "{a} ग्राम/सेमी³ घनत्व की धातु के {v} सेमी³ और {b} ग्राम/सेमी³ की धातु के {v} सेमी³ से मिश्र धातु बनी। उसका घनत्व निकालिए।",
  ],
  mr: [
    "{a} ग्रॅम/सेमी³ आणि {b} ग्रॅम/सेमी³ घनतेच्या दोन पदार्थांची समान आकारमाने ({v} सेमी³ प्रत्येकी) एकत्र केली. मिश्रधातूची घनता किती?",
    "{a} ग्रॅम/सेमी³ घनतेच्या धातूचे {v} सेमी³ आणि {b} ग्रॅम/सेमी³ च्या धातूचे {v} सेमी³ यांपासून मिश्रधातू बनली. तिची घनता काढा.",
  ],
  sen: "Total mass = {a}×{v} + {b}×{v}; total volume = 2×{v}; density = ({a}×{v} + {b}×{v}) ÷ (2×{v}) = {ans} g/cm³.",
  shi: "कुल द्रव्यमान = {a}×{v} + {b}×{v}; कुल आयतन = 2×{v}; घनत्व = ({a}×{v} + {b}×{v}) ÷ (2×{v}) = {ans} ग्राम/सेमी³।",
  smr: "एकूण वस्तुमान = {a}×{v} + {b}×{v}; एकूण आकारमान = 2×{v}; घनता = ({a}×{v} + {b}×{v}) ÷ (2×{v}) = {ans} ग्रॅम/सेमी³.",
};
const fSciAlloy = (tag: string, lvl: number, want: number, aR: Range, kR: Range, vR: Range) =>
  T(`scialloy:${tag}`, lvl, want, [aR.n, kR.n, vR.n], SCIALLOY, ([i, j, k]) => {
    const a = at(aR, i!), b = a + 2 * at(kR, j!), v = at(vR, k!);
    const ans = (a + b) / 2;
    return { vars: { a, b, v }, answer: ans, expr: `(${a}*${v}+${b}*${v})/(2*${v})`, decoys: [ans + 1, ans - 1, a + b], render: (n) => `${fmt(n)} g/cm³` };
  });

const SCICUBE: SkinSet = {
  en: ["A solid cube of side {s} cm has mass {m} g. What is the density of its material?", "A cube with edge {s} cm weighs {m} g. Find the density."],
  hi: ["{s} सेमी भुजा वाले ठोस घन का द्रव्यमान {m} ग्राम है। उसके पदार्थ का घनत्व क्या है?", "{s} सेमी किनारे वाले घन का द्रव्यमान {m} ग्राम है। घनत्व निकालिए।"],
  mr: ["{s} सेमी बाजूच्या भरीव घनाचे वस्तुमान {m} ग्रॅम आहे. त्याच्या पदार्थाची घनता किती?", "{s} सेमी कडेच्या घनाचे वस्तुमान {m} ग्रॅम आहे. घनता काढा."],
  sen: "Volume of the cube = {s}³ cm³; density = mass ÷ volume = {m} ÷ {s}³ = {ans} g/cm³.",
  shi: "घन का आयतन = {s}³ सेमी³; घनत्व = द्रव्यमान ÷ आयतन = {m} ÷ {s}³ = {ans} ग्राम/सेमी³।",
  smr: "घनाचे आकारमान = {s}³ सेमी³; घनता = वस्तुमान ÷ आकारमान = {m} ÷ {s}³ = {ans} ग्रॅम/सेमी³.",
};
const fSciCubeDen = (tag: string, lvl: number, want: number, r: Range, s: Range) =>
  T(`scicube:${tag}`, lvl, want, [r.n, s.n], SCICUBE, ([i, j]) => {
    const rho = at(r, i!), side = at(s, j!), m = rho * side * side * side;
    return { vars: { s: side, m }, answer: rho, expr: `${m}/(${side}^3)`, decoys: [rho + 1, rho - 1, rho + 2], render: (n) => `${fmt(n)} g/cm³` };
  });

const SCIACCEL: SkinSet = {
  en: ["A force of {f} N acts on a mass of {m} kg. What acceleration does it produce?", "Find the acceleration when {f} N pushes a {m} kg body."],
  hi: ["{m} किग्रा के द्रव्यमान पर {f} न्यूटन का बल लगता है। कितना त्वरण उत्पन्न होगा?", "{f} न्यूटन बल {m} किग्रा के पिंड को धकेलता है। त्वरण निकालिए।"],
  mr: ["{m} किग्रॅ वस्तुमानावर {f} न्यूटन बल कार्य करते. किती त्वरण निर्माण होईल?", "{f} न्यूटन बल {m} किग्रॅ वस्तूला ढकलते. त्वरण काढा."],
  sen: "Acceleration = force ÷ mass = {f} ÷ {m} = {ans} m/s².",
  shi: "त्वरण = बल ÷ द्रव्यमान = {f} ÷ {m} = {ans} मी/से²।",
  smr: "त्वरण = बल ÷ वस्तुमान = {f} ÷ {m} = {ans} मी/से².",
};
const fSciAccel = (tag: string, lvl: number, want: number, m: Range, a: Range) =>
  T(`sciaccel:${tag}`, lvl, want, [m.n, a.n], SCIACCEL, ([i, j]) => {
    const mass = at(m, i!), acc = at(a, j!), f = mass * acc;
    return { vars: { f, m: mass }, answer: acc, expr: `${f}/${mass}`, decoys: [acc + 1, acc + 2, f - mass], render: (n) => `${fmt(n)} m/s²` };
  });

const SCIMASSF: SkinSet = {
  en: ["A force of {f} N gives a body an acceleration of {a} m/s². What is the body's mass?", "Find the mass that {f} N accelerates at {a} m/s²."],
  hi: ["{f} न्यूटन का बल किसी पिंड को {a} मी/से² का त्वरण देता है। पिंड का द्रव्यमान क्या है?", "{f} न्यूटन जिस द्रव्यमान को {a} मी/से² से त्वरित करता है, वह निकालिए।"],
  mr: ["{f} न्यूटन बल एका वस्तूला {a} मी/से² त्वरण देते. वस्तूचे वस्तुमान किती?", "{f} न्यूटन ज्या वस्तुमानाला {a} मी/से² ने त्वरित करते, ते काढा."],
  sen: "Mass = force ÷ acceleration = {f} ÷ {a} = {ans} kg.",
  shi: "द्रव्यमान = बल ÷ त्वरण = {f} ÷ {a} = {ans} किग्रा।",
  smr: "वस्तुमान = बल ÷ त्वरण = {f} ÷ {a} = {ans} किग्रॅ.",
};
const fSciMassF = (tag: string, lvl: number, want: number, a: Range, m: Range) =>
  T(`scimassf:${tag}`, lvl, want, [a.n, m.n], SCIMASSF, ([i, j]) => {
    const acc = at(a, i!), mass = at(m, j!), f = mass * acc;
    return { vars: { f, a: acc }, answer: mass, expr: `${f}/${acc}`, decoys: [mass + 2, mass - 1, f - acc], render: (n) => `${fmt(n)} kg` };
  });

const SCINET: SkinSet = {
  en: [
    "A {m} kg cart is pushed forward with {f1} N while friction pulls back with {f2} N. What is the cart's acceleration?",
    "Forces of {f1} N forward and {f2} N backward act on a {m} kg body. Find its acceleration.",
  ],
  hi: [
    "{m} किग्रा की गाड़ी को {f1} न्यूटन से आगे धकेला जाता है और घर्षण {f2} न्यूटन से पीछे खींचता है। गाड़ी का त्वरण क्या है?",
    "{m} किग्रा के पिंड पर {f1} न्यूटन आगे और {f2} न्यूटन पीछे बल लगते हैं। त्वरण निकालिए।",
  ],
  mr: [
    "{m} किग्रॅ ची गाडी {f1} न्यूटन बलाने पुढे ढकलली जाते आणि घर्षण {f2} न्यूटनने मागे ओढते. गाडीचे त्वरण किती?",
    "{m} किग्रॅ वस्तूवर {f1} न्यूटन पुढे व {f2} न्यूटन मागे बले कार्य करतात. त्वरण काढा.",
  ],
  sen: "Net force = {f1} − {f2}; acceleration = net force ÷ mass = ({f1} − {f2}) ÷ {m} = {ans} m/s².",
  shi: "परिणामी बल = {f1} − {f2}; त्वरण = परिणामी बल ÷ द्रव्यमान = ({f1} − {f2}) ÷ {m} = {ans} मी/से²।",
  smr: "निव्वळ बल = {f1} − {f2}; त्वरण = निव्वळ बल ÷ वस्तुमान = ({f1} − {f2}) ÷ {m} = {ans} मी/से².",
};
const fSciNet = (tag: string, lvl: number, want: number, m: Range, a: Range, f2r: Range) =>
  T(`scinet:${tag}`, lvl, want, [m.n, a.n, f2r.n], SCINET, ([i, j, k]) => {
    const mass = at(m, i!), acc = at(a, j!), f2 = at(f2r, k!), f1 = mass * acc + f2;
    return { vars: { m: mass, f1, f2 }, answer: acc, expr: `(${f1}-${f2})/${mass}`, decoys: [acc + 1, acc + 2, f1 - f2], render: (n) => `${fmt(n)} m/s²` };
  });

const SCITENSION: SkinSet = {
  en: [
    "A crane cable lifts a {m} kg crate upward with acceleration {a} m/s². Taking g = 10 m/s², what is the tension in the cable?",
    "A lift cable pulls a {m} kg load up at {a} m/s² (g = 10 m/s²). Find the cable tension.",
  ],
  hi: [
    "क्रेन की केबल {m} किग्रा के बक्से को {a} मी/से² के त्वरण से ऊपर उठाती है। g = 10 मी/से² लेकर केबल में तनाव निकालिए।",
    "लिफ़्ट की केबल {m} किग्रा का भार {a} मी/से² से ऊपर खींचती है (g = 10 मी/से²)। केबल का तनाव क्या है?",
  ],
  mr: [
    "क्रेनची केबल {m} किग्रॅ चे खोके {a} मी/से² त्वरणाने वर उचलते. g = 10 मी/से² घेऊन केबलमधील ताण काढा.",
    "लिफ्टची केबल {m} किग्रॅ चे वजन {a} मी/से² ने वर ओढते (g = 10 मी/से²). केबलचा ताण किती?",
  ],
  sen: "Tension must beat gravity and accelerate the load: T = m × (g + a) = {m} × (10 + {a}) = {ans} N.",
  shi: "तनाव को गुरुत्व हराकर भार को त्वरित करना है: T = m × (g + a) = {m} × (10 + {a}) = {ans} न्यूटन।",
  smr: "ताणाला गुरुत्व जिंकून भार त्वरित करायचा आहे: T = m × (g + a) = {m} × (10 + {a}) = {ans} न्यूटन.",
};
const fSciTension = (tag: string, lvl: number, want: number, m: Range, a: Range) =>
  T(`scitension:${tag}`, lvl, want, [m.n, a.n], SCITENSION, ([i, j]) => {
    const mass = at(m, i!), acc = at(a, j!), t = mass * (10 + acc);
    return { vars: { m: mass, a: acc }, answer: t, expr: `${mass}*(10+${acc})`, decoys: [mass * 10, mass * acc, t + mass], render: (n) => `${fmt(n)} N` };
  });

const SCIMOMENTUM: SkinSet = {
  en: [
    "A {m} kg body speeds up from {u} m/s to {v} m/s in {t} seconds. What constant force acted on it?",
    "In {t} s, a force changes the velocity of a {m} kg object from {u} m/s to {v} m/s. Find the force.",
  ],
  hi: [
    "{m} किग्रा का पिंड {t} सेकंड में {u} मी/से से {v} मी/से हो जाता है। उस पर कितना नियत बल लगा?",
    "{t} सेकंड में एक बल {m} किग्रा की वस्तु का वेग {u} मी/से से {v} मी/से कर देता है। बल निकालिए।",
  ],
  mr: [
    "{m} किग्रॅ ची वस्तू {t} सेकंदांत {u} मी/से वरून {v} मी/से वेग गाठते. तिच्यावर किती स्थिर बल कार्य करत होते?",
    "{t} सेकंदांत एक बल {m} किग्रॅ वस्तूचा वेग {u} मी/से वरून {v} मी/से करते. बल काढा.",
  ],
  sen: "Force = change in momentum ÷ time = {m} × ({v} − {u}) ÷ {t} = {ans} N.",
  shi: "बल = संवेग परिवर्तन ÷ समय = {m} × ({v} − {u}) ÷ {t} = {ans} न्यूटन।",
  smr: "बल = संवेग बदल ÷ वेळ = {m} × ({v} − {u}) ÷ {t} = {ans} न्यूटन.",
};
const fSciMomentum = (tag: string, lvl: number, want: number, m: Range, u: Range, tR: Range, kR: Range) =>
  T(`scimom:${tag}`, lvl, want, [m.n, u.n, tR.n, kR.n], SCIMOMENTUM, ([i, j, k, l]) => {
    const mass = at(m, i!), u0 = at(u, j!), t = at(tR, k!), gain = at(kR, l!);
    const v = u0 + t * gain, f = mass * gain;
    return { vars: { m: mass, u: u0, v, t }, answer: f, expr: `${mass}*(${v}-${u0})/${t}`, decoys: [f + mass, mass * v, f + gain], render: (n) => `${fmt(n)} N` };
  });

const SCICURRENT: SkinSet = {
  en: ["A {v} V battery drives current through a {r} Ω resistor. How much current flows?", "Find the current when {v} V is applied across {r} Ω."],
  hi: ["{v} वोल्ट की बैटरी {r} ओम के प्रतिरोध से धारा भेजती है। कितनी धारा बहेगी?", "{r} ओम पर {v} वोल्ट लगाने पर धारा निकालिए।"],
  mr: ["{v} व्होल्टची बॅटरी {r} ओम रोधातून धारा पाठवते. किती धारा वाहील?", "{r} ओमवर {v} व्होल्ट लावल्यास धारा काढा."],
  sen: "Ohm's law: I = V ÷ R = {v} ÷ {r} = {ans} A.",
  shi: "ओम का नियम: I = V ÷ R = {v} ÷ {r} = {ans} ऐम्पियर।",
  smr: "ओमचा नियम: I = V ÷ R = {v} ÷ {r} = {ans} अँपिअर.",
};
const fSciCurrent = (tag: string, lvl: number, want: number, r: Range, iR: Range) =>
  T(`scicurrent:${tag}`, lvl, want, [r.n, iR.n], SCICURRENT, ([i, j]) => {
    const res = at(r, i!), cur = at(iR, j!), v = res * cur;
    return { vars: { v, r: res }, answer: cur, expr: `${v}/${res}`, decoys: [cur + 1, cur + 2, v - res], render: (n) => `${fmt(n)} A` };
  });

const SCIRES: SkinSet = {
  en: ["A potential difference of {v} V pushes {i} A through a resistor. What is its resistance?", "Find R when V = {v} V and I = {i} A."],
  hi: ["{v} वोल्ट का विभवांतर {i} ऐम्पियर धारा भेजता है। प्रतिरोध क्या है?", "V = {v} V और I = {i} A हो तो R निकालिए।"],
  mr: ["{v} व्होल्टचे विभवांतर {i} अँपिअर धारा पाठवते. रोध किती?", "V = {v} V आणि I = {i} A असता R काढा."],
  sen: "Ohm's law: R = V ÷ I = {v} ÷ {i} = {ans} Ω.",
  shi: "ओम का नियम: R = V ÷ I = {v} ÷ {i} = {ans} ओम।",
  smr: "ओमचा नियम: R = V ÷ I = {v} ÷ {i} = {ans} ओम.",
};
const fSciRes = (tag: string, lvl: number, want: number, iR: Range, rR: Range) =>
  T(`scires:${tag}`, lvl, want, [iR.n, rR.n], SCIRES, ([i, j]) => {
    const cur = at(iR, i!), res = at(rR, j!), v = res * cur;
    return { vars: { v, i: cur }, answer: res, expr: `${v}/${cur}`, decoys: [res + 2, res - 1, v - cur], render: (n) => `${fmt(n)} Ω` };
  });

const SCISERIES: SkinSet = {
  en: [
    "Resistors of {r1} Ω and {r2} Ω are in series across a {v} V supply. What current flows in the circuit?",
    "A {v} V battery is connected to {r1} Ω and {r2} Ω joined in series. Find the current.",
  ],
  hi: [
    "{r1} ओम और {r2} ओम के प्रतिरोध श्रेणीक्रम में {v} वोल्ट से जुड़े हैं। परिपथ में कितनी धारा बहेगी?",
    "{v} वोल्ट की बैटरी श्रेणीक्रम में जुड़े {r1} ओम और {r2} ओम से जुड़ी है। धारा निकालिए।",
  ],
  mr: [
    "{r1} ओम आणि {r2} ओम रोध एकसर जोडणीत {v} व्होल्टला जोडले आहेत. परिपथात किती धारा वाहील?",
    "{v} व्होल्टची बॅटरी एकसर जोडलेल्या {r1} ओम व {r2} ओमला जोडली आहे. धारा काढा.",
  ],
  sen: "In series the resistances add: R = {r1} + {r2}; then I = V ÷ R = {v} ÷ ({r1} + {r2}) = {ans} A.",
  shi: "श्रेणीक्रम में प्रतिरोध जुड़ते हैं: R = {r1} + {r2}; फिर I = V ÷ R = {v} ÷ ({r1} + {r2}) = {ans} ऐम्पियर।",
  smr: "एकसर जोडणीत रोध मिळवतात: R = {r1} + {r2}; मग I = V ÷ R = {v} ÷ ({r1} + {r2}) = {ans} अँपिअर.",
};
const fSciSeries = (tag: string, lvl: number, want: number, r1R: Range, r2R: Range, iR: Range) =>
  T(`sciseries:${tag}`, lvl, want, [r1R.n, r2R.n, iR.n], SCISERIES, ([i, j, k]) => {
    const r1 = at(r1R, i!), r2 = at(r2R, j!), cur = at(iR, k!), v = cur * (r1 + r2);
    return { vars: { r1, r2, v }, answer: cur, expr: `${v}/(${r1}+${r2})`, decoys: [cur + 1, cur + 2, v - r1 - r2], render: (n) => `${fmt(n)} A` };
  });

const SCIPOWER2: SkinSet = {
  en: ["A current of {i} A flows through a {r} Ω resistor. How much power is dissipated?", "Find the power lost as heat in {r} Ω carrying {i} A."],
  hi: ["{r} ओम के प्रतिरोध से {i} ऐम्पियर धारा बहती है। कितनी शक्ति व्यय होती है?", "{i} ऐम्पियर धारा वाले {r} ओम में ऊष्मा रूप में खोई शक्ति निकालिए।"],
  mr: ["{r} ओम रोधातून {i} अँपिअर धारा वाहते. किती शक्ती खर्च होते?", "{i} अँपिअर धारा वाहणाऱ्या {r} ओममध्ये उष्णतेच्या रूपात जाणारी शक्ती काढा."],
  sen: "Power = I² × R = {i}² × {r} = {ans} W.",
  shi: "शक्ति = I² × R = {i}² × {r} = {ans} वाट।",
  smr: "शक्ती = I² × R = {i}² × {r} = {ans} वॅट.",
};
const fSciPowerI2R = (tag: string, lvl: number, want: number, r: Range, iR: Range) =>
  T(`scip2r:${tag}`, lvl, want, [r.n, iR.n], SCIPOWER2, ([i, j]) => {
    const res = at(r, i!), cur = at(iR, j!), p = cur * cur * res;
    return { vars: { i: cur, r: res }, answer: p, expr: `(${cur}^2)*${res}`, decoys: [cur * res, p + res, p - cur], render: (n) => `${fmt(n)} W` };
  });

const SCICOST: SkinSet = {
  en: [
    "A {p} W appliance runs {h} hours a day for {d} days. At ₹{c} per kWh, what is the electricity bill?",
    "Running a {p} W device for {h} hours daily over {d} days, with energy at ₹{c} per unit, costs how much?",
  ],
  hi: [
    "{p} वाट का उपकरण {d} दिनों तक रोज़ {h} घंटे चलता है। ₹{c} प्रति यूनिट की दर से बिजली का बिल कितना होगा?",
    "{p} वाट का यंत्र {d} दिनों तक प्रतिदिन {h} घंटे चलाने पर, ₹{c} प्रति यूनिट की दर से, कितना खर्च आएगा?",
  ],
  mr: [
    "{p} वॅटचे उपकरण {d} दिवस रोज {h} तास चालते. ₹{c} प्रति युनिट दराने विजेचे बिल किती येईल?",
    "{p} वॅटचे यंत्र {d} दिवस दररोज {h} तास चालवल्यास, ₹{c} प्रति युनिट दराने, किती खर्च येईल?",
  ],
  sen: "Energy = {p} W × {h} h × {d} days ÷ 1000 = {u} kWh; bill = {u} × ₹{c} = ₹{ans}.",
  shi: "ऊर्जा = {p} वाट × {h} घंटे × {d} दिन ÷ 1000 = {u} यूनिट; बिल = {u} × ₹{c} = ₹{ans}।",
  smr: "ऊर्जा = {p} वॅट × {h} तास × {d} दिवस ÷ 1000 = {u} युनिट; बिल = {u} × ₹{c} = ₹{ans}.",
};
const SCICOST_DAYS = [10, 20, 30];
const fSciEnergyCost = (tag: string, lvl: number, want: number, pR: Range, hR: Range, cR: Range) =>
  T(`scicost:${tag}`, lvl, want, [pR.n, hR.n, SCICOST_DAYS.length, cR.n], SCICOST, ([i, j, k, l]) => {
    const p100 = at(pR, i!), h = at(hR, j!), d = SCICOST_DAYS[k!]!, c = at(cR, l!);
    const p = 100 * p100, units = (p * h * d) / 1000, cost = units * c;
    return { vars: { p, h, d, c, u: units }, answer: cost, expr: `${p}*${h}*${d}/1000*${c}`, decoys: [units, cost + c, cost - units], render: rupees };
  });

const SCIENERGYW: SkinSet = {
  en: ["A machine works at a steady {p} W for {t} seconds. How much energy does it deliver?", "How much work does a {p} W motor do in {t} seconds?"],
  hi: ["एक मशीन {t} सेकंड तक {p} वाट पर काम करती है। वह कितनी ऊर्जा देती है?", "{p} वाट की मोटर {t} सेकंड में कितना कार्य करती है?"],
  mr: ["एक यंत्र {t} सेकंद {p} वॅटवर काम करते. ते किती ऊर्जा देते?", "{p} वॅटची मोटर {t} सेकंदांत किती कार्य करते?"],
  sen: "Energy = power × time = {p} × {t} = {ans} J.",
  shi: "ऊर्जा = शक्ति × समय = {p} × {t} = {ans} जूल।",
  smr: "ऊर्जा = शक्ती × वेळ = {p} × {t} = {ans} ज्यूल.",
};
const fSciEnergyW = (tag: string, lvl: number, want: number, pR: Range, tR: Range) =>
  T(`scienergyw:${tag}`, lvl, want, [pR.n, tR.n], SCIENERGYW, ([i, j]) => {
    const p = at(pR, i!), t = at(tR, j!), w = p * t;
    return { vars: { p, t }, answer: w, expr: `${p}*${t}`, decoys: [w + p, w - t, p + t], render: (n) => `${fmt(n)} J` };
  });

const SCIPE: SkinSet = {
  en: ["A {m} kg mass is lifted to a height of {h} m. Taking g = 10 m/s², what potential energy does it gain?", "Find the potential energy of {m} kg raised {h} m (g = 10 m/s²)."],
  hi: ["{m} किग्रा का द्रव्यमान {h} मीटर ऊँचाई तक उठाया जाता है। g = 10 मी/से² लेकर स्थितिज ऊर्जा निकालिए।", "{h} मीटर ऊपर उठाए गए {m} किग्रा की स्थितिज ऊर्जा क्या है? (g = 10 मी/से²)"],
  mr: ["{m} किग्रॅ वस्तुमान {h} मीटर उंचीवर उचलले जाते. g = 10 मी/से² घेऊन स्थितिज ऊर्जा काढा.", "{h} मीटर वर उचललेल्या {m} किग्रॅ ची स्थितिज ऊर्जा किती? (g = 10 मी/से²)"],
  sen: "Potential energy = m × g × h = {m} × 10 × {h} = {ans} J.",
  shi: "स्थितिज ऊर्जा = m × g × h = {m} × 10 × {h} = {ans} जूल।",
  smr: "स्थितिज ऊर्जा = m × g × h = {m} × 10 × {h} = {ans} ज्यूल.",
};
const fSciPE = (tag: string, lvl: number, want: number, m: Range, h: Range) =>
  T(`scipe:${tag}`, lvl, want, [m.n, h.n], SCIPE, ([i, j]) => {
    const mass = at(m, i!), ht = at(h, j!), pe = mass * 10 * ht;
    return { vars: { m: mass, h: ht }, answer: pe, expr: `${mass}*10*${ht}`, decoys: [mass * ht, pe + 10, pe - mass], render: (n) => `${fmt(n)} J` };
  });

const SCIKE: SkinSet = {
  en: ["A {m} kg object moves at {v} m/s. What is its kinetic energy?", "Find the kinetic energy of a {m} kg body travelling at {v} m/s."],
  hi: ["{m} किग्रा की वस्तु {v} मी/से से चलती है। उसकी गतिज ऊर्जा क्या है?", "{v} मी/से से चलते {m} किग्रा के पिंड की गतिज ऊर्जा निकालिए।"],
  mr: ["{m} किग्रॅ ची वस्तू {v} मी/से वेगाने जाते. तिची गतिज ऊर्जा किती?", "{v} मी/से वेगाने जाणाऱ्या {m} किग्रॅ वस्तूची गतिज ऊर्जा काढा."],
  sen: "Kinetic energy = ½ × m × v² = ½ × {m} × {v}² = {ans} J.",
  shi: "गतिज ऊर्जा = ½ × m × v² = ½ × {m} × {v}² = {ans} जूल।",
  smr: "गतिज ऊर्जा = ½ × m × v² = ½ × {m} × {v}² = {ans} ज्यूल.",
};
const fSciKE = (tag: string, lvl: number, want: number, jR: Range, v: Range) =>
  T(`scike:${tag}`, lvl, want, [jR.n, v.n], SCIKE, ([i, j]) => {
    const half = at(jR, i!), m = 2 * half, vel = at(v, j!), ke = half * vel * vel;
    return { vars: { m, v: vel }, answer: ke, expr: `${m}*(${vel}^2)/2`, decoys: [m * vel, ke * 2, ke + vel], render: (n) => `${fmt(n)} J` };
  });

const SCIPUMP: SkinSet = {
  en: [
    "A pump raises {m} kg of water to a height of {h} m in {t} seconds. Taking g = 10 m/s², what is the pump's power?",
    "A motor lifts {m} kg through {h} m in {t} s (g = 10 m/s²). Find its power.",
  ],
  hi: [
    "एक पंप {t} सेकंड में {m} किग्रा पानी {h} मीटर ऊँचाई तक चढ़ाता है। g = 10 मी/से² लेकर पंप की शक्ति निकालिए।",
    "एक मोटर {t} सेकंड में {m} किग्रा को {h} मीटर उठाती है (g = 10 मी/से²)। उसकी शक्ति क्या है?",
  ],
  mr: [
    "एक पंप {t} सेकंदांत {m} किग्रॅ पाणी {h} मीटर उंचीवर चढवतो. g = 10 मी/से² घेऊन पंपाची शक्ती काढा.",
    "एक मोटर {t} सेकंदांत {m} किग्रॅ वजन {h} मीटर उचलते (g = 10 मी/से²). तिची शक्ती किती?",
  ],
  sen: "Work = m × g × h = {m} × 10 × {h} J; power = work ÷ time = {m} × 10 × {h} ÷ {t} = {ans} W.",
  shi: "कार्य = m × g × h = {m} × 10 × {h} जूल; शक्ति = कार्य ÷ समय = {m} × 10 × {h} ÷ {t} = {ans} वाट।",
  smr: "कार्य = m × g × h = {m} × 10 × {h} ज्यूल; शक्ती = कार्य ÷ वेळ = {m} × 10 × {h} ÷ {t} = {ans} वॅट.",
};
const fSciPump = (tag: string, lvl: number, want: number, tR: Range, jR: Range, h: Range) =>
  T(`scipump:${tag}`, lvl, want, [tR.n, jR.n, h.n], SCIPUMP, ([i, j, k]) => {
    const t = at(tR, i!), m = t * at(jR, j!), ht = at(h, k!), p = (m * 10 * ht) / t;
    return { vars: { m, h: ht, t }, answer: p, expr: `${m}*10*${ht}/${t}`, decoys: [p * t, p + ht, p - 10], render: (n) => `${fmt(n)} W` };
  });

const SCIFC2: SkinSet = {
  en: ["A furnace gauge reads {f}°F. What is that in Celsius?", "Convert {f}°F to °C."],
  hi: ["भट्टी का मापक {f}°F दिखाता है। सेल्सियस में यह कितना है?", "{f}°F को °C में बदलिए।"],
  mr: ["भट्टीचे मापक {f}°F दाखवते. सेल्सिअसमध्ये ते किती?", "{f}°F चे °C मध्ये रूपांतर करा."],
  sen: "°C = ({f} − 32) × 5 ÷ 9 = {ans}°C.",
  shi: "°C = ({f} − 32) × 5 ÷ 9 = {ans}°C।",
  smr: "°C = ({f} − 32) × 5 ÷ 9 = {ans}°C.",
};
const fSciFC = (tag: string, lvl: number, want: number, c5: Range) =>
  T(`scifc:${tag}`, lvl, want, [c5.n], SCIFC2, ([i]) => {
    const c = 5 * at(c5, i!), f = (9 * c) / 5 + 32;
    return { vars: { f }, answer: c, expr: `(${f}-32)*5/9`, decoys: [c + 5, c - 5, f - 32], render: (n) => `${fmt(n)}°C` };
  });

const SCIHEATM: SkinSet = {
  en: ["Absorbing {q} J of heat warms a sample of specific heat {c} J/kg·°C by {dt}°C. What is the sample's mass?"],
  hi: ["{q} जूल ऊष्मा लेकर, {c} जूल/किग्रा·°C विशिष्ट ऊष्मा वाला नमूना {dt}°C गर्म होता है। नमूने का द्रव्यमान क्या है?"],
  mr: ["{q} ज्यूल उष्णता घेऊन, {c} ज्यूल/किग्रॅ·°C विशिष्ट उष्मा असलेला नमुना {dt}°C ने तापतो. नमुन्याचे वस्तुमान किती?"],
  sen: "From Q = m × c × ΔT: m = Q ÷ (c × ΔT) = {q} ÷ ({c} × {dt}) = {ans} kg.",
  shi: "Q = m × c × ΔT से: m = Q ÷ (c × ΔT) = {q} ÷ ({c} × {dt}) = {ans} किग्रा।",
  smr: "Q = m × c × ΔT वरून: m = Q ÷ (c × ΔT) = {q} ÷ ({c} × {dt}) = {ans} किग्रॅ.",
};
const fSciHeatM = (tag: string, lvl: number, want: number, m: Range, dt: Range) =>
  T(`sciheatm:${tag}`, lvl, want, [m.n, dt.n, HEAT_C.length], SCIHEATM, ([i, j, k]) => {
    const mass = at(m, i!), delta = at(dt, j!), c = HEAT_C[k!]!, q = mass * c * delta;
    return { vars: { q, c, dt: delta }, answer: mass, expr: `${q}/(${c}*${delta})`, decoys: [mass + 1, mass + 2, mass * delta], render: (n) => `${fmt(n)} kg` };
  });

const SCIHEATT: SkinSet = {
  en: ["A {m} kg sample of specific heat {c} J/kg·°C absorbs {q} J. By how many degrees does its temperature rise?"],
  hi: ["{c} जूल/किग्रा·°C विशिष्ट ऊष्मा वाला {m} किग्रा का नमूना {q} जूल लेता है। तापमान कितने डिग्री बढ़ेगा?"],
  mr: ["{c} ज्यूल/किग्रॅ·°C विशिष्ट उष्मा असलेला {m} किग्रॅ चा नमुना {q} ज्यूल घेतो. तापमान किती अंशांनी वाढेल?"],
  sen: "From Q = m × c × ΔT: ΔT = Q ÷ (m × c) = {q} ÷ ({m} × {c}) = {ans}°C.",
  shi: "Q = m × c × ΔT से: ΔT = Q ÷ (m × c) = {q} ÷ ({m} × {c}) = {ans}°C।",
  smr: "Q = m × c × ΔT वरून: ΔT = Q ÷ (m × c) = {q} ÷ ({m} × {c}) = {ans}°C.",
};
const fSciHeatT = (tag: string, lvl: number, want: number, m: Range, dt: Range) =>
  T(`sciheatt:${tag}`, lvl, want, [m.n, dt.n, HEAT_C.length], SCIHEATT, ([i, j, k]) => {
    const mass = at(m, i!), delta = at(dt, j!), c = HEAT_C[k!]!, q = mass * c * delta;
    return { vars: { q, c, m: mass }, answer: delta, expr: `${q}/(${mass}*${c})`, decoys: [delta + 5, delta - 2, delta * 2], render: (n) => `${fmt(n)}°C` };
  });

const MOLAR_MASSES = [2, 4, 12, 14, 16, 18, 28, 32, 44, 64];
const SCIMOLMASS: SkinSet = {
  en: ["What is the mass of {n} moles of a substance whose molar mass is {M} g/mol?", "Find the mass of {n} mol of a compound with molar mass {M} g/mol."],
  hi: ["{M} ग्राम/मोल मोलर द्रव्यमान वाले पदार्थ के {n} मोल का द्रव्यमान क्या है?", "{M} ग्राम/मोल वाले यौगिक के {n} मोल का द्रव्यमान निकालिए।"],
  mr: ["{M} ग्रॅम/मोल मोलर वस्तुमान असलेल्या पदार्थाच्या {n} मोलचे वस्तुमान किती?", "{M} ग्रॅम/मोल असलेल्या संयुगाच्या {n} मोलचे वस्तुमान काढा."],
  sen: "Mass = moles × molar mass = {n} × {M} = {ans} g.",
  shi: "द्रव्यमान = मोल × मोलर द्रव्यमान = {n} × {M} = {ans} ग्राम।",
  smr: "वस्तुमान = मोल × मोलर वस्तुमान = {n} × {M} = {ans} ग्रॅम.",
};
const fSciMolesMass = (tag: string, lvl: number, want: number, n: Range) =>
  T(`scimolmass:${tag}`, lvl, want, [n.n, MOLAR_MASSES.length], SCIMOLMASS, ([i, j]) => {
    const mol = at(n, i!), M = MOLAR_MASSES[j!]!, m = mol * M;
    return { vars: { n: mol, M }, answer: m, expr: `${mol}*${M}`, decoys: [m + M, m - mol, mol + M], render: (n2) => `${fmt(n2)} g` };
  });

const SCIMOLARM: SkinSet = {
  en: ["{m} g of a substance is exactly {n} moles. What is its molar mass?", "If {n} mol of a compound weighs {m} g, find the molar mass."],
  hi: ["किसी पदार्थ के {m} ग्राम ठीक {n} मोल हैं। उसका मोलर द्रव्यमान क्या है?", "यदि यौगिक के {n} मोल का द्रव्यमान {m} ग्राम है, तो मोलर द्रव्यमान निकालिए।"],
  mr: ["एका पदार्थाचे {m} ग्रॅम म्हणजे नेमके {n} मोल आहेत. त्याचे मोलर वस्तुमान किती?", "संयुगाच्या {n} मोलचे वस्तुमान {m} ग्रॅम असल्यास मोलर वस्तुमान काढा."],
  sen: "Molar mass = mass ÷ moles = {m} ÷ {n} = {ans} g/mol.",
  shi: "मोलर द्रव्यमान = द्रव्यमान ÷ मोल = {m} ÷ {n} = {ans} ग्राम/मोल।",
  smr: "मोलर वस्तुमान = वस्तुमान ÷ मोल = {m} ÷ {n} = {ans} ग्रॅम/मोल.",
};
const fSciMolarM = (tag: string, lvl: number, want: number, n: Range) =>
  T(`scimolarm:${tag}`, lvl, want, [n.n, MOLAR_MASSES.length], SCIMOLARM, ([i, j]) => {
    const mol = at(n, i!), M = MOLAR_MASSES[j!]!, m = mol * M;
    return { vars: { m, n: mol }, answer: M, expr: `${m}/${mol}`, decoys: [M + 2, M - 2, m - mol], render: (n2) => `${fmt(n2)} g/mol` };
  });

const SCIHYDRO: SkinSet = {
  en: [
    "A molecule has {x} carbon atoms and {y} hydrogen atoms (C = 12, H = 1). What is the mass of {n} moles of the compound?",
    "For a compound C{x}H{y} (atomic masses C = 12, H = 1), find the mass of {n} mol.",
  ],
  hi: [
    "एक अणु में {x} कार्बन और {y} हाइड्रोजन परमाणु हैं (C = 12, H = 1)। यौगिक के {n} मोल का द्रव्यमान क्या है?",
    "यौगिक C{x}H{y} (परमाणु द्रव्यमान C = 12, H = 1) के {n} मोल का द्रव्यमान निकालिए।",
  ],
  mr: [
    "एका रेणूत {x} कार्बन आणि {y} हायड्रोजन अणू आहेत (C = 12, H = 1). संयुगाच्या {n} मोलचे वस्तुमान किती?",
    "C{x}H{y} या संयुगाच्या (अणुवस्तुमान C = 12, H = 1) {n} मोलचे वस्तुमान काढा.",
  ],
  sen: "Molar mass = 12 × {x} + 1 × {y} = {M} g/mol; mass = {n} × {M} = {ans} g.",
  shi: "मोलर द्रव्यमान = 12 × {x} + 1 × {y} = {M} ग्राम/मोल; द्रव्यमान = {n} × {M} = {ans} ग्राम।",
  smr: "मोलर वस्तुमान = 12 × {x} + 1 × {y} = {M} ग्रॅम/मोल; वस्तुमान = {n} × {M} = {ans} ग्रॅम.",
};
const fSciMolesCompound = (tag: string, lvl: number, want: number, x: Range, y: Range, n: Range) =>
  T(`scihydro:${tag}`, lvl, want, [x.n, y.n, n.n], SCIHYDRO, ([i, j, k]) => {
    const cx = at(x, i!), hy = at(y, j!), mol = at(n, k!);
    const M = 12 * cx + hy, m = mol * M;
    return { vars: { x: cx, y: hy, n: mol, M }, answer: m, expr: `${mol}*(12*${cx}+${hy})`, decoys: [m + M, mol * 12 * cx, m - hy], render: (n2) => `${fmt(n2)} g` };
  });

const SCIMOLMIX: SkinSet = {
  en: ["A beaker holds {m1} g of a substance of molar mass {M1} g/mol and {m2} g of another of molar mass {M2} g/mol. How many moles is that in total?"],
  hi: ["एक बीकर में {M1} ग्राम/मोल वाले पदार्थ के {m1} ग्राम और {M2} ग्राम/मोल वाले पदार्थ के {m2} ग्राम हैं। कुल कितने मोल हुए?"],
  mr: ["एका बीकरमध्ये {M1} ग्रॅम/मोल असलेल्या पदार्थाचे {m1} ग्रॅम आणि {M2} ग्रॅम/मोल असलेल्याचे {m2} ग्रॅम आहेत. एकूण किती मोल?"],
  sen: "Moles = {m1} ÷ {M1} + {m2} ÷ {M2} = {n1} + {n2} = {ans} mol.",
  shi: "मोल = {m1} ÷ {M1} + {m2} ÷ {M2} = {n1} + {n2} = {ans} मोल।",
  smr: "मोल = {m1} ÷ {M1} + {m2} ÷ {M2} = {n1} + {n2} = {ans} मोल.",
};
const fSciMolesMix = (tag: string, lvl: number, want: number, n1: Range, n2: Range) =>
  T(`scimolmix:${tag}`, lvl, want, [n1.n, n2.n, MOLAR_MASSES.length, MOLAR_MASSES.length - 1], SCIMOLMIX, ([i, j, k, l]) => {
    const a = at(n1, i!), b = at(n2, j!), M1 = MOLAR_MASSES[k!]!;
    const M2 = MOLAR_MASSES[l! >= k! ? l! + 1 : l!]!;
    const m1 = a * M1, m2 = b * M2, total = a + b;
    return { vars: { m1, M1, m2, M2, n1: a, n2: b }, answer: total, expr: `${m1}/${M1}+${m2}/${M2}`, decoys: [total + 1, total - 1, m1 + m2], render: (n2r) => `${fmt(n2r)} mol` };
  });

const SCIMOLARITY: SkinSet = {
  en: ["{m} g of a solute of molar mass {M} g/mol is dissolved to make {v} L of solution. What is the molarity?"],
  hi: ["{M} ग्राम/मोल मोलर द्रव्यमान वाले विलेय के {m} ग्राम से {v} लीटर विलयन बनाया गया। मोलरता क्या है?"],
  mr: ["{M} ग्रॅम/मोल मोलर वस्तुमान असलेल्या द्राव्याच्या {m} ग्रॅमपासून {v} लिटर द्रावण बनवले. मोलरता किती?"],
  sen: "Moles = {m} ÷ {M}; molarity = moles ÷ volume = {m} ÷ ({M} × {v}) = {ans} mol/L.",
  shi: "मोल = {m} ÷ {M}; मोलरता = मोल ÷ आयतन = {m} ÷ ({M} × {v}) = {ans} मोल/लीटर।",
  smr: "मोल = {m} ÷ {M}; मोलरता = मोल ÷ आकारमान = {m} ÷ ({M} × {v}) = {ans} मोल/लिटर.",
};
const fSciMolarity = (tag: string, lvl: number, want: number, molR: Range, vR: Range) =>
  T(`scimolarity:${tag}`, lvl, want, [molR.n, vR.n, MOLAR_MASSES.length], SCIMOLARITY, ([i, j, k]) => {
    const conc = at(molR, i!), v = at(vR, j!), M = MOLAR_MASSES[k!]!, m = conc * v * M;
    return { vars: { m, M, v }, answer: conc, expr: `${m}/(${M}*${v})`, decoys: [conc + 1, conc * v, m / M], render: (n) => `${fmt(n)} mol/L` };
  });

const SCIWAVEL: SkinSet = {
  en: ["A wave of speed {v} m/s has frequency {f} Hz. What is its wavelength?", "Find the wavelength when v = {v} m/s and f = {f} Hz."],
  hi: ["{v} मी/से चाल वाली तरंग की आवृत्ति {f} हर्ट्ज़ है। तरंगदैर्घ्य क्या है?", "v = {v} मी/से और f = {f} Hz हो तो तरंगदैर्घ्य निकालिए।"],
  mr: ["{v} मी/से वेगाच्या तरंगाची वारंवारता {f} हर्ट्झ आहे. तरंगलांबी किती?", "v = {v} मी/से आणि f = {f} Hz असता तरंगलांबी काढा."],
  sen: "Wavelength = speed ÷ frequency = {v} ÷ {f} = {ans} m.",
  shi: "तरंगदैर्घ्य = चाल ÷ आवृत्ति = {v} ÷ {f} = {ans} मीटर।",
  smr: "तरंगलांबी = वेग ÷ वारंवारता = {v} ÷ {f} = {ans} मीटर.",
};
const fSciWaveL = (tag: string, lvl: number, want: number, f: Range, l: Range) =>
  T(`sciwavel:${tag}`, lvl, want, [f.n, l.n], SCIWAVEL, ([i, j]) => {
    const freq = at(f, i!), lam = at(l, j!), v = freq * lam;
    return { vars: { v, f: freq }, answer: lam, expr: `${v}/${freq}`, decoys: [lam + 1, lam + 2, v - freq], render: (n) => `${fmt(n)} m` };
  });

const SCIWAVEF: SkinSet = {
  en: ["A wave travels at {v} m/s with wavelength {l} m. What is its frequency?", "Find the frequency when v = {v} m/s and λ = {l} m."],
  hi: ["{v} मी/से से चलती तरंग का तरंगदैर्घ्य {l} मीटर है। आवृत्ति क्या है?", "v = {v} मी/से और λ = {l} m हो तो आवृत्ति निकालिए।"],
  mr: ["{v} मी/से वेगाने जाणाऱ्या तरंगाची तरंगलांबी {l} मीटर आहे. वारंवारता किती?", "v = {v} मी/से आणि λ = {l} m असता वारंवारता काढा."],
  sen: "Frequency = speed ÷ wavelength = {v} ÷ {l} = {ans} Hz.",
  shi: "आवृत्ति = चाल ÷ तरंगदैर्घ्य = {v} ÷ {l} = {ans} हर्ट्ज़।",
  smr: "वारंवारता = वेग ÷ तरंगलांबी = {v} ÷ {l} = {ans} हर्ट्झ.",
};
const fSciWaveF = (tag: string, lvl: number, want: number, f: Range, l: Range) =>
  T(`sciwavef:${tag}`, lvl, want, [f.n, l.n], SCIWAVEF, ([i, j]) => {
    const freq = at(f, i!), lam = at(l, j!), v = freq * lam;
    return { vars: { v, l: lam }, answer: freq, expr: `${v}/${lam}`, decoys: [freq + 2, freq - 1, v - lam], render: (n) => `${fmt(n)} Hz` };
  });

const SCIVIB: SkinSet = {
  en: ["A tuning fork vibrates at {f} Hz. How long does it take to complete {n} vibrations?", "At {f} vibrations per second, how many seconds do {n} vibrations take?"],
  hi: ["एक स्वरित्र {f} हर्ट्ज़ पर कंपन करता है। {n} कंपन पूरे करने में कितना समय लगेगा?", "{f} कंपन प्रति सेकंड की दर से {n} कंपन में कितने सेकंड लगेंगे?"],
  mr: ["एक स्वरकाटा {f} हर्ट्झवर कंप पावतो. {n} कंपने पूर्ण करण्यास किती वेळ लागेल?", "{f} कंपने प्रति सेकंद या दराने {n} कंपनांना किती सेकंद लागतील?"],
  sen: "Time = vibrations ÷ frequency = {n} ÷ {f} = {ans} s.",
  shi: "समय = कंपन ÷ आवृत्ति = {n} ÷ {f} = {ans} सेकंड।",
  smr: "वेळ = कंपने ÷ वारंवारता = {n} ÷ {f} = {ans} सेकंद.",
};
const fSciWaveCount = (tag: string, lvl: number, want: number, f: Range, kR: Range) =>
  T(`scivib:${tag}`, lvl, want, [f.n, kR.n], SCIVIB, ([i, j]) => {
    const freq = at(f, i!), t = at(kR, j!), n = freq * t;
    return { vars: { f: freq, n }, answer: t, expr: `${n}/${freq}`, decoys: [t + 1, t + 2, n - freq], render: (n2) => `${fmt(n2)} s` };
  });

const SCIECHO: SkinSet = {
  en: [
    "A cliff stands {d} m away and sound travels at {v} m/s. After a shout, when does the echo return?",
    "Sound moving at {v} m/s reflects off a wall {d} m away. Find the time for the echo to come back.",
  ],
  hi: [
    "चट्टान {d} मीटर दूर है और ध्वनि {v} मी/से से चलती है। चीखने के बाद प्रतिध्वनि कब लौटेगी?",
    "{v} मी/से से चलती ध्वनि {d} मीटर दूर दीवार से टकराती है। प्रतिध्वनि लौटने का समय निकालिए।",
  ],
  mr: [
    "कडा {d} मीटर दूर आहे आणि ध्वनी {v} मी/से वेगाने जातो. ओरडल्यानंतर प्रतिध्वनी केव्हा परत येईल?",
    "{v} मी/से वेगाचा ध्वनी {d} मीटर दूरच्या भिंतीवरून परावर्तित होतो. प्रतिध्वनी परत येण्याचा वेळ काढा.",
  ],
  sen: "The sound goes there and back: time = 2 × {d} ÷ {v} = {ans} s.",
  shi: "ध्वनि जाकर लौटती है: समय = 2 × {d} ÷ {v} = {ans} सेकंड।",
  smr: "ध्वनी जाऊन परत येतो: वेळ = 2 × {d} ÷ {v} = {ans} सेकंद.",
};
const ECHO_V = [300, 320, 340, 350];
const fSciEcho = (tag: string, lvl: number, want: number, jR: Range) =>
  T(`sciecho:${tag}`, lvl, want, [jR.n, ECHO_V.length], SCIECHO, ([i, j]) => {
    const k = at(jR, i!), v = ECHO_V[j!]!, d = v * k, t = 2 * k;
    return { vars: { d, v }, answer: t, expr: `2*${d}/${v}`, decoys: [k, t + 1, t * 2], render: (n) => `${fmt(n)} s` };
  });

const SCISONAR: SkinSet = {
  en: [
    "A ship's sonar pulse travels at {v} m/s and returns from the seabed after {t} seconds. How deep is the sea there?",
    "A sonar ping ({v} m/s in water) echoes back in {t} s. Find the depth.",
  ],
  hi: [
    "जहाज़ की सोनार तरंग {v} मी/से से चलती है और {t} सेकंड बाद समुद्रतल से लौटती है। वहाँ समुद्र कितना गहरा है?",
    "सोनार संकेत (पानी में {v} मी/से) {t} सेकंड में लौटता है। गहराई निकालिए।",
  ],
  mr: [
    "जहाजाची सोनार तरंग {v} मी/से वेगाने जाते आणि {t} सेकंदांनी समुद्रतळावरून परत येते. तिथे समुद्र किती खोल आहे?",
    "सोनार संदेश (पाण्यात {v} मी/से) {t} सेकंदांत परत येतो. खोली काढा.",
  ],
  sen: "The pulse covers twice the depth: depth = {v} × {t} ÷ 2 = {ans} m.",
  shi: "तरंग दुगनी गहराई तय करती है: गहराई = {v} × {t} ÷ 2 = {ans} मीटर।",
  smr: "तरंग दुप्पट खोली कापते: खोली = {v} × {t} ÷ 2 = {ans} मीटर.",
};
const SONAR_V = [1400, 1450, 1500];
const fSciSonar = (tag: string, lvl: number, want: number, kR: Range) =>
  T(`scisonar:${tag}`, lvl, want, [kR.n, SONAR_V.length], SCISONAR, ([i, j]) => {
    const k = at(kR, i!), v = SONAR_V[j!]!, t = 2 * k, d = v * k;
    return { vars: { v, t }, answer: d, expr: `${v}*${t}/2`, decoys: [v * t, d / 2, d + v], render: (n) => `${fmt(n)} m` };
  });

/* --------------------------------------------------------------------------
   Geography — computable map and population arithmetic.
   -------------------------------------------------------------------------- */

const fGeoScale = (tag: string, lvl: number, want: number, n: Range, cm: Range) =>
  T(
    `geoscale:${tag}`,
    lvl,
    want,
    [n.n, cm.n],
    {
      en: ["On a map, 1 cm stands for {n} km. Two towns are {cm} cm apart on it. What is the real distance?", "A map's scale is 1 cm : {n} km. What real distance is {cm} cm on the map?"],
      hi: ["नक्शे पर 1 सेमी {n} किमी दर्शाता है। दो कस्बे नक्शे पर {cm} सेमी दूर हैं। वास्तविक दूरी क्या है?", "नक्शे का पैमाना 1 सेमी : {n} किमी है। नक्शे पर {cm} सेमी कितनी वास्तविक दूरी है?"],
      mr: ["नकाशावर 1 सेमी म्हणजे {n} किमी. दोन गावे नकाशावर {cm} सेमी अंतरावर आहेत. खरे अंतर किती?", "नकाशाचे प्रमाण 1 सेमी : {n} किमी आहे. नकाशावरील {cm} सेमी म्हणजे किती खरे अंतर?"],
      sen: "Real distance = map distance × scale = {cm} × {n} = {ans} km.",
      shi: "वास्तविक दूरी = नक्शे की दूरी × पैमाना = {cm} × {n} = {ans} किमी।",
      smr: "खरे अंतर = नकाशावरील अंतर × प्रमाण = {cm} × {n} = {ans} किमी.",
    },
    ([i, j]) => {
      const scale = at(n, i!), dist = at(cm, j!), real = scale * dist;
      return { vars: { n: scale, cm: dist }, answer: real, expr: `${scale}*${dist}`, decoys: [real + scale, real - dist, scale + dist], render: (n2) => `${fmt(n2)} km` };
    },
  );

const fGeoLong = (tag: string, lvl: number, want: number, d1: Range, gap: Range) =>
  T(
    `geolong:${tag}`,
    lvl,
    want,
    [d1.n, gap.n],
    {
      en: [
        "Place A is at {a}°E and place B at {b}°E. The Earth turns 1° in 4 minutes. How many minutes ahead is B's local time?",
        "Town A lies on {a}°E and town B on {b}°E. Since 1° of longitude equals 4 minutes, by how many minutes is B's local time ahead?",
      ],
      hi: [
        "स्थान A {a}°E पर और स्थान B {b}°E पर है। पृथ्वी 1° चार मिनट में घूमती है। B का स्थानीय समय कितने मिनट आगे है?",
        "कस्बा A {a}°E पर और कस्बा B {b}°E पर है। 1° देशांतर = 4 मिनट, तो B का स्थानीय समय कितने मिनट आगे है?",
      ],
      mr: [
        "ठिकाण A {a}°E वर व ठिकाण B {b}°E वर आहे. पृथ्वी 1° चार मिनिटांत फिरते. B ची स्थानिक वेळ किती मिनिटे पुढे आहे?",
        "गाव A {a}°E वर आणि गाव B {b}°E वर आहे. 1° रेखांश = 4 मिनिटे, तर B ची स्थानिक वेळ किती मिनिटे पुढे आहे?",
      ],
      sen: "Difference = ({b} − {a})° × 4 minutes = {ans} minutes.",
      shi: "अंतर = ({b} − {a})° × 4 मिनट = {ans} मिनट।",
      smr: "फरक = ({b} − {a})° × 4 मिनिटे = {ans} मिनिटे.",
    },
    ([i, j]) => {
      const a = at(d1, i!), b = a + at(gap, j!);
      const mins = (b - a) * 4;
      return { vars: { a, b }, answer: mins, expr: `(${b}-${a})*4`, decoys: [b - a, mins + 4, mins - 4], render: (n2) => `${fmt(n2)} min` };
    },
  );

const fGeoPopDen = (tag: string, lvl: number, want: number, den: Range, area: Range) =>
  T(
    `geopop:${tag}`,
    lvl,
    want,
    [den.n, area.n],
    {
      en: ["A district of {a} km² has a population of {p}. What is its population density?"],
      hi: ["{a} किमी² के जिले की जनसंख्या {p} है। जनसंख्या घनत्व क्या है?"],
      mr: ["{a} किमी² च्या जिल्ह्याची लोकसंख्या {p} आहे. लोकसंख्येची घनता किती?"],
      sen: "Density = population ÷ area = {p} ÷ {a} = {ans} people per km².",
      shi: "घनत्व = जनसंख्या ÷ क्षेत्रफल = {p} ÷ {a} = {ans} व्यक्ति प्रति किमी²।",
      smr: "घनता = लोकसंख्या ÷ क्षेत्रफळ = {p} ÷ {a} = {ans} व्यक्ती प्रति किमी².",
    },
    ([i, j]) => {
      const d = at(den, i!), a = at(area, j!), p = d * a;
      return { vars: { p, a }, answer: d, expr: `${p}/${a}`, decoys: [d + 10, d - 10, p - a], render: (n2) => `${fmt(n2)}/km²` };
    },
  );

const GEOSCALEINV: SkinSet = {
  en: [
    "A map's scale is 1 cm : {n} km. Two cities are {real} km apart in reality. How far apart are they on the map?",
    "On a map where 1 cm stands for {n} km, what map distance shows a real distance of {real} km?",
  ],
  hi: [
    "नक्शे का पैमाना 1 सेमी : {n} किमी है। दो शहर वास्तव में {real} किमी दूर हैं। नक्शे पर वे कितनी दूर होंगे?",
    "जिस नक्शे पर 1 सेमी = {n} किमी है, उस पर {real} किमी की वास्तविक दूरी कितने सेमी में दिखेगी?",
  ],
  mr: [
    "नकाशाचे प्रमाण 1 सेमी : {n} किमी आहे. दोन शहरे प्रत्यक्षात {real} किमी दूर आहेत. नकाशावर ती किती दूर असतील?",
    "ज्या नकाशावर 1 सेमी = {n} किमी आहे, त्यावर {real} किमी खरे अंतर किती सेमीमध्ये दिसेल?",
  ],
  sen: "Map distance = real distance ÷ scale = {real} ÷ {n} = {ans} cm.",
  shi: "नक्शे की दूरी = वास्तविक दूरी ÷ पैमाना = {real} ÷ {n} = {ans} सेमी।",
  smr: "नकाशावरील अंतर = खरे अंतर ÷ प्रमाण = {real} ÷ {n} = {ans} सेमी.",
};
const fGeoScaleInv = (tag: string, lvl: number, want: number, n: Range, cmR: Range) =>
  T(`geoscaleinv:${tag}`, lvl, want, [n.n, cmR.n], GEOSCALEINV, ([i, j]) => {
    const scale = at(n, i!), dist = at(cmR, j!), real = scale * dist;
    return { vars: { n: scale, real }, answer: dist, expr: `${real}/${scale}`, decoys: [dist + 2, dist - 1, real - scale], render: cm };
  });

const GEORATIO: SkinSet = {
  en: [
    "A map uses the representative fraction 1 : {rf}, so 1 cm stands for {n} km. What real distance is {cm} cm on this map?",
    "On a 1 : {rf} map (1 cm = {n} km), two villages are {cm} cm apart. Find the actual distance.",
  ],
  hi: [
    "नक्शा 1 : {rf} निरूपक भिन्न पर बना है, यानी 1 सेमी = {n} किमी। इस नक्शे पर {cm} सेमी कितनी वास्तविक दूरी है?",
    "1 : {rf} के नक्शे पर (1 सेमी = {n} किमी) दो गाँव {cm} सेमी दूर हैं। वास्तविक दूरी निकालिए।",
  ],
  mr: [
    "नकाशा 1 : {rf} या दर्शक अपूर्णांकावर आहे, म्हणजे 1 सेमी = {n} किमी. या नकाशावर {cm} सेमी म्हणजे किती खरे अंतर?",
    "1 : {rf} च्या नकाशावर (1 सेमी = {n} किमी) दोन गावे {cm} सेमी दूर आहेत. खरे अंतर काढा.",
  ],
  sen: "1 : {rf} means 1 cm = {n} km on the ground; real distance = {cm} × {n} = {ans} km.",
  shi: "1 : {rf} का अर्थ 1 सेमी = {n} किमी; वास्तविक दूरी = {cm} × {n} = {ans} किमी।",
  smr: "1 : {rf} म्हणजे 1 सेमी = {n} किमी; खरे अंतर = {cm} × {n} = {ans} किमी.",
};
const fGeoRatio = (tag: string, lvl: number, want: number, n: Range, cmR: Range) =>
  T(`georatio:${tag}`, lvl, want, [n.n, cmR.n], GEORATIO, ([i, j]) => {
    const scale = at(n, i!), dist = at(cmR, j!), real = scale * dist;
    return { vars: { rf: scale * 100000, n: scale, cm: dist }, answer: real, expr: `${scale}*${dist}`, decoys: [real + scale, real - dist, scale + dist], render: (x) => `${fmt(x)} km` };
  });

const GEOTRIP: SkinSet = {
  en: [
    "A road on a map runs {a} cm to a junction, then {b} cm to a town, with a scale of 1 cm : {n} km. How long is the road in reality?",
    "On a 1 cm : {n} km map, a route measures {a} cm plus {b} cm. Find its real length.",
  ],
  hi: [
    "नक्शे पर सड़क पहले {a} सेमी चौराहे तक, फिर {b} सेमी कस्बे तक जाती है; पैमाना 1 सेमी : {n} किमी है। सड़क वास्तव में कितनी लंबी है?",
    "1 सेमी : {n} किमी के नक्शे पर एक मार्ग {a} सेमी और {b} सेमी का है। उसकी वास्तविक लंबाई निकालिए।",
  ],
  mr: [
    "नकाशावर रस्ता आधी {a} सेमी चौकापर्यंत, मग {b} सेमी गावापर्यंत जातो; प्रमाण 1 सेमी : {n} किमी आहे. रस्ता प्रत्यक्षात किती लांब आहे?",
    "1 सेमी : {n} किमी च्या नकाशावर एक मार्ग {a} सेमी अधिक {b} सेमी आहे. त्याची खरी लांबी काढा.",
  ],
  sen: "Total on the map = {a} + {b} cm; real length = ({a} + {b}) × {n} = {ans} km.",
  shi: "नक्शे पर कुल = {a} + {b} सेमी; वास्तविक लंबाई = ({a} + {b}) × {n} = {ans} किमी।",
  smr: "नकाशावर एकूण = {a} + {b} सेमी; खरी लांबी = ({a} + {b}) × {n} = {ans} किमी.",
};
const fGeoTrip = (tag: string, lvl: number, want: number, n: Range, aR: Range, bR: Range) =>
  T(`geotrip:${tag}`, lvl, want, [n.n, aR.n, bR.n], GEOTRIP, ([i, j, k]) => {
    const scale = at(n, i!), a = at(aR, j!), b = at(bR, k!), real = (a + b) * scale;
    return { vars: { a, b, n: scale }, answer: real, expr: `(${a}+${b})*${scale}`, decoys: [a * scale + b, real + scale, (a + b) * (scale + 1)], render: (x) => `${fmt(x)} km` };
  });

const GEOAREASQ: SkinSet = {
  en: [
    "A square plot appears with side {s} cm on a map of scale 1 cm : {n} km. What is the plot's real area?",
    "On a 1 cm : {n} km map, a square region has {s} cm sides. Find its actual area.",
  ],
  hi: [
    "1 सेमी : {n} किमी पैमाने के नक्शे पर वर्गाकार भूखंड की भुजा {s} सेमी है। भूखंड का वास्तविक क्षेत्रफल क्या है?",
    "1 सेमी : {n} किमी के नक्शे पर वर्गाकार क्षेत्र की भुजाएँ {s} सेमी हैं। वास्तविक क्षेत्रफल निकालिए।",
  ],
  mr: [
    "1 सेमी : {n} किमी प्रमाणाच्या नकाशावर चौरस भूखंडाची बाजू {s} सेमी आहे. भूखंडाचे खरे क्षेत्रफळ किती?",
    "1 सेमी : {n} किमी च्या नकाशावर चौरस प्रदेशाच्या बाजू {s} सेमी आहेत. खरे क्षेत्रफळ काढा.",
  ],
  sen: "Real side = {s} × {n} km; area = ({s} × {n})² = {ans} km². Lengths scale by {n}, areas by {n}².",
  shi: "वास्तविक भुजा = {s} × {n} किमी; क्षेत्रफल = ({s} × {n})² = {ans} किमी²। लंबाई {n} गुना, क्षेत्रफल {n}² गुना।",
  smr: "खरी बाजू = {s} × {n} किमी; क्षेत्रफळ = ({s} × {n})² = {ans} किमी². लांबी {n} पट, क्षेत्रफळ {n}² पट.",
};
const fGeoAreaScale = (tag: string, lvl: number, want: number, n: Range, sR: Range) =>
  T(`geoareasq:${tag}`, lvl, want, [n.n, sR.n], GEOAREASQ, ([i, j]) => {
    const scale = at(n, i!), s = at(sR, j!), side = s * scale, area = side * side;
    return { vars: { s, n: scale }, answer: area, expr: `(${s}*${scale})^2`, decoys: [s * s * scale, side, area + side], render: (x) => `${fmt(x)} km²` };
  });

const GEOAREARECT: SkinSet = {
  en: [
    "A district appears as a {a} cm × {b} cm rectangle on a map of scale 1 cm : {n} km. What is the district's real area?",
    "On a 1 cm : {n} km map, a farm block measures {a} cm by {b} cm. Find its actual area.",
  ],
  hi: [
    "1 सेमी : {n} किमी पैमाने के नक्शे पर जिला {a} सेमी × {b} सेमी के आयत जैसा दिखता है। जिले का वास्तविक क्षेत्रफल क्या है?",
    "1 सेमी : {n} किमी के नक्शे पर खेत का खंड {a} सेमी × {b} सेमी का है। वास्तविक क्षेत्रफल निकालिए।",
  ],
  mr: [
    "1 सेमी : {n} किमी प्रमाणाच्या नकाशावर जिल्हा {a} सेमी × {b} सेमी च्या आयतासारखा दिसतो. जिल्ह्याचे खरे क्षेत्रफळ किती?",
    "1 सेमी : {n} किमी च्या नकाशावर शेताचा भाग {a} सेमी × {b} सेमी आहे. खरे क्षेत्रफळ काढा.",
  ],
  sen: "Each side scales by {n}: real area = {a} × {b} × {n}² = {ans} km².",
  shi: "हर भुजा {n} गुना होती है: वास्तविक क्षेत्रफल = {a} × {b} × {n}² = {ans} किमी²।",
  smr: "प्रत्येक बाजू {n} पट होते: खरे क्षेत्रफळ = {a} × {b} × {n}² = {ans} किमी².",
};
const fGeoAreaRect = (tag: string, lvl: number, want: number, n: Range, aR: Range, bR: Range) =>
  T(`geoarearect:${tag}`, lvl, want, [n.n, aR.n, bR.n], GEOAREARECT, ([i, j, k]) => {
    const scale = at(n, i!), a = at(aR, j!), b = at(bR, k!), area = a * b * scale * scale;
    return { vars: { a, b, n: scale }, answer: area, expr: `${a}*${b}*(${scale}^2)`, decoys: [a * b * scale, area + scale, a * b], render: (x) => `${fmt(x)} km²` };
  });

const GEOWEST: SkinSet = {
  en: [
    "Place A is at {a}°E and place B at {b}°E, to its west. The Earth turns 1° in 4 minutes. How many minutes BEHIND A is B's local time?",
    "Town B ({b}°E) lies west of town A ({a}°E). With 1° = 4 minutes, by how many minutes does B's clock trail A's?",
  ],
  hi: [
    "स्थान A {a}°E पर है और स्थान B {b}°E पर, उसके पश्चिम में। पृथ्वी 1° चार मिनट में घूमती है। B का स्थानीय समय A से कितने मिनट पीछे है?",
    "कस्बा B ({b}°E) कस्बे A ({a}°E) के पश्चिम में है। 1° = 4 मिनट, तो B की घड़ी A से कितने मिनट पीछे रहेगी?",
  ],
  mr: [
    "ठिकाण A {a}°E वर आहे आणि ठिकाण B {b}°E वर, त्याच्या पश्चिमेस. पृथ्वी 1° चार मिनिटांत फिरते. B ची स्थानिक वेळ A पेक्षा किती मिनिटे मागे आहे?",
    "गाव B ({b}°E) गाव A ({a}°E) च्या पश्चिमेस आहे. 1° = 4 मिनिटे, तर B चे घड्याळ A पेक्षा किती मिनिटे मागे राहील?",
  ],
  sen: "West means behind: difference = ({a} − {b})° × 4 minutes = {ans} minutes.",
  shi: "पश्चिम यानी पीछे: अंतर = ({a} − {b})° × 4 मिनट = {ans} मिनट।",
  smr: "पश्चिम म्हणजे मागे: फरक = ({a} − {b})° × 4 मिनिटे = {ans} मिनिटे.",
};
const fGeoLongWest = (tag: string, lvl: number, want: number, aR: Range, gap: Range) =>
  T(`geowest:${tag}`, lvl, want, [aR.n, gap.n], GEOWEST, ([i, j]) => {
    const a = at(aR, i!), g = at(gap, j!), b = a - g, mins = g * 4;
    return { vars: { a, b }, answer: mins, expr: `(${a}-${b})*4`, decoys: [g, mins + 4, mins - 4], render: (x) => `${fmt(x)} min` };
  });

const GEODEG: SkinSet = {
  en: [
    "The local time at place {Q} is {m} minutes ahead of place {P}. Since the Earth turns 1° in 4 minutes, how many degrees of longitude separate them?",
    "The clocks of stations {P} and {Q} differ by {m} minutes. With 1° = 4 minutes of time, what is their difference in longitude?",
  ],
  hi: [
    "स्थान {Q} का स्थानीय समय स्थान {P} से {m} मिनट आगे है। पृथ्वी 1° चार मिनट में घूमती है, तो दोनों के बीच कितने डिग्री देशांतर का अंतर है?",
    "स्टेशन {P} और {Q} की घड़ियों में {m} मिनट का अंतर है। 1° = 4 मिनट, तो देशांतर का अंतर कितना है?",
  ],
  mr: [
    "ठिकाण {Q} ची स्थानिक वेळ ठिकाण {P} पेक्षा {m} मिनिटे पुढे आहे. पृथ्वी 1° चार मिनिटांत फिरते, तर दोघांमध्ये किती अंश रेखांशाचा फरक आहे?",
    "स्थानक {P} आणि {Q} च्या घड्याळांत {m} मिनिटांचा फरक आहे. 1° = 4 मिनिटे, तर रेखांशाचा फरक किती?",
  ],
  sen: "Degrees = minutes ÷ 4 = {m} ÷ 4 = {ans}°.",
  shi: "डिग्री = मिनट ÷ 4 = {m} ÷ 4 = {ans}°।",
  smr: "अंश = मिनिटे ÷ 4 = {m} ÷ 4 = {ans}°.",
};
const GEODEG_PAIRS: [string, string][] = [["P", "Q"], ["A", "B"], ["C", "D"], ["E", "F"], ["G", "H"], ["K", "L"], ["M", "N"], ["R", "S"], ["T", "U"], ["X", "Y"]];
const fGeoDegrees = (tag: string, lvl: number, want: number, dR: Range) =>
  T(`geodeg:${tag}`, lvl, want, [dR.n, GEODEG_PAIRS.length], GEODEG, ([i, j]) => {
    const d = at(dR, i!), m = 4 * d, [P, Q] = GEODEG_PAIRS[j!]!;
    return { vars: { m, P, Q }, answer: d, expr: `${m}/4`, decoys: [m, d + 4, d - 1], render: (x) => `${fmt(x)}°` };
  });

const GEOACROSS: SkinSet = {
  en: [
    "City A is at {a}°E and city B at {b}°W. The Earth turns 1° in 4 minutes. What is the difference between their local times, in minutes?",
    "One port lies on {a}°E, another on {b}°W. With 1° = 4 minutes, find the local time difference.",
  ],
  hi: [
    "शहर A {a}°E पर और शहर B {b}°W पर है। पृथ्वी 1° चार मिनट में घूमती है। दोनों के स्थानीय समय में कितने मिनट का अंतर है?",
    "एक बंदरगाह {a}°E पर, दूसरा {b}°W पर है। 1° = 4 मिनट, तो स्थानीय समय का अंतर निकालिए।",
  ],
  mr: [
    "शहर A {a}°E वर आणि शहर B {b}°W वर आहे. पृथ्वी 1° चार मिनिटांत फिरते. दोघांच्या स्थानिक वेळांत किती मिनिटांचा फरक आहे?",
    "एक बंदर {a}°E वर, दुसरे {b}°W वर आहे. 1° = 4 मिनिटे, तर स्थानिक वेळेचा फरक काढा.",
  ],
  sen: "Across the prime meridian the longitudes add: ({a} + {b})° × 4 = {ans} minutes.",
  shi: "प्रधान मध्याह्न रेखा के आर-पार देशांतर जुड़ते हैं: ({a} + {b})° × 4 = {ans} मिनट।",
  smr: "मूळ मध्यान्ह रेषेच्या दोन्ही बाजूंचे रेखांश मिळवतात: ({a} + {b})° × 4 = {ans} मिनिटे.",
};
const fGeoAcross = (tag: string, lvl: number, want: number, aR: Range, bR: Range) =>
  T(`geoacross:${tag}`, lvl, want, [aR.n, bR.n], GEOACROSS, ([i, j]) => {
    const a = at(aR, i!), b = at(bR, j!), mins = (a + b) * 4;
    return { vars: { a, b }, answer: mins, expr: `(${a}+${b})*4`, decoys: [a + b, mins - 4, (a - b > 0 ? a - b : b - a) * 4], render: (x) => `${fmt(x)} min` };
  });

const GEOCLOCK: SkinSet = {
  en: [
    "When it is {h}:00 at place P ({a}°E), place Q lies at {b}°E. The Earth turns 1° in 4 minutes. How many minutes ahead of P is Q's local time?",
  ],
  hi: [
    "जब स्थान P ({a}°E) पर {h}:00 बजते हैं, स्थान Q {b}°E पर है। पृथ्वी 1° चार मिनट में घूमती है। Q का स्थानीय समय P से कितने मिनट आगे है?",
  ],
  mr: [
    "ठिकाण P ({a}°E) वर {h}:00 वाजतात तेव्हा ठिकाण Q {b}°E वर आहे. पृथ्वी 1° चार मिनिटांत फिरते. Q ची स्थानिक वेळ P पेक्षा किती मिनिटे पुढे आहे?",
  ],
  sen: "The clock reading does not change the gap: ({b} − {a})° × 4 = {ans} minutes ahead.",
  shi: "घड़ी का समय अंतर नहीं बदलता: ({b} − {a})° × 4 = {ans} मिनट आगे।",
  smr: "घड्याळाची वेळ फरक बदलत नाही: ({b} − {a})° × 4 = {ans} मिनिटे पुढे.",
};
const fGeoClock = (tag: string, lvl: number, want: number, aR: Range, gap: Range) =>
  T(`geoclock:${tag}`, lvl, want, [aR.n, gap.n, 12], GEOCLOCK, ([i, j, k]) => {
    const a = at(aR, i!), g = at(gap, j!), b = a + g, h = 1 + k!, mins = g * 4;
    return { vars: { h, a, b }, answer: mins, expr: `(${b}-${a})*4`, decoys: [g, mins + 4, mins + 8], render: (x) => `${fmt(x)} min` };
  });

const GEOHOURS: SkinSet = {
  en: [
    "At {h}:{mm} local time in place A ({a}°E), what is the time DIFFERENCE in hours to place B at {b}°E? (The Earth turns 15° per hour.)",
    "Place A sits on {a}°E and place B on {b}°E. Using 15° per hour, how many hours separate their local times? (It is {h}:{mm} at A.)",
  ],
  hi: [
    "स्थान A ({a}°E) पर स्थानीय समय {h}:{mm} है। {b}°E पर स्थित स्थान B से समय का अंतर कितने घंटे है? (पृथ्वी 15° प्रति घंटा घूमती है।)",
    "स्थान A {a}°E पर और स्थान B {b}°E पर है। 15° प्रति घंटा की दर से दोनों के स्थानीय समय में कितने घंटों का अंतर है? (A पर {h}:{mm} बजे हैं।)",
  ],
  mr: [
    "ठिकाण A ({a}°E) वर स्थानिक वेळ {h}:{mm} आहे. {b}°E वरील ठिकाण B शी वेळेचा फरक किती तास आहे? (पृथ्वी दर तासाला 15° फिरते.)",
    "ठिकाण A {a}°E वर आणि ठिकाण B {b}°E वर आहे. दर तासाला 15° या दराने दोघांच्या स्थानिक वेळांत किती तासांचा फरक आहे? (A वर {h}:{mm} वाजले आहेत.)",
  ],
  sen: "Difference = ({b} − {a})° ÷ 15 = {ans} hours.",
  shi: "अंतर = ({b} − {a})° ÷ 15 = {ans} घंटे।",
  smr: "फरक = ({b} − {a})° ÷ 15 = {ans} तास.",
};
const GEOHOURS_MM = ["00", "30"];
const fGeoLongHours = (tag: string, lvl: number, want: number) =>
  T(`geohours:${tag}`, lvl, want, [15, 11, 12, GEOHOURS_MM.length], GEOHOURS, ([i, j, k, l]) => {
    const a = i!, hours = 1 + j!, b = a + 15 * hours, h = 1 + k!, mm = GEOHOURS_MM[l!]!;
    return { vars: { a, b, h, mm }, answer: hours, expr: `(${b}-${a})/15`, decoys: [hours + 1, hours - 1, (b - a) / 5], render: (x) => `${fmt(x)} h` };
  });

const GEOPOP2: SkinSet = {
  en: ["A district covers {a} km² with a population density of {d} people per km². What is its population?", "Find the population of a {a} km² region whose density is {d} per km²."],
  hi: ["एक जिला {a} किमी² में फैला है और जनसंख्या घनत्व {d} व्यक्ति प्रति किमी² है। उसकी जनसंख्या क्या है?", "{a} किमी² के क्षेत्र की जनसंख्या निकालिए जिसका घनत्व {d} प्रति किमी² है।"],
  mr: ["एक जिल्हा {a} किमी² वर पसरला आहे आणि लोकसंख्येची घनता {d} व्यक्ती प्रति किमी² आहे. त्याची लोकसंख्या किती?", "{a} किमी² च्या प्रदेशाची लोकसंख्या काढा, ज्याची घनता {d} प्रति किमी² आहे."],
  sen: "Population = density × area = {d} × {a} = {ans}.",
  shi: "जनसंख्या = घनत्व × क्षेत्रफल = {d} × {a} = {ans}।",
  smr: "लोकसंख्या = घनता × क्षेत्रफळ = {d} × {a} = {ans}.",
};
const fGeoPop = (tag: string, lvl: number, want: number, den: Range, area: Range) =>
  T(`geopop2:${tag}`, lvl, want, [den.n, area.n], GEOPOP2, ([i, j]) => {
    const d = at(den, i!), a = at(area, j!), p = d * a;
    return { vars: { d, a }, answer: p, expr: `${d}*${a}`, decoys: [p + d, p - a, d + a], render: fmt };
  });

const GEOAREA2: SkinSet = {
  en: ["A region has population {p} and density {d} people per km². What is its area?", "Find the area of a district of {p} people at {d} per km²."],
  hi: ["किसी क्षेत्र की जनसंख्या {p} और घनत्व {d} व्यक्ति प्रति किमी² है। उसका क्षेत्रफल क्या है?", "{d} प्रति किमी² घनत्व वाले {p} जनसंख्या के जिले का क्षेत्रफल निकालिए।"],
  mr: ["एका प्रदेशाची लोकसंख्या {p} आणि घनता {d} व्यक्ती प्रति किमी² आहे. त्याचे क्षेत्रफळ किती?", "{d} प्रति किमी² घनतेच्या {p} लोकसंख्येच्या जिल्ह्याचे क्षेत्रफळ काढा."],
  sen: "Area = population ÷ density = {p} ÷ {d} = {ans} km².",
  shi: "क्षेत्रफल = जनसंख्या ÷ घनत्व = {p} ÷ {d} = {ans} किमी²।",
  smr: "क्षेत्रफळ = लोकसंख्या ÷ घनता = {p} ÷ {d} = {ans} किमी².",
};
const fGeoAreaFromPop = (tag: string, lvl: number, want: number, den: Range, area: Range) =>
  T(`geoarea2:${tag}`, lvl, want, [den.n, area.n], GEOAREA2, ([i, j]) => {
    const d = at(den, i!), a = at(area, j!), p = d * a;
    return { vars: { p, d }, answer: a, expr: `${p}/${d}`, decoys: [a + 5, a - 2, p - d], render: (x) => `${fmt(x)} km²` };
  });

const GEODENGROW: SkinSet = {
  en: [
    "A city's population density is {d} per km². If the population grows {p}% while the area stays the same, what will the density become?",
    "A town packs {d} people per km² today. After {p}% population growth on the same land, find the new density.",
  ],
  hi: [
    "शहर का जनसंख्या घनत्व {d} प्रति किमी² है। क्षेत्रफल वही रहे और जनसंख्या {p}% बढ़े, तो घनत्व कितना हो जाएगा?",
    "आज कस्बे में {d} व्यक्ति प्रति किमी² हैं। उसी ज़मीन पर {p}% वृद्धि के बाद नया घनत्व निकालिए।",
  ],
  mr: [
    "शहराची लोकसंख्या घनता {d} प्रति किमी² आहे. क्षेत्रफळ तेच राहून लोकसंख्या {p}% वाढली, तर घनता किती होईल?",
    "आज गावात {d} व्यक्ती प्रति किमी² आहेत. त्याच जमिनीवर {p}% वाढीनंतर नवी घनता काढा.",
  ],
  sen: "New density = {d} × (100 + {p}) ÷ 100 = {ans} per km².",
  shi: "नया घनत्व = {d} × (100 + {p}) ÷ 100 = {ans} प्रति किमी²।",
  smr: "नवी घनता = {d} × (100 + {p}) ÷ 100 = {ans} प्रति किमी².",
};
const fGeoDenGrow = (tag: string, lvl: number, want: number, kR: Range, pR: Range) =>
  T(`geodengrow:${tag}`, lvl, want, [kR.n, pR.n], GEODENGROW, ([i, j]) => {
    const k = at(kR, i!), p = 5 * at(pR, j!), d = 20 * k, nd = (d * (100 + p)) / 100;
    return { vars: { d, p }, answer: nd, expr: `${d}*(100+${p})/100`, decoys: [d + p, nd + k, (d * p) / 100], render: (x) => `${fmt(x)}/km²` };
  });

const GEODENCMP: SkinSet = {
  en: [
    "District X has {p1} people in {a1} km²; district Y has {p2} people in {a2} km². How many MORE people per km² does X have than Y?",
    "Compare densities: X ({p1} people, {a1} km²) against Y ({p2} people, {a2} km²). Find the difference in people per km².",
  ],
  hi: [
    "जिले X में {a1} किमी² में {p1} लोग हैं; जिले Y में {a2} किमी² में {p2} लोग। X में Y से प्रति किमी² कितने अधिक लोग हैं?",
    "घनत्व तुलना: X ({p1} लोग, {a1} किमी²) बनाम Y ({p2} लोग, {a2} किमी²)। प्रति किमी² अंतर निकालिए।",
  ],
  mr: [
    "जिल्हा X मध्ये {a1} किमी² मध्ये {p1} लोक आहेत; जिल्हा Y मध्ये {a2} किमी² मध्ये {p2} लोक. X मध्ये Y पेक्षा प्रति किमी² किती जास्त लोक आहेत?",
    "घनतेची तुलना: X ({p1} लोक, {a1} किमी²) विरुद्ध Y ({p2} लोक, {a2} किमी²). प्रति किमी² फरक काढा.",
  ],
  sen: "Density of X = {p1} ÷ {a1}; density of Y = {p2} ÷ {a2}; difference = {ans} per km².",
  shi: "X का घनत्व = {p1} ÷ {a1}; Y का घनत्व = {p2} ÷ {a2}; अंतर = {ans} प्रति किमी²।",
  smr: "X ची घनता = {p1} ÷ {a1}; Y ची घनता = {p2} ÷ {a2}; फरक = {ans} प्रति किमी².",
};
const GEODENCMP_AREAS: [number, number][] = [[4, 5], [6, 8], [10, 12], [15, 20], [25, 30]];
const fGeoDenCompare = (tag: string, lvl: number, want: number, d1R: Range, deltaR: Range) =>
  T(`geodencmp:${tag}`, lvl, want, [d1R.n, deltaR.n, GEODENCMP_AREAS.length], GEODENCMP, ([i, j, k]) => {
    const d1 = at(d1R, i!), delta = at(deltaR, j!), d2 = d1 - delta;
    const [a1, a2] = GEODENCMP_AREAS[k!]!;
    const p1 = d1 * a1, p2 = d2 * a2;
    return { vars: { p1, a1, p2, a2 }, answer: delta, expr: `${p1}/${a1}-${p2}/${a2}`, decoys: [delta + 10, delta - 5, d1], render: (x) => `${fmt(x)}/km²` };
  });

const GEOMERGE: SkinSet = {
  en: [
    "Two blocks merge into one district: {p1} people on {a1} km² and {p2} people on {a2} km². What is the density of the merged district?",
    "A district is formed from {p1} people in {a1} km² plus {p2} people in {a2} km². Find its overall density.",
  ],
  hi: [
    "दो खंड मिलकर एक जिला बनते हैं: {a1} किमी² में {p1} लोग और {a2} किमी² में {p2} लोग। मिले हुए जिले का घनत्व क्या है?",
    "{a1} किमी² में {p1} लोगों और {a2} किमी² में {p2} लोगों से जिला बना। उसका कुल घनत्व निकालिए।",
  ],
  mr: [
    "दोन विभाग मिळून एक जिल्हा होतो: {a1} किमी² मध्ये {p1} लोक आणि {a2} किमी² मध्ये {p2} लोक. एकत्रित जिल्ह्याची घनता किती?",
    "{a1} किमी² मधील {p1} लोक अधिक {a2} किमी² मधील {p2} लोक यांचा जिल्हा बनला. त्याची एकूण घनता काढा.",
  ],
  sen: "Merged density = total people ÷ total area = ({p1} + {p2}) ÷ ({a1} + {a2}) = {ans} per km².",
  shi: "कुल घनत्व = कुल जनसंख्या ÷ कुल क्षेत्रफल = ({p1} + {p2}) ÷ ({a1} + {a2}) = {ans} प्रति किमी²।",
  smr: "एकत्रित घनता = एकूण लोक ÷ एकूण क्षेत्रफळ = ({p1} + {p2}) ÷ ({a1} + {a2}) = {ans} प्रति किमी².",
};
const fGeoMergeDen = (tag: string, lvl: number, want: number, rR: Range, a1R: Range, a2R: Range, dR: Range) =>
  T(`geomerge:${tag}`, lvl, want, [rR.n, a1R.n, a2R.n, dR.n], GEOMERGE, ([i, j, k, l]) => {
    const rho = at(rR, i!), a1 = at(a1R, j!), a2 = at(a2R, k!), delta = at(dR, l!);
    const p1 = (rho + delta) * a1, p2 = rho * (a1 + a2) - p1;
    return { vars: { p1, a1, p2, a2 }, answer: rho, expr: `(${p1}+${p2})/(${a1}+${a2})`, decoys: [rho + delta, rho - delta, rho + 1], render: (x) => `${fmt(x)}/km²` };
  });

/* --------------------------------------------------------------------------
   History — timeline arithmetic over the events table; years are GIVEN in
   the stem, so the sum is machine-proven while the fact stays table-curated.
   -------------------------------------------------------------------------- */

const HIST_PAIRS: [number, number][] = [];
for (let hp1 = 0; hp1 < EVENTS.length; hp1++)
  for (let hp2 = hp1 + 1; hp2 < EVENTS.length; hp2++)
    if (EVENTS[hp1]!.year !== EVENTS[hp2]!.year) HIST_PAIRS.push([hp1, hp2]);

const fHistBetween = (tag: string, lvl: number, want: number) =>
  T(
    `histbetween:${tag}`,
    lvl,
    want,
    [HIST_PAIRS.length],
    {
      en: ["How many years passed between {e1} ({y1}) and {e2} ({y2})?", "{e1} was in {y1} and {e2} in {y2}. How many years apart are they?"],
      hi: ["{h1} ({y1}) और {h2} ({y2}) के बीच कितने वर्ष बीते?", "{h1} {y1} में और {h2} {y2} में हुआ। दोनों में कितने वर्षों का अंतर है?"],
      mr: ["{m1} ({y1}) आणि {m2} ({y2}) यांच्यामध्ये किती वर्षे गेली?", "{m1} {y1} मध्ये व {m2} {y2} मध्ये घडले. दोघांत किती वर्षांचे अंतर आहे?"],
      sen: "Subtract the years: {y2} − {y1} = {ans} years.",
      shi: "वर्ष घटाएँ: {y2} − {y1} = {ans} वर्ष।",
      smr: "वर्षे वजा करा: {y2} − {y1} = {ans} वर्षे.",
    },
    ([i]) => {
      const [a, b] = HIST_PAIRS[i!]!;
      const e1 = EVENTS[a]!, e2 = EVENTS[b]!;
      const gap = e2.year - e1.year;
      return {
        vars: { e1: e1.en, e2: e2.en, h1: e1.hi, h2: e2.hi, m1: e1.mr, m2: e2.mr, y1: e1.year, y2: e2.year },
        answer: gap,
        expr: `${e2.year}-${e1.year}`,
        decoys: [gap + 10, gap - 10, gap + 1],
      };
    },
  );

const fHistAfter = (tag: string, lvl: number, want: number, n: Range) =>
  T(
    `histafter:${tag}`,
    lvl,
    want,
    [EVENTS.length, n.n],
    {
      en: ["{e} took place in {y}. Which year came {n} years later?", "Count {n} years on from {e} ({y}). Which year do you reach?"],
      hi: ["{h} {y} में हुआ। उसके {n} वर्ष बाद कौन-सा वर्ष आया?", "{h} ({y}) से {n} वर्ष आगे गिनिए। कौन-सा वर्ष आता है?"],
      mr: ["{m} {y} मध्ये घडले. त्यानंतर {n} वर्षांनी कोणते वर्ष आले?", "{m} ({y}) पासून {n} वर्षे पुढे मोजा. कोणते वर्ष येते?"],
      sen: "Add the years: {y} + {n} = {ans}.",
      shi: "वर्ष जोड़ें: {y} + {n} = {ans}।",
      smr: "वर्षे मिळवा: {y} + {n} = {ans}.",
    },
    ([i, j]) => {
      const e = EVENTS[i!]!, add = at(n, j!);
      const y2 = e.year + add;
      return { vars: { e: e.en, h: e.hi, m: e.mr, y: e.year, n: add }, answer: y2, expr: `${e.year}+${add}`, decoys: [y2 + 10, y2 - 10, y2 + 1] };
    },
  );

const fHistCentury = (tag: string, lvl: number, want: number, y: Range) =>
  T(
    `histcentury:${tag}`,
    lvl,
    want,
    [y.n],
    {
      en: ["The year {y} falls in which century?", "Which century does the year {y} belong to?"],
      hi: ["वर्ष {y} किस शताब्दी में आता है?", "वर्ष {y} किस शताब्दी का है?"],
      mr: ["{y} हे वर्ष कोणत्या शतकात येते?", "{y} हे वर्ष कोणत्या शतकातील आहे?"],
      sen: "Centuries run from year x01 to x00, so {y} is in century {ans}.",
      shi: "शताब्दी x01 से x00 तक चलती है, इसलिए {y} शताब्दी {ans} में है।",
      smr: "शतक x01 ते x00 असे असते, म्हणून {y} हे शतक {ans} मध्ये आहे.",
    },
    ([i]) => {
      const year = at(y, i!);
      const rem = (year - 1) % 100;
      const century = (year - 1 - rem) / 100 + 1;
      return { vars: { y: year }, answer: century, expr: `(${year}-1-${rem})/100+1`, decoys: [century + 1, century - 1, Math.round(year / 100) === century ? century + 2 : Math.round(year / 100)] };
    },
  );

const HISTBEFORE: SkinSet = {
  en: ["{e} took place in {y}. Which year was {n} years earlier?", "Count {n} years back from {e} ({y}). Which year do you reach?"],
  hi: ["{h} {y} में हुआ। उससे {n} वर्ष पहले कौन-सा वर्ष था?", "{h} ({y}) से {n} वर्ष पीछे गिनिए। कौन-सा वर्ष आता है?"],
  mr: ["{m} {y} मध्ये घडले. त्याआधी {n} वर्षे कोणते वर्ष होते?", "{m} ({y}) पासून {n} वर्षे मागे मोजा. कोणते वर्ष येते?"],
  sen: "Subtract the years: {y} − {n} = {ans}.",
  shi: "वर्ष घटाएँ: {y} − {n} = {ans}।",
  smr: "वर्षे वजा करा: {y} − {n} = {ans}.",
};
const fHistBefore = (tag: string, lvl: number, want: number, n: Range) =>
  T(`histbefore:${tag}`, lvl, want, [EVENTS.length, n.n], HISTBEFORE, ([i, j]) => {
    const e = EVENTS[i!]!, sub = at(n, j!), y2 = e.year - sub;
    return { vars: { e: e.en, h: e.hi, m: e.mr, y: e.year, n: sub }, answer: y2, expr: `${e.year}-${sub}`, decoys: [y2 + 10, y2 - 10, y2 + 1] };
  });

/** Chain arithmetic stays in the past: only events up to 1935 anchor it. */
const CHAIN_EVENTS = EVENTS.filter((e) => e.year <= 1935);
const HISTCHAIN: SkinSet = {
  en: [
    "{e} took place in {y}. A town school opened {k} years after that, and its library {n} years after the school. In which year did the library open?",
    "{k} years after {e} ({y}), a printing press was set up; {n} years later still, it printed its first newspaper. Which year was that?",
  ],
  hi: [
    "{h} {y} में हुआ। उसके {k} वर्ष बाद कस्बे का विद्यालय खुला, और विद्यालय के {n} वर्ष बाद उसका पुस्तकालय। पुस्तकालय किस वर्ष खुला?",
    "{h} ({y}) के {k} वर्ष बाद एक छापाखाना लगा; उसके {n} वर्ष बाद उसका पहला अख़बार छपा। वह कौन-सा वर्ष था?",
  ],
  mr: [
    "{m} {y} मध्ये घडले. त्यानंतर {k} वर्षांनी गावाची शाळा उघडली, आणि शाळेनंतर {n} वर्षांनी तिचे ग्रंथालय. ग्रंथालय कोणत्या वर्षी उघडले?",
    "{m} ({y}) नंतर {k} वर्षांनी एक छापखाना सुरू झाला; त्यानंतर {n} वर्षांनी त्याचे पहिले वृत्तपत्र छापले गेले. ते कोणते वर्ष होते?",
  ],
  sen: "Add both gaps: {y} + {k} + {n} = {ans}.",
  shi: "दोनों अंतराल जोड़ें: {y} + {k} + {n} = {ans}।",
  smr: "दोन्ही अंतरे मिळवा: {y} + {k} + {n} = {ans}.",
};
const fHistChain = (tag: string, lvl: number, want: number, k: Range, n: Range) =>
  T(`histchain:${tag}`, lvl, want, [CHAIN_EVENTS.length, k.n, n.n], HISTCHAIN, ([i, j, l]) => {
    const e = CHAIN_EVENTS[i!]!, add1 = at(k, j!), add2 = at(n, l!), y2 = e.year + add1 + add2;
    return { vars: { e: e.en, h: e.hi, m: e.mr, y: e.year, k: add1, n: add2 }, answer: y2, expr: `${e.year}+${add1}+${add2}`, decoys: [y2 - add2, y2 + 10, y2 - 1] };
  });

/** Pairs far enough apart that a lifetime fits between them. */
const BIG_PAIRS = HIST_PAIRS.filter(([a, b]) => EVENTS[b]!.year - EVENTS[a]!.year >= 55);
const HISTAGE: SkinSet = {
  en: [
    "A person was born {b} years after {e1} ({y1}). How old were they at the time of {e2} ({y2})?",
    "Someone's birth came {b} years after {e1}, which was in {y1}. What was their age when {e2} happened in {y2}?",
    "Born {b} years after {e1} ({y1}), how old was this person during {e2} ({y2})?",
  ],
  hi: [
    "एक व्यक्ति का जन्म {h1} ({y1}) के {b} वर्ष बाद हुआ। {h2} ({y2}) के समय उसकी आयु कितनी थी?",
    "किसी का जन्म {h1} के {b} वर्ष बाद हुआ, जो {y1} में था। {y2} में {h2} के समय उसकी उम्र क्या थी?",
    "{h1} ({y1}) के {b} वर्ष बाद जन्मा व्यक्ति {h2} ({y2}) के समय कितने वर्ष का था?",
  ],
  mr: [
    "एका व्यक्तीचा जन्म {m1} ({y1}) नंतर {b} वर्षांनी झाला. {m2} ({y2}) च्या वेळी तिचे वय किती होते?",
    "कोणाचा जन्म {m1} नंतर {b} वर्षांनी झाला, जे {y1} मध्ये घडले. {y2} मध्ये {m2} च्या वेळी वय किती होते?",
    "{m1} ({y1}) नंतर {b} वर्षांनी जन्मलेली व्यक्ती {m2} ({y2}) च्या वेळी किती वर्षांची होती?",
  ],
  sen: "Birth year = {y1} + {b}; age = {y2} − ({y1} + {b}) = {ans} years.",
  shi: "जन्म वर्ष = {y1} + {b}; आयु = {y2} − ({y1} + {b}) = {ans} वर्ष।",
  smr: "जन्म वर्ष = {y1} + {b}; वय = {y2} − ({y1} + {b}) = {ans} वर्षे.",
};
const fHistAge = (tag: string, lvl: number, want: number, b: Range) =>
  T(`histage:${tag}`, lvl, want, [BIG_PAIRS.length, b.n], HISTAGE, ([i, j]) => {
    const [ai, bi] = BIG_PAIRS[i!]!;
    const e1 = EVENTS[ai]!, e2 = EVENTS[bi]!, born = at(b, j!);
    const age = e2.year - e1.year - born;
    return {
      vars: { e1: e1.en, e2: e2.en, h1: e1.hi, h2: e2.hi, m1: e1.mr, m2: e2.mr, y1: e1.year, y2: e2.year, b: born },
      answer: age,
      expr: `${e2.year}-(${e1.year}+${born})`,
      decoys: [age + born, e2.year - e1.year, age + 10],
    };
  });

/** Backward-then-forward chains anchor on events up to 1950. */
const BACK_EVENTS = EVENTS.filter((e) => e.year <= 1950);
const HISTBACK: SkinSet = {
  en: [
    "An archive was founded {k} years BEFORE {e} ({y}), and moved to a new building {n} years after its founding. In which year did it move?",
    "A fort was completed {k} years before {e}, which happened in {y}. Its main gate was rebuilt {n} years after the completion. Which year was the gate rebuilt?",
  ],
  hi: [
    "{h} ({y}) से {k} वर्ष पहले एक अभिलेखागार बना, और बनने के {n} वर्ष बाद नए भवन में गया। वह किस वर्ष स्थानांतरित हुआ?",
    "{h} से {k} वर्ष पहले एक किला पूरा हुआ, जो {y} में हुआ था। पूरा होने के {n} वर्ष बाद उसका मुख्य द्वार फिर बना। द्वार किस वर्ष बना?",
  ],
  mr: [
    "{m} ({y}) च्या {k} वर्षे आधी एक दप्तरखाना स्थापन झाला, आणि स्थापनेनंतर {n} वर्षांनी नव्या इमारतीत गेला. तो कोणत्या वर्षी हलला?",
    "{m} च्या {k} वर्षे आधी एक किल्ला पूर्ण झाला, जे {y} मध्ये घडले. पूर्ण झाल्यानंतर {n} वर्षांनी त्याचे मुख्य द्वार पुन्हा बांधले गेले. द्वार कोणत्या वर्षी बांधले?",
  ],
  sen: "Go back, then forward: {y} − {k} + {n} = {ans}.",
  shi: "पहले पीछे, फिर आगे: {y} − {k} + {n} = {ans}।",
  smr: "आधी मागे, मग पुढे: {y} − {k} + {n} = {ans}.",
};
const fHistChainBack = (tag: string, lvl: number, want: number, k: Range, n: Range) =>
  T(`histback:${tag}`, lvl, want, [BACK_EVENTS.length, k.n, n.n], HISTBACK, ([i, j, l]) => {
    const e = BACK_EVENTS[i!]!, back = at(k, j!), fwd = at(n, l!), y2 = e.year - back + fwd;
    return { vars: { e: e.en, h: e.hi, m: e.mr, y: e.year, k: back, n: fwd }, answer: y2, expr: `${e.year}-${back}+${fwd}`, decoys: [e.year + back + fwd, y2 + 10, y2 - 1] };
  });

const HISTDECADE: SkinSet = {
  en: ["Which year begins the decade that contains the year {y}?", "The year {y} falls in a decade. What is that decade's first year?", "Name the starting year of the decade holding {y}."],
  hi: ["वर्ष {y} जिस दशक में आता है, वह किस वर्ष से शुरू होता है?", "वर्ष {y} एक दशक में आता है। उस दशक का पहला वर्ष क्या है?", "{y} वाले दशक का प्रारंभिक वर्ष बताइए।"],
  mr: ["{y} हे वर्ष ज्या दशकात येते, ते दशक कोणत्या वर्षी सुरू होते?", "{y} हे वर्ष एका दशकात येते. त्या दशकाचे पहिले वर्ष कोणते?", "{y} असलेल्या दशकाचे सुरुवातीचे वर्ष सांगा."],
  sen: "Drop the last digit to zero: the decade of {y} runs from {ans} to {ans} + 9.",
  shi: "अंतिम अंक शून्य कीजिए: {y} का दशक {ans} से {ans} + 9 तक चलता है।",
  smr: "शेवटचा अंक शून्य करा: {y} चे दशक {ans} ते {ans} + 9 असे चालते.",
};
const fHistDecade = (tag: string, lvl: number, want: number, y: Range) =>
  T(`histdecade:${tag}`, lvl, want, [y.n], HISTDECADE, ([i]) => {
    const year = at(y, i!), rem = year % 10, start = year - rem;
    return { vars: { y: year }, answer: start, expr: `${year}-${rem}`, decoys: [start + 10, start - 10, year], render: (x) => String(x) };
  });

const HISTCENTEND: SkinSet = {
  en: ["In which year does the century containing the year {y} END?", "The year {y} sits in a century. What is that century's final year?", "Find the last year of the century that holds {y}."],
  hi: ["वर्ष {y} वाली शताब्दी किस वर्ष समाप्त होती है?", "वर्ष {y} एक शताब्दी में है। उस शताब्दी का अंतिम वर्ष क्या है?", "{y} वाली शताब्दी का आख़िरी वर्ष निकालिए।"],
  mr: ["{y} हे वर्ष असलेले शतक कोणत्या वर्षी संपते?", "{y} हे वर्ष एका शतकात आहे. त्या शतकाचे शेवटचे वर्ष कोणते?", "{y} असलेल्या शतकाचे अखेरचे वर्ष काढा."],
  sen: "Centuries run x01 to x00: the century of {y} ends in {ans}.",
  shi: "शताब्दी x01 से x00 तक चलती है: {y} की शताब्दी {ans} में समाप्त होती है।",
  smr: "शतक x01 ते x00 चालते: {y} चे शतक {ans} मध्ये संपते.",
};
const fHistCenturyEnd = (tag: string, lvl: number, want: number, y: Range) =>
  T(`histcentend:${tag}`, lvl, want, [y.n], HISTCENTEND, ([i]) => {
    const year = at(y, i!), rem = (year - 1) % 100, century = (year - 1 - rem) / 100 + 1, end = century * 100;
    return { vars: { y: year }, answer: end, expr: `((${year}-1-${rem})/100+1)*100`, decoys: [end - 100, end + 100, end - 1], render: (x) => String(x) };
  });

const HISTSPANCENT: SkinSet = {
  en: ["Starting from the year {y}, how many years remain until its century ends?", "How many years lie between {y} and the final year of its own century?", "From {y}, count the years left in that century."],
  hi: ["वर्ष {y} से उसकी शताब्दी समाप्त होने तक कितने वर्ष बचे हैं?", "{y} और उसकी अपनी शताब्दी के अंतिम वर्ष के बीच कितने वर्ष हैं?", "{y} से उस शताब्दी के बचे वर्ष गिनिए।"],
  mr: ["{y} या वर्षापासून त्याचे शतक संपेपर्यंत किती वर्षे उरली आहेत?", "{y} आणि त्याच्या शतकाच्या शेवटच्या वर्षामध्ये किती वर्षे आहेत?", "{y} पासून त्या शतकातील उरलेली वर्षे मोजा."],
  sen: "The century of {y} ends at {end}; remaining years = {end} − {y} = {ans}.",
  shi: "{y} की शताब्दी {end} में समाप्त होती है; बचे वर्ष = {end} − {y} = {ans}।",
  smr: "{y} चे शतक {end} मध्ये संपते; उरलेली वर्षे = {end} − {y} = {ans}.",
};
const fHistSpanCent = (tag: string, lvl: number, want: number, y: Range) =>
  T(`histspancent:${tag}`, lvl, want, [y.n], HISTSPANCENT, ([i]) => {
    const year = at(y, i!), rem = (year - 1) % 100, end = ((year - 1 - rem) / 100 + 1) * 100, left = end - year;
    return { vars: { y: year, end }, answer: left, expr: `${end}-${year}`, decoys: [left + 10, left - 10, 100 - left], render: (x) => String(x) };
  });

const HISTCENTAFTER: SkinSet = {
  en: ["Which year falls exactly {k} centuries after the year {y}?", "Add {k} full centuries to the year {y}. Which year do you get?", "Starting at {y}, jump forward {k} centuries. Where do you land?"],
  hi: ["वर्ष {y} के ठीक {k} शताब्दी बाद कौन-सा वर्ष आता है?", "वर्ष {y} में {k} पूरी शताब्दियाँ जोड़िए। कौन-सा वर्ष मिलता है?", "{y} से {k} शताब्दी आगे कूदिए। कहाँ पहुँचते हैं?"],
  mr: ["{y} या वर्षानंतर नेमक्या {k} शतकांनी कोणते वर्ष येते?", "{y} या वर्षात {k} पूर्ण शतके मिळवा. कोणते वर्ष मिळते?", "{y} पासून {k} शतके पुढे जा. कुठे पोहोचता?"],
  sen: "One century is 100 years: {y} + {k} × 100 = {ans}.",
  shi: "एक शताब्दी = 100 वर्ष: {y} + {k} × 100 = {ans}।",
  smr: "एक शतक = 100 वर्षे: {y} + {k} × 100 = {ans}.",
};
const fHistCentAfter = (tag: string, lvl: number, want: number, y: Range, k: Range) =>
  T(`histcentafter:${tag}`, lvl, want, [y.n, k.n], HISTCENTAFTER, ([i, j]) => {
    const year = at(y, i!), cent = at(k, j!), y2 = year + 100 * cent;
    return { vars: { y: year, k: cent }, answer: y2, expr: `${year}+${cent}*100`, decoys: [y2 - 100, y2 + 100, year + cent * 10], render: (x) => String(x) };
  });

/* --------------------------------------------------------------------------
   Civics — the numbers democracy actually runs on.
   -------------------------------------------------------------------------- */

const QUORUM_FRACS: { div: number; en: string; hi: string; mr: string }[] = [
  { div: 10, en: "one-tenth", hi: "दसवाँ भाग", mr: "एक दशांश" },
  { div: 4, en: "one-quarter", hi: "चौथाई", mr: "एक चतुर्थांश" },
  { div: 3, en: "one-third", hi: "एक तिहाई", mr: "एक तृतीयांश" },
  { div: 2, en: "half", hi: "आधा", mr: "अर्धा" },
];
const fCivQuorum = (tag: string, lvl: number, want: number, k: Range) =>
  T(
    `civquorum:${tag}`,
    lvl,
    want,
    [k.n, QUORUM_FRACS.length],
    {
      en: ["A council of {n} members needs {frac} of them present for a quorum. How many members is that?"],
      hi: ["{n} सदस्यों की सभा में कोरम के लिए {frach} सदस्य उपस्थित चाहिए। यह कितने सदस्य हैं?"],
      mr: ["{n} सदस्यांच्या सभेत गणपूर्तीसाठी {fracm} सदस्य हजर हवेत. म्हणजे किती सदस्य?"],
      sen: "Divide: {n} ÷ {div} = {ans} members.",
      shi: "भाग दें: {n} ÷ {div} = {ans} सदस्य।",
      smr: "भागा: {n} ÷ {div} = {ans} सदस्य.",
    },
    ([i, j]) => {
      const f = QUORUM_FRACS[j!]!;
      const per = at(k, i!), n = per * f.div;
      return { vars: { n, frac: f.en, frach: f.hi, fracm: f.mr, div: f.div }, answer: per, expr: `${n}/${f.div}`, decoys: [per + 1, per - 1, n - per] };
    },
  );

const fCivMajority = (tag: string, lvl: number, want: number, k: Range) =>
  T(
    `civmaj:${tag}`,
    lvl,
    want,
    [k.n],
    {
      en: ["A house has {n} members, all voting. What is the smallest number of votes that makes a majority?"],
      hi: ["एक सदन में {n} सदस्य हैं, सभी मतदान करते हैं। बहुमत के लिए न्यूनतम कितने मत चाहिए?"],
      mr: ["एका सभागृहात {n} सदस्य आहेत, सर्व मतदान करतात. बहुमतासाठी किमान किती मते हवीत?"],
      sen: "A majority is more than half: {n} ÷ 2 + 1 = {ans} votes.",
      shi: "बहुमत यानी आधे से अधिक: {n} ÷ 2 + 1 = {ans} मत।",
      smr: "बहुमत म्हणजे निम्म्याहून अधिक: {n} ÷ 2 + 1 = {ans} मते.",
    },
    ([i]) => {
      const n = 2 * at(k, i!);
      const maj = n / 2 + 1;
      return { vars: { n }, answer: maj, expr: `${n}/2+1`, decoys: [n / 2, maj + 1, n - maj] };
    },
  );

const fCivRep = (tag: string, lvl: number, want: number, s: Range, u: Range) =>
  T(
    `civrep:${tag}`,
    lvl,
    want,
    [s.n, u.n],
    {
      en: ["An assembly has {s} seats for a population of {p}. On average, how many people does one seat represent?"],
      hi: ["{p} जनसंख्या के लिए विधानसभा में {s} सीटें हैं। औसतन एक सीट कितने लोगों का प्रतिनिधित्व करती है?"],
      mr: ["{p} लोकसंख्येसाठी विधानसभेत {s} जागा आहेत. सरासरी एक जागा किती लोकांचे प्रतिनिधित्व करते?"],
      sen: "Divide: {p} ÷ {s} = {ans} people per seat.",
      shi: "भाग दें: {p} ÷ {s} = {ans} व्यक्ति प्रति सीट।",
      smr: "भागा: {p} ÷ {s} = {ans} व्यक्ती प्रति जागा.",
    },
    ([i, j]) => {
      const seats = at(s, i!), per = at(u, j!), p = seats * per;
      return { vars: { s: seats, p }, answer: per, expr: `${p}/${seats}`, decoys: [per + 100, per - 100, p - seats] };
    },
  );

const fCivTerm = (tag: string, lvl: number, want: number, y: Range) =>
  T(
    `civterm:${tag}`,
    lvl,
    want,
    [y.n, 3],
    {
      en: ["A body elected in {y} serves a full {t}-year term. In which year is the next election due?"],
      hi: ["{y} में चुना गया निकाय पूरा {t} वर्ष का कार्यकाल पूरा करता है। अगला चुनाव किस वर्ष होगा?"],
      mr: ["{y} मध्ये निवडलेली संस्था पूर्ण {t} वर्षांचा कार्यकाळ पूर्ण करते. पुढील निवडणूक कोणत्या वर्षी येईल?"],
      sen: "Add the term: {y} + {t} = {ans}.",
      shi: "कार्यकाल जोड़ें: {y} + {t} = {ans}।",
      smr: "कार्यकाळ मिळवा: {y} + {t} = {ans}.",
    },
    ([i, j]) => {
      const y0 = at(y, i!), t = [4, 5, 6][j!]!;
      const next = y0 + t;
      return { vars: { y: y0, t }, answer: next, expr: `${y0}+${t}`, decoys: [next + 1, next - 1, y0 + 10] };
    },
  );

const CIVQREV: SkinSet = {
  en: ["A council needs {frac} of its members for a quorum, which comes to {q} members. How many members does the council have in all?", "If {frac} of a house is its quorum and the quorum is {q}, find the house's full strength."],
  hi: ["सभा में कोरम के लिए {frach} सदस्य चाहिए, जो {q} सदस्य होते हैं। सभा में कुल कितने सदस्य हैं?", "यदि सदन का {frach} उसका कोरम है और कोरम {q} है, तो सदन की पूरी संख्या निकालिए।"],
  mr: ["सभेत गणपूर्तीसाठी {fracm} सदस्य हवेत, म्हणजे {q} सदस्य. सभेत एकूण किती सदस्य आहेत?", "सभागृहाचा {fracm} भाग म्हणजे गणपूर्ती असून ती {q} आहे, तर सभागृहाची पूर्ण संख्या काढा."],
  sen: "Full strength = quorum × {div} = {q} × {div} = {ans} members.",
  shi: "पूरी संख्या = कोरम × {div} = {q} × {div} = {ans} सदस्य।",
  smr: "पूर्ण संख्या = गणपूर्ती × {div} = {q} × {div} = {ans} सदस्य.",
};
const fCivQuorumRev = (tag: string, lvl: number, want: number, k: Range) =>
  T(`civqrev:${tag}`, lvl, want, [k.n, QUORUM_FRACS.length], CIVQREV, ([i, j]) => {
    const f = QUORUM_FRACS[j!]!, q = at(k, i!), n = q * f.div;
    return { vars: { q, frac: f.en, frach: f.hi, fracm: f.mr, div: f.div }, answer: n, expr: `${q}*${f.div}`, decoys: [n + f.div, n - q, q + f.div] };
  });

const CIVQSHORT: SkinSet = {
  en: [
    "A council of {n} members needs {frac} of them ({q}) for a quorum, but only {p} have arrived. How many more members are needed?",
    "Quorum in a {n}-member house is {frac} of the strength, i.e. {q}. With {p} present, how many are still short?",
  ],
  hi: [
    "{n} सदस्यों की सभा में कोरम के लिए {frach} ({q}) चाहिए, पर केवल {p} आए हैं। और कितने सदस्य चाहिए?",
    "{n} सदस्यीय सदन में कोरम {frach} यानी {q} है। {p} उपस्थित हों तो कितने कम हैं?",
  ],
  mr: [
    "{n} सदस्यांच्या सभेत गणपूर्तीसाठी {fracm} ({q}) हवेत, पण फक्त {p} आले आहेत. आणखी किती सदस्य हवेत?",
    "{n} सदस्यांच्या सभागृहात गणपूर्ती {fracm} म्हणजे {q} आहे. {p} हजर असल्यास किती कमी आहेत?",
  ],
  sen: "Still needed = quorum − present = {q} − {p} = {ans} members.",
  shi: "और चाहिए = कोरम − उपस्थित = {q} − {p} = {ans} सदस्य।",
  smr: "आणखी हवेत = गणपूर्ती − हजर = {q} − {p} = {ans} सदस्य.",
};
const fCivQuorumShort = (tag: string, lvl: number, want: number, k: Range, sR: Range) =>
  T(`civqshort:${tag}`, lvl, want, [k.n, QUORUM_FRACS.length, sR.n], CIVQSHORT, ([i, j, l]) => {
    const f = QUORUM_FRACS[j!]!, q = at(k, i!), n = q * f.div, s = at(sR, l!), p = q - s;
    return { vars: { n, frac: f.en, frach: f.hi, fracm: f.mr, q, p }, answer: s, expr: `${q}-${p}`, decoys: [s + 1, q, n - p] };
  });

const CIVTWOTHIRDS: SkinSet = {
  en: ["A special resolution needs two-thirds of a {n}-member body present. How many members is that?", "Two-thirds of the {n} members of a council must attend a special session. Find that number."],
  hi: ["विशेष प्रस्ताव के लिए {n} सदस्यीय निकाय के दो-तिहाई उपस्थित चाहिए। यह कितने सदस्य हैं?", "परिषद के {n} सदस्यों में से दो-तिहाई को विशेष सत्र में आना है। वह संख्या निकालिए।"],
  mr: ["विशेष ठरावासाठी {n} सदस्यांच्या मंडळाचे दोन-तृतीयांश हजर हवेत. म्हणजे किती सदस्य?", "परिषदेच्या {n} सदस्यांपैकी दोन-तृतीयांशांनी विशेष सत्राला यायचे आहे. ती संख्या काढा."],
  sen: "Two-thirds of {n} = {n} × 2 ÷ 3 = {ans} members.",
  shi: "{n} का दो-तिहाई = {n} × 2 ÷ 3 = {ans} सदस्य।",
  smr: "{n} चे दोन-तृतीयांश = {n} × 2 ÷ 3 = {ans} सदस्य.",
};
const fCivTwoThirds = (tag: string, lvl: number, want: number, k: Range) =>
  T(`civ23:${tag}`, lvl, want, [k.n], CIVTWOTHIRDS, ([i]) => {
    const third = at(k, i!), n = 3 * third, ans = 2 * third;
    return { vars: { n }, answer: ans, expr: `${n}*2/3`, decoys: [third, ans + 1, n - third + 1] };
  });

const CIVPRESENT: SkinSet = {
  en: [
    "A house has {n} members but {a} are absent. Of those present, more than half must vote yes to pass a motion. What is the smallest number of yes votes needed?",
    "Out of {n} members, {a} miss the sitting. A motion passes on a majority of those present. Find the minimum yes votes.",
  ],
  hi: [
    "सदन में {n} सदस्य हैं पर {a} अनुपस्थित हैं। प्रस्ताव पारित करने के लिए उपस्थित सदस्यों में से आधे से अधिक की हाँ चाहिए। न्यूनतम कितने हाँ-मत चाहिए?",
    "{n} सदस्यों में से {a} बैठक में नहीं हैं। प्रस्ताव उपस्थित सदस्यों के बहुमत से पारित होता है। न्यूनतम हाँ-मत निकालिए।",
  ],
  mr: [
    "सभागृहात {n} सदस्य आहेत पण {a} गैरहजर आहेत. ठराव मंजूर होण्यासाठी हजर सदस्यांपैकी निम्म्याहून अधिकांची होय हवी. किमान किती होय-मते हवीत?",
    "{n} सदस्यांपैकी {a} बैठकीला नाहीत. ठराव हजर सदस्यांच्या बहुमताने मंजूर होतो. किमान होय-मते काढा.",
  ],
  sen: "Present = {n} − {a}; majority of present = ({n} − {a}) ÷ 2 + 1 = {ans} votes.",
  shi: "उपस्थित = {n} − {a}; उपस्थित का बहुमत = ({n} − {a}) ÷ 2 + 1 = {ans} मत।",
  smr: "हजर = {n} − {a}; हजरांचे बहुमत = ({n} − {a}) ÷ 2 + 1 = {ans} मते.",
};
const fCivPresentMaj = (tag: string, lvl: number, want: number, hR: Range, aR: Range) =>
  T(`civpresent:${tag}`, lvl, want, [hR.n, aR.n], CIVPRESENT, ([i, j]) => {
    const half = at(hR, i!), a = at(aR, j!), n = 2 * half + a, maj = half + 1;
    return { vars: { n, a }, answer: maj, expr: `(${n}-${a})/2+1`, decoys: [half, n / 2 + 1, maj + 1] };
  });

const CIVQPCT: SkinSet = {
  en: ["In a body of {n} members, {p} attended the session. What percentage of the membership was present?", "{p} of the {n} members of a council came to vote. Find the attendance percentage."],
  hi: ["{n} सदस्यों के निकाय में {p} सत्र में आए। सदस्यता का कितना प्रतिशत उपस्थित था?", "परिषद के {n} सदस्यों में से {p} मतदान करने आए। उपस्थिति का प्रतिशत निकालिए।"],
  mr: ["{n} सदस्यांच्या मंडळात {p} सत्राला आले. सदस्यत्वाच्या किती टक्के हजर होते?", "परिषदेच्या {n} सदस्यांपैकी {p} मतदानाला आले. हजेरीची टक्केवारी काढा."],
  sen: "Percentage = present × 100 ÷ total = {p} × 100 ÷ {n} = {ans}%.",
  shi: "प्रतिशत = उपस्थित × 100 ÷ कुल = {p} × 100 ÷ {n} = {ans}%।",
  smr: "टक्केवारी = हजर × 100 ÷ एकूण = {p} × 100 ÷ {n} = {ans}%.",
};
const CIVQPCT_PCTS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];
const fCivQuorumPct = (tag: string, lvl: number, want: number, jR: Range) =>
  T(`civqpct:${tag}`, lvl, want, [jR.n, CIVQPCT_PCTS.length], CIVQPCT, ([i, j]) => {
    const n = 20 * at(jR, i!), pct = CIVQPCT_PCTS[j!]!, p = (n * pct) / 100;
    return { vars: { n, p }, answer: pct, expr: `${p}*100/${n}`, decoys: [pct + 5, pct - 5, p], render: (x) => `${fmt(x)}%` };
  });

const CIVMAJGAP: SkinSet = {
  en: [
    "A house of {n} members needs {maj} votes for a majority. A party holds {p} seats. How many more seats does it need for a majority on its own?",
    "In a {n}-seat assembly (majority mark {maj}), a party won {p} seats. Find its shortfall from a majority.",
  ],
  hi: [
    "{n} सदस्यों के सदन में बहुमत के लिए {maj} मत चाहिए। एक दल के पास {p} सीटें हैं। अकेले बहुमत के लिए उसे और कितनी सीटें चाहिए?",
    "{n} सीटों की विधानसभा (बहुमत का आँकड़ा {maj}) में दल ने {p} सीटें जीतीं। बहुमत से उसकी कमी निकालिए।",
  ],
  mr: [
    "{n} सदस्यांच्या सभागृहात बहुमतासाठी {maj} मते हवीत. एका पक्षाकडे {p} जागा आहेत. स्वबळावर बहुमतासाठी त्याला आणखी किती जागा हव्यात?",
    "{n} जागांच्या विधानसभेत (बहुमताचा आकडा {maj}) पक्षाने {p} जागा जिंकल्या. बहुमतापासूनची तूट काढा.",
  ],
  sen: "Shortfall = majority mark − seats won = {maj} − {p} = {ans} seats.",
  shi: "कमी = बहुमत का आँकड़ा − जीती सीटें = {maj} − {p} = {ans} सीटें।",
  smr: "तूट = बहुमताचा आकडा − जिंकलेल्या जागा = {maj} − {p} = {ans} जागा.",
};
const fCivMajGap = (tag: string, lvl: number, want: number, hR: Range, sR: Range) =>
  T(`civmajgap:${tag}`, lvl, want, [hR.n, sR.n], CIVMAJGAP, ([i, j]) => {
    const half = at(hR, i!), n = 2 * half, maj = half + 1, s = at(sR, j!), p = maj - s;
    return { vars: { n, maj, p }, answer: s, expr: `${maj}-${p}`, decoys: [s + 1, s - 1, half - p] };
  });

const CIVAMEND: SkinSet = {
  en: [
    "A constitutional amendment needs at least two-thirds of the {n} members present and voting. All {n} vote. What is the minimum number of yes votes?",
    "All {n} members vote on an amendment that requires a two-thirds majority. Find the smallest passing count.",
  ],
  hi: [
    "संविधान संशोधन के लिए उपस्थित और मतदान करने वाले {n} सदस्यों के कम से कम दो-तिहाई चाहिए। सभी {n} मतदान करते हैं। न्यूनतम हाँ-मत कितने?",
    "सभी {n} सदस्य ऐसे संशोधन पर मतदान करते हैं जिसे दो-तिहाई बहुमत चाहिए। न्यूनतम पारित संख्या निकालिए।",
  ],
  mr: [
    "घटनादुरुस्तीसाठी हजर राहून मतदान करणाऱ्या {n} सदस्यांपैकी किमान दोन-तृतीयांश हवेत. सर्व {n} मतदान करतात. किमान होय-मते किती?",
    "दोन-तृतीयांश बहुमत लागणाऱ्या दुरुस्तीवर सर्व {n} सदस्य मतदान करतात. किमान मंजुरीची संख्या काढा.",
  ],
  sen: "Two-thirds of {n} = {n} × 2 ÷ 3 = {ans} yes votes.",
  shi: "{n} का दो-तिहाई = {n} × 2 ÷ 3 = {ans} हाँ-मत।",
  smr: "{n} चे दोन-तृतीयांश = {n} × 2 ÷ 3 = {ans} होय-मते.",
};
const fCivTwoThirdsVote = (tag: string, lvl: number, want: number, k: Range) =>
  T(`civamend:${tag}`, lvl, want, [k.n], CIVAMEND, ([i]) => {
    const third = at(k, i!), n = 3 * third, ans = 2 * third;
    return { vars: { n }, answer: ans, expr: `${n}*2/3`, decoys: [third, n / 3 + 1, ans - 1] };
  });

const CIVCOAL: SkinSet = {
  en: [
    "An assembly of {n} seats has a majority mark of {maj}. Two allied parties hold {p1} and {p2} seats. How many more seats does the alliance need for a majority?",
    "In a {n}-member house (majority {maj}), partners with {p1} and {p2} seats join hands. Find their shortfall.",
  ],
  hi: [
    "{n} सीटों की विधानसभा में बहुमत का आँकड़ा {maj} है। दो सहयोगी दलों के पास {p1} और {p2} सीटें हैं। गठबंधन को बहुमत के लिए और कितनी सीटें चाहिए?",
    "{n} सदस्यीय सदन (बहुमत {maj}) में {p1} और {p2} सीटों वाले साथी मिलते हैं। उनकी कमी निकालिए।",
  ],
  mr: [
    "{n} जागांच्या विधानसभेत बहुमताचा आकडा {maj} आहे. दोन मित्रपक्षांकडे {p1} व {p2} जागा आहेत. आघाडीला बहुमतासाठी आणखी किती जागा हव्यात?",
    "{n} सदस्यांच्या सभागृहात (बहुमत {maj}) {p1} आणि {p2} जागांचे भागीदार एकत्र येतात. त्यांची तूट काढा.",
  ],
  sen: "Alliance = {p1} + {p2}; shortfall = {maj} − ({p1} + {p2}) = {ans} seats.",
  shi: "गठबंधन = {p1} + {p2}; कमी = {maj} − ({p1} + {p2}) = {ans} सीटें।",
  smr: "आघाडी = {p1} + {p2}; तूट = {maj} − ({p1} + {p2}) = {ans} जागा.",
};
const fCivCoalition = (tag: string, lvl: number, want: number, hR: Range, aR: Range, sR: Range) =>
  T(`civcoal:${tag}`, lvl, want, [hR.n, aR.n, sR.n], CIVCOAL, ([i, j, k]) => {
    const half = at(hR, i!), n = 2 * half, maj = half + 1, p1 = at(aR, j!), s = at(sR, k!);
    const p2 = maj - s - p1;
    return { vars: { n, maj, p1, p2 }, answer: s, expr: `${maj}-(${p1}+${p2})`, decoys: [s + 1, s - 1, maj - p1] };
  });

const CIVRATIO: SkinSet = {
  en: [
    "In a {n}-seat council, two parties split every seat in the ratio {ra} : {rb}. How many seats does the larger party get?",
    "A house of {n} seats divides {ra} : {rb} between two parties. Find the bigger share.",
  ],
  hi: [
    "{n} सीटों की परिषद में दो दल हर सीट {ra} : {rb} के अनुपात में बाँटते हैं। बड़े दल को कितनी सीटें मिलती हैं?",
    "{n} सीटों का सदन दो दलों में {ra} : {rb} बँटता है। बड़ा हिस्सा निकालिए।",
  ],
  mr: [
    "{n} जागांच्या परिषदेत दोन पक्ष प्रत्येक जागा {ra} : {rb} या प्रमाणात वाटतात. मोठ्या पक्षाला किती जागा मिळतात?",
    "{n} जागांचे सभागृह दोन पक्षांत {ra} : {rb} असे वाटले जाते. मोठा वाटा काढा.",
  ],
  sen: "Each ratio unit = {n} ÷ ({ra} + {rb}); larger share = {n} × {ra} ÷ ({ra} + {rb}) = {ans} seats.",
  shi: "अनुपात की एक इकाई = {n} ÷ ({ra} + {rb}); बड़ा हिस्सा = {n} × {ra} ÷ ({ra} + {rb}) = {ans} सीटें।",
  smr: "प्रमाणाचे एक एकक = {n} ÷ ({ra} + {rb}); मोठा वाटा = {n} × {ra} ÷ ({ra} + {rb}) = {ans} जागा.",
};
const CIV_RATIOS: [number, number][] = [[2, 1], [3, 1], [3, 2], [4, 1], [4, 3], [5, 2], [5, 3], [5, 4], [7, 3], [7, 5]];
const fCivRatioSeats = (tag: string, lvl: number, want: number, uR: Range) =>
  T(`civratio:${tag}`, lvl, want, [uR.n, CIV_RATIOS.length], CIVRATIO, ([i, j]) => {
    const u = at(uR, i!), [ra, rb] = CIV_RATIOS[j!]!, n = (ra + rb) * u, big = ra * u;
    return { vars: { n, ra, rb }, answer: big, expr: `${n}*${ra}/(${ra}+${rb})`, decoys: [rb * u, big + u, n - u] };
  });

const CIVIMPEACH: SkinSet = {
  en: [
    "A special resolution must be passed by two-thirds of the combined strength of two houses with {n1} and {n2} members. How many votes are needed?",
    "Two chambers of {n1} and {n2} members sit together; a motion needs two-thirds of the joint sitting. Find the required votes.",
  ],
  hi: [
    "{n1} और {n2} सदस्यों वाले दोनों सदनों की संयुक्त संख्या के दो-तिहाई से विशेष प्रस्ताव पारित होना है। कितने मत चाहिए?",
    "{n1} और {n2} सदस्यों के दो सदन साथ बैठते हैं; प्रस्ताव को संयुक्त बैठक के दो-तिहाई चाहिए। आवश्यक मत निकालिए।",
  ],
  mr: [
    "{n1} आणि {n2} सदस्यांच्या दोन सभागृहांच्या एकत्रित संख्येच्या दोन-तृतीयांशांनी विशेष ठराव मंजूर व्हायचा आहे. किती मते हवीत?",
    "{n1} व {n2} सदस्यांची दोन सभागृहे एकत्र बसतात; ठरावाला संयुक्त बैठकीचे दोन-तृतीयांश हवेत. आवश्यक मते काढा.",
  ],
  sen: "Joint strength = {n1} + {n2}; two-thirds = ({n1} + {n2}) × 2 ÷ 3 = {ans} votes.",
  shi: "संयुक्त संख्या = {n1} + {n2}; दो-तिहाई = ({n1} + {n2}) × 2 ÷ 3 = {ans} मत।",
  smr: "एकत्रित संख्या = {n1} + {n2}; दोन-तृतीयांश = ({n1} + {n2}) × 2 ÷ 3 = {ans} मते.",
};
const fCivImpeach = (tag: string, lvl: number, want: number, kR: Range, n2R: Range) =>
  T(`civimpeach:${tag}`, lvl, want, [kR.n, n2R.n], CIVIMPEACH, ([i, j]) => {
    const k = at(kR, i!), total = 3 * k, n2 = at(n2R, j!), n1 = total - n2, ans = 2 * k;
    return { vars: { n1, n2 }, answer: ans, expr: `(${n1}+${n2})*2/3`, decoys: [k, ans + 1, total / 2 + 1] };
  });

const CIVREPPOP: SkinSet = {
  en: ["Each of the {s} seats in an assembly represents {per} people on average. What is the total population?", "An assembly's {s} seats average {per} people per seat. Find the population it represents."],
  hi: ["विधानसभा की {s} सीटों में हर सीट औसतन {per} लोगों का प्रतिनिधित्व करती है। कुल जनसंख्या क्या है?", "विधानसभा की {s} सीटें औसतन {per} व्यक्ति प्रति सीट हैं। वह कितनी जनसंख्या का प्रतिनिधित्व करती है?"],
  mr: ["विधानसभेच्या {s} जागांपैकी प्रत्येक जागा सरासरी {per} लोकांचे प्रतिनिधित्व करते. एकूण लोकसंख्या किती?", "विधानसभेच्या {s} जागा सरासरी {per} व्यक्ती प्रति जागा आहेत. ती किती लोकसंख्येचे प्रतिनिधित्व करते?"],
  sen: "Population = seats × people per seat = {s} × {per} = {ans}.",
  shi: "जनसंख्या = सीटें × व्यक्ति प्रति सीट = {s} × {per} = {ans}।",
  smr: "लोकसंख्या = जागा × व्यक्ती प्रति जागा = {s} × {per} = {ans}.",
};
const fCivRepPop = (tag: string, lvl: number, want: number, s: Range, u: Range) =>
  T(`civreppop:${tag}`, lvl, want, [s.n, u.n], CIVREPPOP, ([i, j]) => {
    const seats = at(s, i!), per = at(u, j!), p = seats * per;
    return { vars: { s: seats, per }, answer: p, expr: `${seats}*${per}`, decoys: [p + per, p - seats, seats + per] };
  });

const CIVREPSEATS: SkinSet = {
  en: ["A population of {p} is represented at {per} people per seat. How many seats is that?", "With one seat for every {per} people, how many seats does a population of {p} get?"],
  hi: ["{p} जनसंख्या का प्रतिनिधित्व {per} व्यक्ति प्रति सीट की दर से होता है। कितनी सीटें बनीं?", "हर {per} लोगों पर एक सीट हो तो {p} जनसंख्या को कितनी सीटें मिलेंगी?"],
  mr: ["{p} लोकसंख्येचे प्रतिनिधित्व {per} व्यक्ती प्रति जागा या दराने होते. किती जागा होतात?", "दर {per} लोकांमागे एक जागा असल्यास {p} लोकसंख्येला किती जागा मिळतील?"],
  sen: "Seats = population ÷ people per seat = {p} ÷ {per} = {ans}.",
  shi: "सीटें = जनसंख्या ÷ व्यक्ति प्रति सीट = {p} ÷ {per} = {ans}।",
  smr: "जागा = लोकसंख्या ÷ व्यक्ती प्रति जागा = {p} ÷ {per} = {ans}.",
};
const fCivRepSeats = (tag: string, lvl: number, want: number, s: Range, u: Range) =>
  T(`civrepseats:${tag}`, lvl, want, [s.n, u.n], CIVREPSEATS, ([i, j]) => {
    const seats = at(s, i!), per = at(u, j!), p = seats * per;
    return { vars: { p, per }, answer: seats, expr: `${p}/${per}`, decoys: [seats + 5, seats - 2, per] };
  });

const CIVREPGROW: SkinSet = {
  en: [
    "A constituency's seat now represents {per} people. If the population grows {p}% with no new seats, how many people will the seat represent?",
    "Today one seat stands for {per} people. After {p}% growth and the same seat count, find the new number per seat.",
  ],
  hi: [
    "निर्वाचन क्षेत्र की सीट अभी {per} लोगों का प्रतिनिधित्व करती है। जनसंख्या {p}% बढ़े और नई सीटें न बनें, तो सीट कितने लोगों की होगी?",
    "आज एक सीट {per} लोगों की है। {p}% वृद्धि के बाद, उतनी ही सीटों पर, नई प्रति-सीट संख्या निकालिए।",
  ],
  mr: [
    "मतदारसंघाची जागा आता {per} लोकांचे प्रतिनिधित्व करते. लोकसंख्या {p}% वाढली आणि नव्या जागा नाहीत, तर जागेवर किती लोक येतील?",
    "आज एक जागा {per} लोकांची आहे. {p}% वाढीनंतर, तितक्याच जागांवर, नवी प्रति-जागा संख्या काढा.",
  ],
  sen: "New count = {per} × (100 + {p}) ÷ 100 = {ans} people per seat.",
  shi: "नई संख्या = {per} × (100 + {p}) ÷ 100 = {ans} व्यक्ति प्रति सीट।",
  smr: "नवी संख्या = {per} × (100 + {p}) ÷ 100 = {ans} व्यक्ती प्रति जागा.",
};
const fCivRepGrow = (tag: string, lvl: number, want: number, jR: Range, pR: Range) =>
  T(`civrepgrow:${tag}`, lvl, want, [jR.n, pR.n], CIVREPGROW, ([i, j]) => {
    const per = 20 * at(jR, i!), p = 5 * at(pR, j!), np = (per * (100 + p)) / 100;
    return { vars: { per, p }, answer: np, expr: `${per}*(100+${p})/100`, decoys: [per + p, np + 20, (per * p) / 100] };
  });

const CIVREPTWO: SkinSet = {
  en: [
    "State X gives each of its {s1} seats {per1} people; state Y gives each of its {s2} seats {per2} people. How many MORE people does an X seat represent than a Y seat?",
    "Compare representation: X ({s1} seats, {per1} people each) and Y ({s2} seats, {per2} people each). Find the per-seat difference.",
  ],
  hi: [
    "राज्य X की {s1} सीटों में हर सीट {per1} लोगों की है; राज्य Y की {s2} सीटों में हर सीट {per2} लोगों की। X की सीट Y की सीट से कितने अधिक लोगों की है?",
    "प्रतिनिधित्व तुलना: X ({s1} सीटें, {per1} प्रति सीट) और Y ({s2} सीटें, {per2} प्रति सीट)। प्रति-सीट अंतर निकालिए।",
  ],
  mr: [
    "राज्य X च्या {s1} जागांपैकी प्रत्येक जागा {per1} लोकांची आहे; राज्य Y च्या {s2} जागांपैकी प्रत्येक {per2} लोकांची. X ची जागा Y च्या जागेपेक्षा किती जास्त लोकांची आहे?",
    "प्रतिनिधित्वाची तुलना: X ({s1} जागा, प्रत्येकी {per1}) आणि Y ({s2} जागा, प्रत्येकी {per2}). प्रति-जागा फरक काढा.",
  ],
  sen: "Difference = {per1} − {per2} = {ans} people per seat.",
  shi: "अंतर = {per1} − {per2} = {ans} व्यक्ति प्रति सीट।",
  smr: "फरक = {per1} − {per2} = {ans} व्यक्ती प्रति जागा.",
};
const CIVREPTWO_SEATS: [number, number][] = [[40, 60], [50, 80], [70, 90], [120, 150]];
const fCivRepTwo = (tag: string, lvl: number, want: number, perR: Range, dR: Range) =>
  T(`civreptwo:${tag}`, lvl, want, [perR.n, dR.n, CIVREPTWO_SEATS.length], CIVREPTWO, ([i, j, k]) => {
    const per1 = at(perR, i!), d = at(dR, j!), per2 = per1 - d;
    const [s1, s2] = CIVREPTWO_SEATS[k!]!;
    return { vars: { s1, per1, s2, per2 }, answer: d, expr: `${per1}-${per2}`, decoys: [d + 50, d - 10, per1], render: fmt };
  });

const CIVREPMERGE: SkinSet = {
  en: [
    "Two districts merge: one with {s1} seats for {p1} people, the other with {s2} seats for {p2} people. After the merger, how many people does each seat represent on average?",
    "A merged council keeps all {s1} + {s2} seats for populations of {p1} and {p2}. Find the new average per seat.",
  ],
  hi: [
    "दो जिले मिलते हैं: एक में {p1} लोगों के लिए {s1} सीटें, दूसरे में {p2} लोगों के लिए {s2} सीटें। विलय के बाद हर सीट औसतन कितने लोगों की होगी?",
    "विलय के बाद परिषद {p1} और {p2} जनसंख्या के लिए {s1} + {s2} सीटें रखती है। नई प्रति-सीट औसत निकालिए।",
  ],
  mr: [
    "दोन जिल्हे विलीन होतात: एकात {p1} लोकांसाठी {s1} जागा, दुसऱ्यात {p2} लोकांसाठी {s2} जागा. विलीनीकरणानंतर प्रत्येक जागा सरासरी किती लोकांची असेल?",
    "विलीन परिषदेकडे {p1} व {p2} लोकसंख्येसाठी {s1} + {s2} जागा राहतात. नवी प्रति-जागा सरासरी काढा.",
  ],
  sen: "Average = total people ÷ total seats = ({p1} + {p2}) ÷ ({s1} + {s2}) = {ans} people per seat.",
  shi: "औसत = कुल जनसंख्या ÷ कुल सीटें = ({p1} + {p2}) ÷ ({s1} + {s2}) = {ans} व्यक्ति प्रति सीट।",
  smr: "सरासरी = एकूण लोक ÷ एकूण जागा = ({p1} + {p2}) ÷ ({s1} + {s2}) = {ans} व्यक्ती प्रति जागा.",
};
const fCivRepMerge = (tag: string, lvl: number, want: number, rR: Range, s1R: Range, s2R: Range, dR: Range) =>
  T(`civrepmerge:${tag}`, lvl, want, [rR.n, s1R.n, s2R.n, dR.n], CIVREPMERGE, ([i, j, k, l]) => {
    const rho = at(rR, i!), s1 = at(s1R, j!), s2 = at(s2R, k!), delta = at(dR, l!);
    const p1 = (rho + delta) * s1, p2 = rho * (s1 + s2) - p1;
    return { vars: { s1, p1, s2, p2 }, answer: rho, expr: `(${p1}+${p2})/(${s1}+${s2})`, decoys: [rho + delta, rho - delta, rho + 1], render: fmt };
  });

const CIVTERMBACK: SkinSet = {
  en: ["A body's full {t}-year term ends in {y}. In which year was it elected?", "If a {t}-year term runs out in {y}, when did it begin?"],
  hi: ["निकाय का पूरा {t} वर्ष का कार्यकाल {y} में समाप्त होता है। वह किस वर्ष चुना गया था?", "यदि {t} वर्ष का कार्यकाल {y} में पूरा होता है, तो वह कब शुरू हुआ?"],
  mr: ["संस्थेचा पूर्ण {t} वर्षांचा कार्यकाळ {y} मध्ये संपतो. ती कोणत्या वर्षी निवडली गेली?", "{t} वर्षांचा कार्यकाळ {y} मध्ये संपत असेल, तर तो केव्हा सुरू झाला?"],
  sen: "Subtract the term: {y} − {t} = {ans}.",
  shi: "कार्यकाल घटाएँ: {y} − {t} = {ans}।",
  smr: "कार्यकाळ वजा करा: {y} − {t} = {ans}.",
};
const fCivTermBack = (tag: string, lvl: number, want: number, y: Range) =>
  T(`civtermback:${tag}`, lvl, want, [y.n, 3], CIVTERMBACK, ([i, j]) => {
    const y0 = at(y, i!), t = [4, 5, 6][j!]!, start = y0 - t;
    return { vars: { y: y0, t }, answer: start, expr: `${y0}-${t}`, decoys: [start + 1, start - 1, y0 - 10] };
  });

const CIVTERMCOUNT: SkinSet = {
  en: [
    "A council is elected in {y} and every {t} years after that. Counting the {y} election, how many elections happen up to and including the year {y2}?",
    "Elections run every {t} years starting in {y}. How many take place from {y} to {y2} inclusive?",
  ],
  hi: [
    "परिषद {y} में और उसके बाद हर {t} वर्ष में चुनी जाती है। {y} का चुनाव गिनते हुए, {y2} तक कुल कितने चुनाव होंगे?",
    "{y} से हर {t} वर्ष में चुनाव होते हैं। {y} से {y2} तक (दोनों मिलाकर) कितने होंगे?",
  ],
  mr: [
    "परिषद {y} मध्ये आणि त्यानंतर दर {t} वर्षांनी निवडली जाते. {y} ची निवडणूक धरून, {y2} पर्यंत एकूण किती निवडणुका होतील?",
    "{y} पासून दर {t} वर्षांनी निवडणुका होतात. {y} ते {y2} (दोन्ही धरून) किती होतील?",
  ],
  sen: "Years elapsed = {y2} − {y} = {n}; elections = {n} ÷ {t} + 1 = {ans}.",
  shi: "बीते वर्ष = {y2} − {y} = {n}; चुनाव = {n} ÷ {t} + 1 = {ans}।",
  smr: "गेलेली वर्षे = {y2} − {y} = {n}; निवडणुका = {n} ÷ {t} + 1 = {ans}.",
};
const fCivTermCount = (tag: string, lvl: number, want: number, y: Range, kR: Range) =>
  T(`civtermcount:${tag}`, lvl, want, [y.n, 3, kR.n], CIVTERMCOUNT, ([i, j, l]) => {
    const y0 = at(y, i!), t = [4, 5, 6][j!]!, k = at(kR, l!), n = t * k, y2 = y0 + n;
    return { vars: { y: y0, t, y2, n }, answer: k + 1, expr: `${n}/${t}+1`, decoys: [k, k + 2, n], render: fmt };
  });

const CIVTERMNTH: SkinSet = {
  en: [
    "A body is first elected in {y} with a fixed {t}-year term. In which year is its {nth}th election held?",
    "Starting from the {y} election and repeating every {t} years, when does election number {nth} take place?",
  ],
  hi: [
    "निकाय पहली बार {y} में चुना जाता है, कार्यकाल {t} वर्ष का है। उसका {nth}वाँ चुनाव किस वर्ष होगा?",
    "{y} के चुनाव से शुरू होकर हर {t} वर्ष में दोहराते हुए, {nth}वाँ चुनाव कब होगा?",
  ],
  mr: [
    "संस्था पहिल्यांदा {y} मध्ये निवडली जाते, कार्यकाळ {t} वर्षांचा आहे. तिची {nth}वी निवडणूक कोणत्या वर्षी होईल?",
    "{y} च्या निवडणुकीपासून दर {t} वर्षांनी होत, {nth}वी निवडणूक केव्हा होईल?",
  ],
  sen: "Election {nth} comes after {nth} − 1 terms: {y} + ({nth} − 1) × {t} = {ans}.",
  shi: "{nth}वाँ चुनाव {nth} − 1 कार्यकाल बाद: {y} + ({nth} − 1) × {t} = {ans}।",
  smr: "{nth}वी निवडणूक {nth} − 1 कार्यकाळांनंतर: {y} + ({nth} − 1) × {t} = {ans}.",
};
const fCivTermNth = (tag: string, lvl: number, want: number, y: Range, nthR: Range) =>
  T(`civtermnth:${tag}`, lvl, want, [y.n, 3, nthR.n], CIVTERMNTH, ([i, j, l]) => {
    const y0 = at(y, i!), t = [4, 5, 6][j!]!, nth = at(nthR, l!), y2 = y0 + (nth - 1) * t;
    return { vars: { y: y0, t, nth }, answer: y2, expr: `${y0}+(${nth}-1)*${t}`, decoys: [y2 + t, y2 - t, y0 + nth * t] };
  });

const CIVTERMMID: SkinSet = {
  en: [
    "A council elected in {y} completes {c} full {t}-year terms; {d} years into the next term it is dissolved and a fresh election is held. In which year?",
    "From {y}, a body serves {c} complete terms of {t} years each, then falls {d} years into the following term. Which year is that?",
  ],
  hi: [
    "{y} में चुनी परिषद {t}-{t} वर्ष के {c} पूरे कार्यकाल निभाती है; अगले कार्यकाल के {d} वर्ष बाद वह भंग होती है और नया चुनाव होता है। किस वर्ष?",
    "{y} से निकाय {t} वर्ष के {c} पूरे कार्यकाल चलाता है, फिर अगले कार्यकाल में {d} वर्ष बीतते हैं। वह कौन-सा वर्ष है?",
  ],
  mr: [
    "{y} मध्ये निवडलेली परिषद {t} वर्षांचे {c} पूर्ण कार्यकाळ पार पाडते; पुढील कार्यकाळात {d} वर्षांनी ती विसर्जित होऊन नवी निवडणूक होते. कोणत्या वर्षी?",
    "{y} पासून संस्था {t} वर्षांचे {c} पूर्ण कार्यकाळ चालवते, मग पुढील कार्यकाळात {d} वर्षे जातात. ते कोणते वर्ष?",
  ],
  sen: "Count forward: {y} + {c} × {t} + {d} = {ans}.",
  shi: "आगे गिनें: {y} + {c} × {t} + {d} = {ans}।",
  smr: "पुढे मोजा: {y} + {c} × {t} + {d} = {ans}.",
};
const fCivTermMid = (tag: string, lvl: number, want: number, y: Range, cR: Range, dR: Range) =>
  T(`civtermmid:${tag}`, lvl, want, [y.n, 3, cR.n, dR.n], CIVTERMMID, ([i, j, k, l]) => {
    const y0 = at(y, i!), t = [4, 5, 6][j!]!, c = at(cR, k!), d = at(dR, l!), y2 = y0 + c * t + d;
    return { vars: { y: y0, t, c, d }, answer: y2, expr: `${y0}+${c}*${t}+${d}`, decoys: [y2 - d, y2 + t, y2 - 1] };
  });

const CIVTERMSYNC: SkinSet = {
  en: [
    "A village council (term {t1} years) and a district board (term {t2} years) are both elected in {y}. In which year are their elections next held together?",
    "Two bodies elected together in {y} have terms of {t1} and {t2} years. When do their election years coincide again?",
    "In {y} both a municipal committee ({t1}-year term) and a state assembly ({t2}-year term) go to polls. Which year sees the next joint election?",
    "Elections for terms of {t1} and {t2} years both fall in {y}. Find the next common election year.",
  ],
  hi: [
    "ग्राम परिषद (कार्यकाल {t1} वर्ष) और जिला बोर्ड (कार्यकाल {t2} वर्ष) दोनों {y} में चुने जाते हैं। उनके चुनाव अगली बार एक साथ किस वर्ष होंगे?",
    "{y} में साथ चुने गए दो निकायों के कार्यकाल {t1} और {t2} वर्ष हैं। उनके चुनावी वर्ष फिर कब मिलेंगे?",
    "{y} में नगर समिति ({t1} वर्ष) और विधानसभा ({t2} वर्ष) दोनों के चुनाव होते हैं। अगला साझा चुनावी वर्ष कौन-सा होगा?",
    "{t1} और {t2} वर्ष के कार्यकालों के चुनाव दोनों {y} में पड़ते हैं। अगला समान चुनावी वर्ष निकालिए।",
  ],
  mr: [
    "ग्रामपरिषद (कार्यकाळ {t1} वर्षे) आणि जिल्हा मंडळ (कार्यकाळ {t2} वर्षे) दोन्ही {y} मध्ये निवडली जातात. त्यांच्या निवडणुका पुढे एकत्र कोणत्या वर्षी होतील?",
    "{y} मध्ये एकत्र निवडलेल्या दोन संस्थांचे कार्यकाळ {t1} व {t2} वर्षे आहेत. त्यांची निवडणूक वर्षे पुन्हा केव्हा जुळतील?",
    "{y} मध्ये नगर समिती ({t1} वर्षे) आणि विधानसभा ({t2} वर्षे) दोघांच्या निवडणुका होतात. पुढील सामायिक निवडणूक वर्ष कोणते?",
    "{t1} आणि {t2} वर्षांच्या कार्यकाळांच्या निवडणुका दोन्ही {y} मध्ये येतात. पुढील समान निवडणूक वर्ष काढा.",
  ],
  sen: "They meet after the LCM of {t1} and {t2}, i.e. {lcm} years: {y} + {lcm} = {ans}.",
  shi: "वे {t1} और {t2} के लघुत्तम समापवर्त्य यानी {lcm} वर्ष बाद मिलते हैं: {y} + {lcm} = {ans}।",
  smr: "ते {t1} व {t2} च्या लसावि म्हणजे {lcm} वर्षांनी जुळतात: {y} + {lcm} = {ans}.",
};
const CIV_SYNC: [number, number, number][] = [[4, 5, 20], [4, 6, 12], [5, 6, 30]];
const fCivTermSync = (tag: string, lvl: number, want: number, y: Range) =>
  T(`civtermsync:${tag}`, lvl, want, [y.n, CIV_SYNC.length], CIVTERMSYNC, ([i, j]) => {
    const y0 = at(y, i!), [t1, t2, lcm] = CIV_SYNC[j!]!, y2 = y0 + lcm;
    return { vars: { y: y0, t1, t2, lcm }, answer: y2, expr: `${y0}+${lcm}`, decoys: [y0 + t1 * t2, y0 + t1 + t2, y2 + t1] };
  });

/* --------------------------------------------------------------------------
   Economics — the money maths a household actually does.
   -------------------------------------------------------------------------- */

const fEcoDiscount = (tag: string, lvl: number, want: number, u: Range) =>
  T(
    `ecodisc:${tag}`,
    lvl,
    want,
    [u.n, 18],
    {
      en: ["A shop offers {p}% off on an item priced ₹{price}. What do you pay?", "An item costs ₹{price} with a {p}% discount. Find the final price."],
      hi: ["₹{price} की वस्तु पर दुकान {p}% छूट देती है। आप कितना चुकाएँगे?", "₹{price} की वस्तु पर {p}% छूट है। अंतिम कीमत निकालिए।"],
      mr: ["₹{price} च्या वस्तूवर दुकान {p}% सूट देते. तुम्ही किती द्याल?", "₹{price} च्या वस्तूवर {p}% सूट आहे. अंतिम किंमत काढा."],
      sen: "Discount = {price} × {p} ÷ 100; pay {price} − discount = ₹{ans}.",
      shi: "छूट = {price} × {p} ÷ 100; भुगतान = {price} − छूट = ₹{ans}।",
      smr: "सूट = {price} × {p} ÷ 100; द्यायचे = {price} − सूट = ₹{ans}.",
    },
    ([i, j]) => {
      const p = 5 * (1 + j!);
      const price = 20 * at(u, i!);
      const pay = price - (price * p) / 100;
      return { vars: { p, price }, answer: pay, expr: `${price}-${price}*${p}/100`, decoys: [(price * p) / 100, price - p, pay + 5], render: rupees };
    },
  );

const fEcoGST = (tag: string, lvl: number, want: number, u: Range) =>
  T(
    `ecogst:${tag}`,
    lvl,
    want,
    [u.n, 4],
    {
      en: ["An item's base price is ₹{price} and tax is charged at {p}%. What is the total bill?"],
      hi: ["वस्तु का मूल दाम ₹{price} है और {p}% कर लगता है। कुल बिल कितना होगा?"],
      mr: ["वस्तूची मूळ किंमत ₹{price} आहे आणि {p}% कर लागतो. एकूण बिल किती?"],
      sen: "Tax = {price} × {p} ÷ 100; total = {price} + tax = ₹{ans}.",
      shi: "कर = {price} × {p} ÷ 100; कुल = {price} + कर = ₹{ans}।",
      smr: "कर = {price} × {p} ÷ 100; एकूण = {price} + कर = ₹{ans}.",
    },
    ([i, j]) => {
      const p = [5, 12, 18, 28][j!]!;
      const price = 100 * at(u, i!);
      const total = price + (price * p) / 100;
      return { vars: { p, price }, answer: total, expr: `${price}+${price}*${p}/100`, decoys: [(price * p) / 100, price - (price * p) / 100, total + 10], render: rupees };
    },
  );

const fEcoPerCapita = (tag: string, lvl: number, want: number, n: Range, u: Range) =>
  T(
    `ecopc:${tag}`,
    lvl,
    want,
    [n.n, u.n],
    {
      en: ["A village of {n} people earns ₹{t} in a year altogether. What is the average income per person?"],
      hi: ["{n} लोगों का गाँव वर्ष में कुल ₹{t} कमाता है। प्रति व्यक्ति औसत आय क्या है?"],
      mr: ["{n} लोकांचे गाव वर्षात एकूण ₹{t} कमावते. दरडोई सरासरी उत्पन्न किती?"],
      sen: "Per-person income = total ÷ people = {t} ÷ {n} = ₹{ans}.",
      shi: "प्रति व्यक्ति आय = कुल ÷ लोग = {t} ÷ {n} = ₹{ans}।",
      smr: "दरडोई उत्पन्न = एकूण ÷ लोक = {t} ÷ {n} = ₹{ans}.",
    },
    ([i, j]) => {
      const people = at(n, i!), per = 100 * at(u, j!), t = people * per;
      return { vars: { n: people, t }, answer: per, expr: `${t}/${people}`, decoys: [per + 100, per - 100, t - people], render: rupees };
    },
  );

const fEcoGrowth = (tag: string, lvl: number, want: number, m: Range, p: Range) =>
  T(
    `ecogrow:${tag}`,
    lvl,
    want,
    [m.n, p.n],
    {
      en: ["A farm's production rose from {a} to {b} quintals. What is the percentage increase?"],
      hi: ["खेत का उत्पादन {a} से बढ़कर {b} क्विंटल हो गया। प्रतिशत वृद्धि क्या है?"],
      mr: ["शेताचे उत्पादन {a} वरून {b} क्विंटल झाले. शेकडा वाढ किती?"],
      sen: "Increase = {b} − {a}; percentage = increase × 100 ÷ {a} = {ans}%.",
      shi: "वृद्धि = {b} − {a}; प्रतिशत = वृद्धि × 100 ÷ {a} = {ans}%।",
      smr: "वाढ = {b} − {a}; शेकडेवारी = वाढ × 100 ÷ {a} = {ans}%.",
    },
    ([i, j]) => {
      const base = 20 * at(m, i!), pct = at(p, j!);
      const b = base + (base * pct) / 100;
      return { vars: { a: base, b }, answer: pct, expr: `(${b}-${base})*100/${base}`, decoys: [pct + 5, pct - 5, pct * 2], render: (n2) => `${fmt(n2)}%` };
    },
  );

const ECODISCPCT: SkinSet = {
  en: ["An item marked ₹{mp} sells for ₹{sp}. What discount percentage is that?", "The list price is ₹{mp} but you pay ₹{sp}. Find the discount per cent."],
  hi: ["₹{mp} अंकित मूल्य की वस्तु ₹{sp} में बिकती है। छूट का प्रतिशत क्या है?", "सूची मूल्य ₹{mp} है पर आप ₹{sp} देते हैं। छूट प्रतिशत निकालिए।"],
  mr: ["₹{mp} छापील किमतीची वस्तू ₹{sp} ला विकली जाते. सुटीची टक्केवारी किती?", "यादी किंमत ₹{mp} आहे पण तुम्ही ₹{sp} देता. सूट टक्के काढा."],
  sen: "Discount = {mp} − {sp}; per cent = ({mp} − {sp}) × 100 ÷ {mp} = {ans}%.",
  shi: "छूट = {mp} − {sp}; प्रतिशत = ({mp} − {sp}) × 100 ÷ {mp} = {ans}%।",
  smr: "सूट = {mp} − {sp}; टक्के = ({mp} − {sp}) × 100 ÷ {mp} = {ans}%.",
};
const ECODISC_PCTS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];
const fEcoDiscPct = (tag: string, lvl: number, want: number, u: Range) =>
  T(`ecodiscpct:${tag}`, lvl, want, [u.n, ECODISC_PCTS.length], ECODISCPCT, ([i, j]) => {
    const mp = 20 * at(u, i!), d = ECODISC_PCTS[j!]!, sp = mp - (mp * d) / 100;
    return { vars: { mp, sp }, answer: d, expr: `(${mp}-${sp})*100/${mp}`, decoys: [d + 5, d - 5, mp - sp], render: (x) => `${fmt(x)}%` };
  });

const ECODISCGST: SkinSet = {
  en: [
    "An item marked ₹{mp} gets a {d}% discount, then {t}% tax is added on the discounted price. What is the final bill?",
    "After {d}% off on ₹{mp} and {t}% tax on what remains, how much do you pay?",
  ],
  hi: [
    "₹{mp} अंकित वस्तु पर {d}% छूट मिलती है, फिर घटे दाम पर {t}% कर जुड़ता है। अंतिम बिल कितना है?",
    "₹{mp} पर {d}% छूट और बचे दाम पर {t}% कर के बाद आप कितना देंगे?",
  ],
  mr: [
    "₹{mp} छापील वस्तूवर {d}% सूट मिळते, मग घटलेल्या किमतीवर {t}% कर लागतो. अंतिम बिल किती?",
    "₹{mp} वर {d}% सूट आणि उरलेल्या किमतीवर {t}% करानंतर तुम्ही किती द्याल?",
  ],
  sen: "After discount: {mp} × (100 − {d}) ÷ 100; after tax: × (100 + {t}) ÷ 100 = ₹{ans}.",
  shi: "छूट के बाद: {mp} × (100 − {d}) ÷ 100; कर के बाद: × (100 + {t}) ÷ 100 = ₹{ans}।",
  smr: "सुटीनंतर: {mp} × (100 − {d}) ÷ 100; करानंतर: × (100 + {t}) ÷ 100 = ₹{ans}.",
};
const ECODG_D = [10, 20, 30, 40, 50];
const ECODG_T = [10, 20];
const fEcoDiscGST = (tag: string, lvl: number, want: number, kR: Range) =>
  T(`ecodiscgst:${tag}`, lvl, want, [kR.n, ECODG_D.length, ECODG_T.length], ECODISCGST, ([i, j, k]) => {
    const mp = 100 * at(kR, i!), d = ECODG_D[j!]!, t = ECODG_T[k!]!;
    const final = (mp * (100 - d) * (100 + t)) / 10000;
    return { vars: { mp, d, t }, answer: final, expr: `${mp}*(100-${d})*(100+${t})/10000`, decoys: [(mp * (100 - d)) / 100, mp - (mp * (d - t)) / 100, final + 10], render: rupees };
  });

const ECOSUCC: SkinSet = {
  en: [
    "A shop gives two successive discounts of {a}% and then {b}% on an item marked ₹{mp}. What do you finally pay?",
    "₹{mp} is reduced by {a}%, and the reduced price by another {b}%. Find the final price.",
  ],
  hi: [
    "दुकान ₹{mp} अंकित वस्तु पर {a}% और फिर {b}% की दो क्रमिक छूट देती है। अंत में आप कितना देंगे?",
    "₹{mp} में {a}% की कमी होती है, और घटे दाम में और {b}% की। अंतिम दाम निकालिए।",
  ],
  mr: [
    "दुकान ₹{mp} छापील वस्तूवर {a}% आणि मग {b}% अशा दोन क्रमागत सुटी देते. शेवटी तुम्ही किती द्याल?",
    "₹{mp} मध्ये {a}% घट होते, आणि घटलेल्या किमतीत आणखी {b}%. अंतिम किंमत काढा.",
  ],
  sen: "Apply both cuts in turn: {mp} × (100 − {a}) ÷ 100 × (100 − {b}) ÷ 100 = ₹{ans} — not the same as {a} + {b} per cent off.",
  shi: "दोनों कटौतियाँ क्रम से लगाएँ: {mp} × (100 − {a}) ÷ 100 × (100 − {b}) ÷ 100 = ₹{ans} — यह {a} + {b} प्रतिशत छूट नहीं है।",
  smr: "दोन्ही कपाती क्रमाने लावा: {mp} × (100 − {a}) ÷ 100 × (100 − {b}) ÷ 100 = ₹{ans} — हे {a} + {b} टक्के सुटीसारखे नाही.",
};
const ECOSUCC_A = [10, 20, 30, 40, 50];
const ECOSUCC_B = [10, 20, 30, 40];
const fEcoSuccDisc = (tag: string, lvl: number, want: number, kR: Range) =>
  T(`ecosucc:${tag}`, lvl, want, [kR.n, ECOSUCC_A.length, ECOSUCC_B.length], ECOSUCC, ([i, j, k]) => {
    const mp = 100 * at(kR, i!), a = ECOSUCC_A[j!]!, b = ECOSUCC_B[k!]!;
    const final = (mp * (100 - a) * (100 - b)) / 10000;
    return { vars: { mp, a, b }, answer: final, expr: `${mp}*(100-${a})*(100-${b})/10000`, decoys: [mp - (mp * (a + b)) / 100, (mp * (100 - a)) / 100, final + 10], render: rupees };
  });

const ECOMARKUP: SkinSet = {
  en: [
    "A trader buys an item for ₹{cp}, marks it up by {m}%, then sells at a {d}% discount on the marked price. What is the profit per cent?",
    "Cost price ₹{cp}; markup {m}%; discount {d}% on the marked price. Find the overall profit percentage.",
  ],
  hi: [
    "व्यापारी वस्तु ₹{cp} में खरीदता है, {m}% बढ़ाकर अंकित करता है, फिर अंकित मूल्य पर {d}% छूट से बेचता है। लाभ प्रतिशत क्या है?",
    "क्रय मूल्य ₹{cp}; {m}% वृद्धि; अंकित मूल्य पर {d}% छूट। कुल लाभ प्रतिशत निकालिए।",
  ],
  mr: [
    "व्यापारी वस्तू ₹{cp} ला घेतो, {m}% वाढवून किंमत छापतो, मग छापील किमतीवर {d}% सुटीने विकतो. नफ्याची टक्केवारी किती?",
    "खरेदी किंमत ₹{cp}; {m}% वाढ; छापील किमतीवर {d}% सूट. एकूण नफा टक्के काढा.",
  ],
  sen: "Selling price = {cp} × (100 + {m}) ÷ 100 × (100 − {d}) ÷ 100; profit % = (100 + {m}) × (100 − {d}) ÷ 100 − 100 = {ans}%.",
  shi: "विक्रय मूल्य = {cp} × (100 + {m}) ÷ 100 × (100 − {d}) ÷ 100; लाभ % = (100 + {m}) × (100 − {d}) ÷ 100 − 100 = {ans}%।",
  smr: "विक्री किंमत = {cp} × (100 + {m}) ÷ 100 × (100 − {d}) ÷ 100; नफा % = (100 + {m}) × (100 − {d}) ÷ 100 − 100 = {ans}%.",
};
/** (markup %, discount %) pairs whose combined profit % is a positive integer. */
const ECOMARKUP_COMBOS: [number, number][] = [[20, 10], [30, 10], [40, 10], [50, 10], [40, 20], [50, 20], [60, 20], [50, 30], [60, 30], [80, 30]];
const fEcoMarkup = (tag: string, lvl: number, want: number, kR: Range) =>
  T(`ecomarkup:${tag}`, lvl, want, [kR.n, ECOMARKUP_COMBOS.length], ECOMARKUP, ([i, j]) => {
    const cp = 100 * at(kR, i!), [m, d] = ECOMARKUP_COMBOS[j!]!;
    const profit = ((100 + m) * (100 - d)) / 100 - 100;
    return { vars: { cp, m, d }, answer: profit, expr: `(100+${m})*(100-${d})/100-100`, decoys: [m - d, profit + 5, m], render: (x) => `${fmt(x)}%` };
  });

const ECOTOTAL: SkinSet = {
  en: ["A town of {n} people has an average yearly income of ₹{per} per person. What is the town's total yearly income?", "Find the total income of {n} people averaging ₹{per} each per year."],
  hi: ["{n} लोगों के कस्बे में प्रति व्यक्ति औसत वार्षिक आय ₹{per} है। कस्बे की कुल वार्षिक आय क्या है?", "प्रति वर्ष औसतन ₹{per} कमाने वाले {n} लोगों की कुल आय निकालिए।"],
  mr: ["{n} लोकांच्या गावात दरडोई सरासरी वार्षिक उत्पन्न ₹{per} आहे. गावाचे एकूण वार्षिक उत्पन्न किती?", "दरवर्षी सरासरी ₹{per} कमावणाऱ्या {n} लोकांचे एकूण उत्पन्न काढा."],
  sen: "Total = people × average = {n} × {per} = ₹{ans}.",
  shi: "कुल = लोग × औसत = {n} × {per} = ₹{ans}।",
  smr: "एकूण = लोक × सरासरी = {n} × {per} = ₹{ans}.",
};
const fEcoTotal = (tag: string, lvl: number, want: number, n: Range, u: Range) =>
  T(`ecototal:${tag}`, lvl, want, [n.n, u.n], ECOTOTAL, ([i, j]) => {
    const people = at(n, i!), per = 100 * at(u, j!), t = people * per;
    return { vars: { n: people, per }, answer: t, expr: `${people}*${per}`, decoys: [t + per, t - people, people + per], render: rupees };
  });

const ECOPEOPLE: SkinSet = {
  en: ["A village earns ₹{t} a year in all, averaging ₹{per} per person. How many people live there?", "Total income ₹{t}; average ₹{per} per head. Find the number of people."],
  hi: ["गाँव कुल ₹{t} प्रति वर्ष कमाता है, औसतन ₹{per} प्रति व्यक्ति। वहाँ कितने लोग रहते हैं?", "कुल आय ₹{t}; औसत ₹{per} प्रति व्यक्ति। लोगों की संख्या निकालिए।"],
  mr: ["गाव दरवर्षी एकूण ₹{t} कमावते, सरासरी ₹{per} प्रति व्यक्ती. तिथे किती लोक राहतात?", "एकूण उत्पन्न ₹{t}; सरासरी ₹{per} प्रति डोई. लोकांची संख्या काढा."],
  sen: "People = total ÷ average = {t} ÷ {per} = {ans}.",
  shi: "लोग = कुल ÷ औसत = {t} ÷ {per} = {ans}।",
  smr: "लोक = एकूण ÷ सरासरी = {t} ÷ {per} = {ans}.",
};
const fEcoPeople = (tag: string, lvl: number, want: number, n: Range, u: Range) =>
  T(`ecopeople:${tag}`, lvl, want, [n.n, u.n], ECOPEOPLE, ([i, j]) => {
    const people = at(n, i!), per = 100 * at(u, j!), t = people * per;
    return { vars: { t, per }, answer: people, expr: `${t}/${per}`, decoys: [people + 10, people - 5, per], render: fmt };
  });

const ECOPCGROW: SkinSet = {
  en: [
    "A district's per capita income is ₹{per}. If total income rises {p}% while the population stays the same, what does per capita income become?",
    "Per capita income stands at ₹{per}. After {p}% growth in income with unchanged population, find the new figure.",
  ],
  hi: [
    "जिले की प्रति व्यक्ति आय ₹{per} है। जनसंख्या वही रहे और कुल आय {p}% बढ़े, तो प्रति व्यक्ति आय कितनी होगी?",
    "प्रति व्यक्ति आय ₹{per} है। जनसंख्या अपरिवर्तित रहते आय में {p}% वृद्धि के बाद नया आँकड़ा निकालिए।",
  ],
  mr: [
    "जिल्ह्याचे दरडोई उत्पन्न ₹{per} आहे. लोकसंख्या तीच राहून एकूण उत्पन्न {p}% वाढले, तर दरडोई उत्पन्न किती होईल?",
    "दरडोई उत्पन्न ₹{per} आहे. लोकसंख्या न बदलता उत्पन्नात {p}% वाढीनंतर नवा आकडा काढा.",
  ],
  sen: "New per capita = {per} × (100 + {p}) ÷ 100 = ₹{ans}.",
  shi: "नई प्रति व्यक्ति आय = {per} × (100 + {p}) ÷ 100 = ₹{ans}।",
  smr: "नवे दरडोई उत्पन्न = {per} × (100 + {p}) ÷ 100 = ₹{ans}.",
};
const fEcoPCGrow = (tag: string, lvl: number, want: number, jR: Range, pR: Range) =>
  T(`ecopcgrow:${tag}`, lvl, want, [jR.n, pR.n], ECOPCGROW, ([i, j]) => {
    const per = 20 * at(jR, i!), p = 5 * at(pR, j!), np = (per * (100 + p)) / 100;
    return { vars: { per, p }, answer: np, expr: `${per}*(100+${p})/100`, decoys: [per + p, np + 20, (per * p) / 100], render: rupees };
  });

const ECOWEIGHT: SkinSet = {
  en: [
    "In a village, {n1} workers earn ₹{a} a day each and {n2} workers earn ₹{b} a day each. What is the average daily wage?",
    "{n1} people at ₹{a} per day and {n2} people at ₹{b} per day — find the average wage.",
  ],
  hi: [
    "गाँव में {n1} मज़दूर रोज़ ₹{a} और {n2} मज़दूर रोज़ ₹{b} कमाते हैं। औसत दैनिक मज़दूरी क्या है?",
    "{n1} लोग ₹{a} प्रतिदिन और {n2} लोग ₹{b} प्रतिदिन — औसत मज़दूरी निकालिए।",
  ],
  mr: [
    "गावात {n1} कामगार रोज ₹{a} आणि {n2} कामगार रोज ₹{b} कमावतात. सरासरी रोजची मजुरी किती?",
    "{n1} लोक ₹{a} प्रतिदिन आणि {n2} लोक ₹{b} प्रतिदिन — सरासरी मजुरी काढा.",
  ],
  sen: "Average = ({n1} × {a} + {n2} × {b}) ÷ ({n1} + {n2}) = ₹{ans} — weight each wage by how many earn it.",
  shi: "औसत = ({n1} × {a} + {n2} × {b}) ÷ ({n1} + {n2}) = ₹{ans} — हर मज़दूरी को कमाने वालों की संख्या से तौलें।",
  smr: "सरासरी = ({n1} × {a} + {n2} × {b}) ÷ ({n1} + {n2}) = ₹{ans} — प्रत्येक मजुरीला कमावणाऱ्यांच्या संख्येने तोला.",
};
const fEcoWeighted = (tag: string, lvl: number, want: number, rR: Range, dR: Range, jR: Range, n2R: Range) =>
  T(`ecoweight:${tag}`, lvl, want, [rR.n, dR.n, jR.n, n2R.n], ECOWEIGHT, ([i, j, k, l]) => {
    const avg = at(rR, i!), delta = at(dR, j!), mul = at(jR, k!), n2 = at(n2R, l!);
    const n1 = n2 * mul, a = avg + delta, b = avg - delta * mul;
    return { vars: { n1, a, n2, b }, answer: avg, expr: `(${n1}*${a}+${n2}*${b})/(${n1}+${n2})`, decoys: [(a + b) / 2, avg + delta, avg - 1], render: rupees };
  });

const ECOMERGEV: SkinSet = {
  en: [
    "Two villages merge: one of {n1} people with total yearly income ₹{t1}, the other of {n2} people with ₹{t2}. What is the merged village's per capita income?",
    "After merging {n1} people earning ₹{t1} in all with {n2} people earning ₹{t2}, find the combined per capita income.",
  ],
  hi: [
    "दो गाँव मिलते हैं: {n1} लोगों का, कुल वार्षिक आय ₹{t1}, और {n2} लोगों का, ₹{t2}। मिले गाँव की प्रति व्यक्ति आय क्या है?",
    "कुल ₹{t1} कमाने वाले {n1} लोगों और ₹{t2} कमाने वाले {n2} लोगों के विलय के बाद संयुक्त प्रति व्यक्ति आय निकालिए।",
  ],
  mr: [
    "दोन गावे विलीन होतात: {n1} लोकांचे, एकूण वार्षिक उत्पन्न ₹{t1}, आणि {n2} लोकांचे, ₹{t2}. विलीन गावाचे दरडोई उत्पन्न किती?",
    "एकूण ₹{t1} कमावणारे {n1} लोक आणि ₹{t2} कमावणारे {n2} लोक यांच्या विलीनीकरणानंतर एकत्रित दरडोई उत्पन्न काढा.",
  ],
  sen: "Per capita = total income ÷ total people = ({t1} + {t2}) ÷ ({n1} + {n2}) = ₹{ans}.",
  shi: "प्रति व्यक्ति = कुल आय ÷ कुल लोग = ({t1} + {t2}) ÷ ({n1} + {n2}) = ₹{ans}।",
  smr: "दरडोई = एकूण उत्पन्न ÷ एकूण लोक = ({t1} + {t2}) ÷ ({n1} + {n2}) = ₹{ans}.",
};
const fEcoMergeVillages = (tag: string, lvl: number, want: number, rR: Range, n1R: Range, n2R: Range, dR: Range) =>
  T(`ecomergev:${tag}`, lvl, want, [rR.n, n1R.n, n2R.n, dR.n], ECOMERGEV, ([i, j, k, l]) => {
    const rho = at(rR, i!), n1 = at(n1R, j!), n2 = at(n2R, k!), delta = at(dR, l!);
    const t1 = (rho + delta) * n1, t2 = rho * (n1 + n2) - t1;
    return { vars: { n1, t1, n2, t2 }, answer: rho, expr: `(${t1}+${t2})/(${n1}+${n2})`, decoys: [rho + delta, rho - delta, rho + 1], render: rupees };
  });

const ECOGROWABS: SkinSet = {
  en: ["A farm produced {a} quintals last season. Production rises by {p}%. What is the new production?", "Output of {a} quintals grows {p}%. Find the new output."],
  hi: ["खेत ने पिछले मौसम {a} क्विंटल पैदा किए। उत्पादन {p}% बढ़ता है। नया उत्पादन क्या है?", "{a} क्विंटल उत्पादन {p}% बढ़ता है। नया उत्पादन निकालिए।"],
  mr: ["शेताने मागील हंगामात {a} क्विंटल पिकवले. उत्पादन {p}% ने वाढते. नवे उत्पादन किती?", "{a} क्विंटल उत्पादन {p}% वाढते. नवे उत्पादन काढा."],
  sen: "New production = {a} × (100 + {p}) ÷ 100 = {ans} quintals.",
  shi: "नया उत्पादन = {a} × (100 + {p}) ÷ 100 = {ans} क्विंटल।",
  smr: "नवे उत्पादन = {a} × (100 + {p}) ÷ 100 = {ans} क्विंटल.",
};
const fEcoGrowAbs = (tag: string, lvl: number, want: number, kR: Range, pR: Range) =>
  T(`ecogrowabs:${tag}`, lvl, want, [kR.n, pR.n], ECOGROWABS, ([i, j]) => {
    const a = 20 * at(kR, i!), p = 5 * at(pR, j!), b = (a * (100 + p)) / 100;
    return { vars: { a, p }, answer: b, expr: `${a}*(100+${p})/100`, decoys: [a + p, b + 20, (a * p) / 100], render: (x) => `${fmt(x)} quintals` };
  });

const ECODECLINE: SkinSet = {
  en: ["A drought year cuts a harvest of {a} quintals by {p}%. What does the harvest fall to?", "Production of {a} quintals drops {p}%. Find the reduced output."],
  hi: ["सूखे के वर्ष में {a} क्विंटल की फ़सल {p}% घट जाती है। फ़सल कितनी रह जाती है?", "{a} क्विंटल उत्पादन {p}% गिरता है। घटा हुआ उत्पादन निकालिए।"],
  mr: ["दुष्काळाच्या वर्षी {a} क्विंटलचे पीक {p}% ने घटते. पीक किती उरते?", "{a} क्विंटल उत्पादन {p}% ने घसरते. घटलेले उत्पादन काढा."],
  sen: "Reduced output = {a} × (100 − {p}) ÷ 100 = {ans} quintals.",
  shi: "घटा उत्पादन = {a} × (100 − {p}) ÷ 100 = {ans} क्विंटल।",
  smr: "घटलेले उत्पादन = {a} × (100 − {p}) ÷ 100 = {ans} क्विंटल.",
};
const fEcoDecline = (tag: string, lvl: number, want: number, kR: Range, pR: Range) =>
  T(`ecodecline:${tag}`, lvl, want, [kR.n, pR.n], ECODECLINE, ([i, j]) => {
    const a = 20 * at(kR, i!), p = 5 * at(pR, j!), b = (a * (100 - p)) / 100;
    return { vars: { a, p }, answer: b, expr: `${a}*(100-${p})/100`, decoys: [a - p, (a * p) / 100, b - 20], render: (x) => `${fmt(x)} quintals` };
  });

const ECOTWOYEAR: SkinSet = {
  en: [
    "A dairy's output of {a} litres grows {p}% one year and {q}% the next. What is the output after both years?",
    "Starting at {a} litres, production rises {p}% and then {q}% in successive years. Find the final figure.",
  ],
  hi: [
    "डेयरी का {a} लीटर उत्पादन एक वर्ष {p}% और अगले वर्ष {q}% बढ़ता है। दोनों वर्षों बाद उत्पादन क्या है?",
    "{a} लीटर से शुरू होकर उत्पादन क्रमशः {p}% और {q}% बढ़ता है। अंतिम आँकड़ा निकालिए।",
  ],
  mr: [
    "दुग्धशाळेचे {a} लिटर उत्पादन एका वर्षी {p}% आणि पुढच्या वर्षी {q}% वाढते. दोन्ही वर्षांनंतर उत्पादन किती?",
    "{a} लिटरपासून उत्पादन क्रमाने {p}% आणि {q}% वाढते. अंतिम आकडा काढा.",
  ],
  sen: "Apply each year in turn: {a} × (100 + {p}) ÷ 100 × (100 + {q}) ÷ 100 = {ans} litres.",
  shi: "हर वर्ष क्रम से लगाएँ: {a} × (100 + {p}) ÷ 100 × (100 + {q}) ÷ 100 = {ans} लीटर।",
  smr: "प्रत्येक वर्ष क्रमाने लावा: {a} × (100 + {p}) ÷ 100 × (100 + {q}) ÷ 100 = {ans} लिटर.",
};
const ECO2Y_PCTS = [10, 20, 30, 40, 50];
const fEcoTwoYear = (tag: string, lvl: number, want: number, kR: Range) =>
  T(`ecotwoyear:${tag}`, lvl, want, [kR.n, ECO2Y_PCTS.length, ECO2Y_PCTS.length], ECOTWOYEAR, ([i, j, k]) => {
    const a = 100 * at(kR, i!), p = ECO2Y_PCTS[j!]!, q = ECO2Y_PCTS[k!]!;
    const b = (a * (100 + p) * (100 + q)) / 10000;
    return { vars: { a, p, q }, answer: b, expr: `${a}*(100+${p})*(100+${q})/10000`, decoys: [(a * (100 + p + q)) / 100, (a * (100 + p)) / 100, b + 10], render: (x) => `${fmt(x)} litres` };
  });

const ECONET: SkinSet = {
  en: [
    "A factory's output (currently {B} units) rises {p}% one year and falls {q}% the next. What is the NET percentage change over the two years?",
    "Production grows {p}%, then shrinks {q}% the following year (starting from {B} units). Find the overall percentage change.",
  ],
  hi: [
    "कारख़ाने का उत्पादन (अभी {B} इकाई) एक वर्ष {p}% बढ़ता है और अगले वर्ष {q}% गिरता है। दो वर्षों में शुद्ध प्रतिशत परिवर्तन क्या है?",
    "उत्पादन {p}% बढ़ता है, फिर अगले वर्ष {q}% घटता है ({B} इकाई से शुरू)। कुल प्रतिशत परिवर्तन निकालिए।",
  ],
  mr: [
    "कारखान्याचे उत्पादन (सध्या {B} एकके) एका वर्षी {p}% वाढते आणि पुढच्या वर्षी {q}% घटते. दोन वर्षांतील निव्वळ शेकडा बदल किती?",
    "उत्पादन {p}% वाढते, मग पुढील वर्षी {q}% घटते ({B} एककांपासून). एकूण शेकडा बदल काढा.",
  ],
  sen: "Net % = {p} − {q} − {p} × {q} ÷ 100 = {ans}% — the fall applies to the already-grown amount.",
  shi: "शुद्ध % = {p} − {q} − {p} × {q} ÷ 100 = {ans}% — गिरावट बढ़ी हुई राशि पर लगती है।",
  smr: "निव्वळ % = {p} − {q} − {p} × {q} ÷ 100 = {ans}% — घट वाढलेल्या रकमेवर लागू होते.",
};
/** (rise %, fall %) pairs with a positive integer net change. */
const ECONET_COMBOS: [number, number][] = [[20, 10], [30, 10], [30, 20], [40, 10], [40, 20], [50, 10], [50, 20], [50, 30], [60, 20], [60, 30]];
const fEcoNetChange = (tag: string, lvl: number, want: number, kR: Range) =>
  T(`econet:${tag}`, lvl, want, [kR.n, ECONET_COMBOS.length], ECONET, ([i, j]) => {
    const B = 100 * at(kR, i!), [p, q] = ECONET_COMBOS[j!]!;
    const net = p - q - (p * q) / 100;
    return { vars: { B, p, q }, answer: net, expr: `${p}-${q}-${p}*${q}/100`, decoys: [p - q, net + 5, q - p + 2], render: (x) => `${fmt(x)}%` };
  });

const ECOSPLIT: SkinSet = {
  en: [
    "A family income of ₹{I} a month is split between saving and spending in the ratio {ra} : {rb}. How much is saved?",
    "₹{I} of monthly income divides {ra} : {rb} into savings and expenses. Find the savings.",
  ],
  hi: [
    "₹{I} मासिक आय बचत और खर्च में {ra} : {rb} के अनुपात में बँटती है। कितनी बचत होती है?",
    "₹{I} मासिक आय {ra} : {rb} में बचत और खर्च में बँटती है। बचत निकालिए।",
  ],
  mr: [
    "₹{I} मासिक उत्पन्न बचत आणि खर्च यांत {ra} : {rb} या प्रमाणात वाटले जाते. किती बचत होते?",
    "₹{I} मासिक उत्पन्न {ra} : {rb} असे बचत व खर्चात वाटले जाते. बचत काढा.",
  ],
  sen: "One ratio unit = {I} ÷ ({ra} + {rb}); savings = {I} × {ra} ÷ ({ra} + {rb}) = ₹{ans}.",
  shi: "अनुपात की एक इकाई = {I} ÷ ({ra} + {rb}); बचत = {I} × {ra} ÷ ({ra} + {rb}) = ₹{ans}।",
  smr: "प्रमाणाचे एक एकक = {I} ÷ ({ra} + {rb}); बचत = {I} × {ra} ÷ ({ra} + {rb}) = ₹{ans}.",
};
const fEcoRatioSplit = (tag: string, lvl: number, want: number, mR: Range) =>
  T(`ecosplit:${tag}`, lvl, want, [mR.n, CIV_RATIOS.length], ECOSPLIT, ([i, j]) => {
    const u = 100 * at(mR, i!), [ra, rb] = CIV_RATIOS[j!]!, I = (ra + rb) * u, sav = ra * u;
    return { vars: { I, ra, rb }, answer: sav, expr: `${I}*${ra}/(${ra}+${rb})`, decoys: [rb * u, sav + u, I - u], render: rupees };
  });

const SHOPCHANGE: SkinSet = {
  en: [
    "You buy {k} notebooks at ₹{u} each and pay with a ₹{N} note. How much change do you get?",
    "{k} pens cost ₹{u} apiece. Paying with ₹{N}, what change comes back?",
  ],
  hi: [
    "आप ₹{u} वाली {k} कॉपियाँ खरीदते हैं और ₹{N} का नोट देते हैं। कितने पैसे वापस मिलेंगे?",
    "{k} कलमों का दाम ₹{u} प्रति कलम है। ₹{N} देने पर कितना वापस मिलेगा?",
  ],
  mr: [
    "तुम्ही ₹{u} च्या {k} वह्या घेता आणि ₹{N} ची नोट देता. किती पैसे परत मिळतील?",
    "{k} पेनांची किंमत प्रत्येकी ₹{u} आहे. ₹{N} दिल्यावर किती परत मिळतील?",
  ],
  sen: "Cost = {k} × {u} = ₹{cost}; change = {N} − {cost} = ₹{ans}.",
  shi: "कीमत = {k} × {u} = ₹{cost}; वापसी = {N} − {cost} = ₹{ans}।",
  smr: "किंमत = {k} × {u} = ₹{cost}; परतावा = {N} − {cost} = ₹{ans}.",
};
const SHOP_NOTES = [1000, 2000];
const fShopChange = (tag: string, lvl: number, want: number, kR: Range, uR: Range) =>
  T(`shopchange:${tag}`, lvl, want, [kR.n, uR.n, SHOP_NOTES.length], SHOPCHANGE, ([i, j, k]) => {
    const cnt = at(kR, i!), u = at(uR, j!), N = SHOP_NOTES[k!]!, cost = cnt * u, ch = N - cost;
    return { vars: { k: cnt, u, N, cost }, answer: ch, expr: `${N}-${cnt}*${u}`, decoys: [cost, ch + 10, ch - 10], render: rupees };
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
  subject: Subject = "MATHS",
): TopicSpec {
  return {
    slug: `drill-g${grade}-${key}`,
    subject,
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
 * How each grade's ~100,500 splits across the six subjects. Maths carries the
 * most because arithmetic is the most drillable thing a machine can prove;
 * science grows and maths shrinks as the grades climb, the social sciences
 * hold a steady band, and every grade's six numbers sum to GRADE_TARGET.
 */
function split(grade: number): Record<Subject, number> {
  if (grade <= 5)
    return { MATHS: 55_000, SCIENCE: 18_000, GEOGRAPHY: 10_000, HISTORY: 8_000, CIVICS: 4_500, ECONOMICS: 5_000 };
  if (grade <= 8)
    return { MATHS: 45_000, SCIENCE: 22_000, GEOGRAPHY: 12_000, HISTORY: 10_000, CIVICS: 6_000, ECONOMICS: 5_500 };
  return { MATHS: 40_000, SCIENCE: 27_000, GEOGRAPHY: 10_000, HISTORY: 10_000, CIVICS: 6_500, ECONOMICS: 7_000 };
}

/** deficit split across six ladder levels; the last rung absorbs rounding. */
function spread(deficit: number, weights: number[]): number[] {
  const wants = weights.map((w) => Math.floor(deficit * w));
  wants[wants.length - 1] = deficit - wants.slice(0, -1).reduce((a, b) => a + b, 0);
  if (wants.some((w) => w < 0)) throw new Error(`spread: negative want from deficit ${deficit}`);
  return wants;
}

/* ------------------------------- fillers ---------------------------------- */
/*
 * Every chapter topic climbs the FULL six-rung ladder: L1–L2 are single-formula
 * work, L3 rearranges the formula, and L4–L6 are the multi-step compositions
 * that Olympiad and NSO papers actually set (net forces, harmonic-mean round
 * trips, successive discounts, joint-sitting majorities). L2–L6 take fixed
 * slices of each chapter's budget and L1 absorbs the remainder, so per-grade
 * subject totals still land exactly on target.
 *
 * HISTORY IS THE HONEST EXCEPTION: chapter-true history ("When People Rebel"
 * holding only 1857-era drills) would shrink each chapter's event pool far
 * below drillable size — the events table holds 27 rows, not 300. Timeline
 * topics therefore carry the grade's NCERT BOOK name, and true chapter fidelity
 * waits on a bigger curated table.
 */

/** L2..L6 get fixed slices of a chapter budget; L1 absorbs the remainder. */
function rungs(budget: number): [number, number, number, number, number, number] {
  const l2 = Math.floor(budget * 0.15), l3 = Math.floor(budget * 0.2), l4 = Math.floor(budget * 0.2);
  const l5 = Math.floor(budget * 0.15), l6 = Math.floor(budget * 0.1);
  return [budget - l2 - l3 - l4 - l5 - l6, l2, l3, l4, l5, l6];
}

type ChapterName = { en: string; hi: string; mr: string };
const CN = (en: string, hi: string, mr: string): ChapterName => ({ en, hi, mr });

function chapterTopic(
  grade: number,
  key: string,
  name: ChapterName,
  templates: Template[],
  subject: Subject,
): TopicSpec {
  return mkTopic(grade, 0, key, name.en, name.hi, name.mr, templates, subject);
}

function mathsFiller(grade: number, deficit: number): TopicSpec[] {
  const w = spread(deficit, [0.08, 0.15, 0.25, 0.25, 0.17, 0.1]);
  const base = 10_000 + (grade - 3) * 9_000;
  const mulBase = 1_000 + (grade - 3) * 800;
  const divBase = 100 + (grade - 3) * 80;
  const g = `g${grade}`;
  const NAME: Record<number, ChapterName> = {
    3: CN("Fun with Give and Take", "लेन-देन का खेल", "देवाण-घेवाणीची गंमत"),
    4: CN("Tables and Shares", "पहाड़े और बँटवारा", "पाढे आणि वाटण्या"),
    5: CN("Ways to Multiply and Divide", "गुणा-भाग के तरीके", "गुणाकार-भागाकाराच्या रीती"),
    6: CN("Whole Numbers Practice", "पूर्ण संख्याओं का अभ्यास", "पूर्ण संख्यांचा सराव"),
    7: CN("Number Operations Practice", "संख्या संक्रियाओं का अभ्यास", "संख्या क्रियांचा सराव"),
    8: CN("Number Operations Practice", "संख्या संक्रियाओं का अभ्यास", "संख्या क्रियांचा सराव"),
    9: CN("Number Systems Practice", "संख्या पद्धति अभ्यास", "संख्या पद्धती सराव"),
    10: CN("Real Numbers Practice", "वास्तविक संख्याओं का अभ्यास", "वास्तव संख्यांचा सराव"),
    11: CN("Number Practice", "संख्या अभ्यास", "संख्या सराव"),
    12: CN("Number Practice", "संख्या अभ्यास", "संख्या सराव"),
  };
  return [
    chapterTopic(grade, "mixed", NAME[grade]!, [
      fAdd(`${g}mixL1`, 1, w[0]!, R(base, base + 4499), R(base, base + 4499)),
      fSub(`${g}mixL2`, 2, w[1]!, R(base + 4500, base + 8999), R(base, base + 4499)),
      fMul(`${g}mixL3`, 3, w[2]!, R(mulBase, mulBase + 799), R(11, 99)),
      fDiv(`${g}mixL4`, 4, w[3]!, R(divBase, divBase + 79), R(11, 99)),
      fAdd(`${g}mixL5`, 5, w[4]!, R(base + 4500, base + 8999), R(base + 4500, base + 8999)),
      fSub(`${g}mixL6`, 6, w[5]!, R(base, base + 4499), R(1000 + (grade - 3) * 350, 1000 + (grade - 3) * 350 + 349)),
    ], "MATHS"),
  ];
}

function sciFiller(grade: number, deficit: number): TopicSpec[] {
  const [cMotion, cMatter, cForce, cElec, cWork] = spread(deficit, [0.18, 0.18, 0.22, 0.22, 0.2]);
  const mo = rungs(cMotion!), ma = rungs(cMatter!), fo = rungs(cForce!), el = rungs(cElec!), wo = rungs(cWork!);
  const o = grade - 3;
  const g = `g${grade}`;
  const motion: Record<number, ChapterName> = {
    3: CN("Moving Things", "चलती चीज़ें", "हलणाऱ्या वस्तू"),
    4: CN("Moving Things", "चलती चीज़ें", "हलणाऱ्या वस्तू"),
    5: CN("Fast and Slow", "तेज़ और धीमा", "जलद आणि हळू"),
    6: CN("Motion and Measurement of Distances", "गति एवं दूरियों का मापन", "गती आणि अंतरांचे मापन"),
    7: CN("Motion and Time", "गति एवं समय", "गती आणि वेळ"),
    8: CN("Motion Practice", "गति अभ्यास", "गती सराव"),
    9: CN("Motion", "गति", "गती"),
    10: CN("Motion Practice", "गति अभ्यास", "गती सराव"),
    11: CN("Motion in a Straight Line", "सरल रेखा में गति", "सरळ रेषेतील गती"),
    12: CN("Kinematics Revision", "गतिकी पुनरावृत्ति", "गतिकी उजळणी"),
  };
  const matter: Record<number, ChapterName> = {
    3: CN("Materials Around Us", "हमारे आस-पास की सामग्री", "आपल्या भोवतालचे पदार्थ"),
    4: CN("Materials Around Us", "हमारे आस-पास की सामग्री", "आपल्या भोवतालचे पदार्थ"),
    5: CN("Materials Around Us", "हमारे आस-पास की सामग्री", "आपल्या भोवतालचे पदार्थ"),
    6: CN("Sorting Materials into Groups", "वस्तुओं के समूह बनाना", "पदार्थांचे गट करणे"),
    7: CN("Matter and Density", "पदार्थ और घनत्व", "पदार्थ आणि घनता"),
    8: CN("Materials: Density", "सामग्री: घनत्व", "पदार्थ: घनता"),
    9: CN("Matter in Our Surroundings", "हमारे आस-पास के पदार्थ", "आपल्या सभोवतालचे पदार्थ"),
    10: CN("Matter Practice", "पदार्थ अभ्यास", "पदार्थ सराव"),
    11: CN("Mechanical Properties of Fluids", "तरलों के यांत्रिक गुण", "द्रवांचे यांत्रिक गुणधर्म"),
    12: CN("Properties of Matter", "पदार्थ के गुण", "पदार्थांचे गुणधर्म"),
  };
  const force: Record<number, ChapterName> = {
    3: CN("Pushes and Pulls", "धक्का और खिंचाव", "ढकलणे आणि ओढणे"),
    4: CN("Pushes and Pulls", "धक्का और खिंचाव", "ढकलणे आणि ओढणे"),
    5: CN("Pushes and Pulls", "धक्का और खिंचाव", "ढकलणे आणि ओढणे"),
    6: CN("Forces Around Us", "हमारे आस-पास के बल", "आपल्या भोवतालची बले"),
    7: CN("Forces and Their Effects", "बल और उनके प्रभाव", "बले आणि त्यांचे परिणाम"),
    8: CN("Force and Pressure", "बल तथा दाब", "बल आणि दाब"),
    9: CN("Force and Laws of Motion", "बल तथा गति के नियम", "बल आणि गतीचे नियम"),
    10: CN("Force Practice", "बल अभ्यास", "बल सराव"),
    11: CN("Laws of Motion", "गति के नियम", "गतीचे नियम"),
    12: CN("Mechanics Revision", "यांत्रिकी पुनरावृत्ति", "यांत्रिकी उजळणी"),
  };
  const elec: Record<number, ChapterName> = {
    3: CN("Simple Circuits", "सरल परिपथ", "साधे परिपथ"),
    4: CN("Simple Circuits", "सरल परिपथ", "साधे परिपथ"),
    5: CN("Simple Circuits", "सरल परिपथ", "साधे परिपथ"),
    6: CN("Electricity and Circuits", "विद्युत तथा परिपथ", "विद्युत आणि परिपथ"),
    7: CN("Electric Current and Its Effects", "विद्युत धारा और इसके प्रभाव", "विद्युत धारा आणि तिचे परिणाम"),
    8: CN("Chemical Effects of Electric Current", "विद्युत धारा के रासायनिक प्रभाव", "विद्युत धारेचे रासायनिक परिणाम"),
    9: CN("Electric Circuits", "विद्युत परिपथ", "विद्युत परिपथ"),
    10: CN("Electricity", "विद्युत", "विद्युत"),
    11: CN("Current Electricity Basics", "विद्युत धारा की मूल बातें", "विद्युत धारेची मूलतत्त्वे"),
    12: CN("Current Electricity", "विद्युत धारा", "विद्युत धारा"),
  };
  const work: Record<number, ChapterName> = {
    3: CN("Work and Play", "काम और खेल", "काम आणि खेळ"),
    4: CN("Work and Play", "काम और खेल", "काम आणि खेळ"),
    5: CN("Work and Play", "काम और खेल", "काम आणि खेळ"),
    6: CN("Work and Energy Basics", "कार्य और ऊर्जा की मूल बातें", "कार्य आणि ऊर्जेची मूलतत्त्वे"),
    7: CN("Energy at Work", "काम में ऊर्जा", "कामातील ऊर्जा"),
    8: CN("Work and Energy Basics", "कार्य और ऊर्जा की मूल बातें", "कार्य आणि ऊर्जेची मूलतत्त्वे"),
    9: CN("Work and Energy", "कार्य तथा ऊर्जा", "कार्य आणि ऊर्जा"),
    10: CN("Energy Calculations", "ऊर्जा की गणनाएँ", "ऊर्जेची आकडेमोड"),
    11: CN("Work, Energy and Power", "कार्य, ऊर्जा और शक्ति", "कार्य, ऊर्जा आणि शक्ती"),
    12: CN("Work and Power Revision", "कार्य और शक्ति पुनरावृत्ति", "कार्य आणि शक्ती उजळणी"),
  };
  return [
    chapterTopic(grade, "sci-motion", motion[grade]!, [
      fSciSpeed(`${g}sfL1`, 1, mo[0], R(5 + 300 * o, 299 + 300 * o), R(2, 19)),
      fSciDist(`${g}smoL2`, 2, mo[1], R(5 + 120 * o, 124 + 120 * o), R(2, 29)),
      fSciTime(`${g}smoL3`, 3, mo[2], R(6 + 90 * o, 95 + 90 * o), R(2, 49)),
      fSciAvgSpeed(`${g}smoL4`, 4, mo[3], R(10 + 80 * o, 89 + 80 * o), R(1, 15), R(2, 9)),
      fSciTrip(`${g}smoL5`, 5, mo[4], R(30 + 60 * o, 89 + 60 * o)),
      fSciRoundTrip(`${g}smoL6`, 6, mo[5], R(3 + 8 * o, 10 + 8 * o), R(2, 60)),
    ], "SCIENCE"),
    chapterTopic(grade, "sci-matter", matter[grade]!, [
      fSciDensity(`${g}sfL2`, 1, ma[0], R(2 + 80 * o, 81 + 80 * o), R(2, 99)),
      fSciMass(`${g}smaL2`, 2, ma[1], R(2 + 40 * o, 41 + 40 * o), R(2, 60)),
      fSciVol(`${g}smaL3`, 3, ma[2], R(2 + 40 * o, 41 + 40 * o), R(2, 60)),
      fSciMix(`${g}smaL4`, 4, ma[3], R(3 + 30 * o, 32 + 30 * o), R(2, 12), R(13, 30)),
      fSciAlloy(`${g}smaL5`, 5, ma[4], R(3 + 40 * o, 42 + 40 * o), R(1, 15), R(2, 10)),
      fSciCubeDen(`${g}smaL6`, 6, ma[5], R(2 + 40 * o, 41 + 40 * o), R(2, 12)),
    ], "SCIENCE"),
    chapterTopic(grade, "sci-force", force[grade]!, [
      fSciForce(`${g}sfL3`, 1, fo[0], R(2 + 60 * o, 61 + 60 * o), R(2, 99)),
      fSciAccel(`${g}sfoL2`, 2, fo[1], R(2 + 40 * o, 41 + 40 * o), R(2, 49)),
      fSciMassF(`${g}sfoL3`, 3, fo[2], R(2 + 25 * o, 26 + 25 * o), R(2, 60)),
      fSciNet(`${g}sfoL4`, 4, fo[3], R(2 + 30 * o, 31 + 30 * o), R(2, 25), R(5, 40)),
      fSciTension(`${g}sfoL5`, 5, fo[4], R(2 + 60 * o, 61 + 60 * o), R(1, 15)),
      fSciMomentum(`${g}sfoL6`, 6, fo[5], R(2 + 30 * o, 31 + 30 * o), R(2, 20), R(2, 6), R(1, 12)),
    ], "SCIENCE"),
    chapterTopic(grade, "sci-elec", elec[grade]!, [
      fSciOhm(`${g}sfL4`, 1, el[0], R(1 + 50 * o, 50 + 50 * o), R(2, 99)),
      fSciCurrent(`${g}selL2`, 2, el[1], R(2 + 40 * o, 41 + 40 * o), R(2, 40)),
      fSciSeries(`${g}selL3`, 3, el[2], R(2 + 30 * o, 31 + 30 * o), R(2, 49), R(2, 20)),
      fSciPowerI2R(`${g}selL4`, 4, el[3], R(2 + 40 * o, 41 + 40 * o), R(2, 25)),
      fSciRes(`${g}selL5`, 5, el[4], R(2 + 30 * o, 31 + 30 * o), R(2, 60)),
      fSciEnergyCost(`${g}selL6`, 6, el[5], R(2 + 10 * o, 11 + 10 * o), R(2, 12), R(4, 9)),
    ], "SCIENCE"),
    chapterTopic(grade, "sci-work", work[grade]!, [
      fSciWork(`${g}sfL5`, 1, wo[0], R(2 + 80 * o, 81 + 80 * o), R(2, 99)),
      fSciPower(`${g}sfL6`, 2, wo[1], R(5 + 80 * o, 84 + 80 * o), R(2, 60)),
      fSciEnergyW(`${g}swoL3`, 3, wo[2], R(5 + 60 * o, 64 + 60 * o), R(2, 50)),
      fSciPE(`${g}swoL4`, 4, wo[3], R(2 + 40 * o, 41 + 40 * o), R(2, 30)),
      fSciKE(`${g}swoL5`, 5, wo[4], R(2 + 40 * o, 41 + 40 * o), R(2, 30)),
      fSciPump(`${g}swoL6`, 6, wo[5], R(2, 10), R(2 + 20 * o, 21 + 20 * o), R(2, 30)),
    ], "SCIENCE"),
  ];
}

function geoFiller(grade: number, deficit: number): TopicSpec[] {
  const [cMaps, cGlobe, cPop] = spread(deficit, [0.4, 0.2, 0.4]);
  const o = grade - 3;
  const g = `g${grade}`;
  // Former stand-alone recall micro-topics fold in as L1 rungs of their chapter.
  const mapsRecall: Template[] =
    grade === 4 ? [fRecall(`${g}caps`, 1, 44, STATES, CAPITAL_SKIN)]
    : grade === 5 ? [fRecall(`${g}rev`, 1, 44, reverseFacts(STATES), OF_CAPITAL_SKIN)]
    : [];
  const popRecall: Template[] = grade === 6 ? [fRecall(`${g}world`, 1, 40, COUNTRIES, CAPITAL_SKIN)] : [];
  const mapsRecallN = mapsRecall.reduce((a, t) => a + t.want, 0);
  const popRecallN = popRecall.reduce((a, t) => a + t.want, 0);
  const mp = rungs(cMaps!), po = rungs(cPop!);
  // Globe rungs are space-capped (degrees only stretch to 180), so they take
  // fixed wants and L1 absorbs the chapter's remainder.
  const gl = [cGlobe! - 1750, 300, 200, 350, 500, 400] as const;
  const maps: Record<number, ChapterName> = {
    3: CN("Reading Maps", "नक्शा पढ़ना", "नकाशा वाचणे"),
    4: CN("Reading Maps", "नक्शा पढ़ना", "नकाशा वाचणे"),
    5: CN("Mapping Your Way", "नक्शे से राह", "नकाशाने वाट"),
    6: CN("Maps", "मानचित्र", "नकाशे"),
    7: CN("Map Skills", "मानचित्र कौशल", "नकाशा कौशल्ये"),
    8: CN("Map Skills", "मानचित्र कौशल", "नकाशा कौशल्ये"),
    9: CN("Map Skills", "मानचित्र कौशल", "नकाशा कौशल्ये"),
    10: CN("Map Skills", "मानचित्र कौशल", "नकाशा कौशल्ये"),
    11: CN("Practical Work: Map Scale", "प्रायोगिक कार्य: मानचित्र पैमाना", "प्रात्यक्षिक: नकाशा प्रमाण"),
    12: CN("Map Skills", "मानचित्र कौशल", "नकाशा कौशल्ये"),
  };
  const globe: Record<number, ChapterName> = {
    3: CN("Day and Night", "दिन और रात", "दिवस आणि रात्र"),
    4: CN("Day and Night", "दिन और रात", "दिवस आणि रात्र"),
    5: CN("The Turning Earth", "घूमती पृथ्वी", "फिरणारी पृथ्वी"),
    6: CN("Globe: Latitudes and Longitudes", "ग्लोब: अक्षांश एवं देशांतर", "पृथ्वीगोल: अक्षांश आणि रेखांश"),
    7: CN("Latitudes and Longitudes Practice", "अक्षांश-देशांतर अभ्यास", "अक्षांश-रेखांश सराव"),
    8: CN("Latitudes and Longitudes Practice", "अक्षांश-देशांतर अभ्यास", "अक्षांश-रेखांश सराव"),
    9: CN("India – Size and Location", "भारत – आकार और स्थिति", "भारत – आकार आणि स्थान"),
    10: CN("Longitude and Time", "देशांतर और समय", "रेखांश आणि वेळ"),
    11: CN("Earth's Rotation and Time", "पृथ्वी का घूर्णन और समय", "पृथ्वीचे परिवलन आणि वेळ"),
    12: CN("Longitude and Time", "देशांतर और समय", "रेखांश आणि वेळ"),
  };
  const pop: Record<number, ChapterName> = {
    3: CN("People and Places", "लोग और स्थान", "लोक आणि ठिकाणे"),
    4: CN("People and Places", "लोग और स्थान", "लोक आणि ठिकाणे"),
    5: CN("People and Places", "लोग और स्थान", "लोक आणि ठिकाणे"),
    6: CN("Where People Live", "लोग कहाँ रहते हैं", "लोक कुठे राहतात"),
    7: CN("Human Environment: Settlement", "मानवीय पर्यावरण: बस्तियाँ", "मानवी पर्यावरण: वस्ती"),
    8: CN("Human Resources", "मानव संसाधन", "मानवी साधनसंपत्ती"),
    9: CN("Population", "जनसंख्या", "लोकसंख्या"),
    10: CN("Population Practice", "जनसंख्या अभ्यास", "लोकसंख्या सराव"),
    11: CN("Population Practice", "जनसंख्या अभ्यास", "लोकसंख्या सराव"),
    12: CN("The World Population", "विश्व जनसंख्या", "जगाची लोकसंख्या"),
  };
  return [
    chapterTopic(grade, "geo-maps", maps[grade]!, [
      fGeoScale(`${g}gfL1`, 1, mp[0] - mapsRecallN, R(2 + 100 * o, 101 + 100 * o), R(2, 49)),
      ...mapsRecall,
      fGeoScaleInv(`${g}gmL2`, 2, mp[1], R(2 + 80 * o, 81 + 80 * o), R(2, 40)),
      fGeoRatio(`${g}gmL3`, 3, mp[2], R(1 + 40 * o, 40 + 40 * o), R(2, 60)),
      fGeoTrip(`${g}gmL4`, 4, mp[3], R(2 + 50 * o, 51 + 50 * o), R(2, 20), R(3, 30)),
      fGeoAreaScale(`${g}gmL5`, 5, mp[4], R(2 + 40 * o, 41 + 40 * o), R(2, 17)),
      fGeoAreaRect(`${g}gmL6`, 6, mp[5], R(2 + 25 * o, 26 + 25 * o), R(2, 12), R(2, 12)),
    ], "GEOGRAPHY"),
    chapterTopic(grade, "geo-globe", globe[grade]!, [
      fGeoLong(`${g}gfL2`, 1, gl[0], R(0, 89), R(1 + 9 * o, 9 + 9 * o)),
      fGeoLongWest(`${g}ggL2`, 2, gl[1], R(95, 179), R(1 + 9 * o, 9 + 9 * o)),
      fGeoDegrees(`${g}ggL3`, 3, gl[2], R(1 + 18 * o, 18 + 18 * o)),
      fGeoAcross(`${g}ggL4`, 4, gl[3], R(1 + 9 * o, 9 + 9 * o), R(1, 89)),
      fGeoClock(`${g}ggL5`, 5, gl[4], R(0, 89), R(1 + 9 * o, 9 + 9 * o)),
      fGeoLongHours(`${g}ggL6`, 6, gl[5]),
    ], "GEOGRAPHY"),
    chapterTopic(grade, "geo-pop", pop[grade]!, [
      fGeoPopDen(`${g}gfL3`, 1, po[0] - popRecallN, R(50 + 600 * o, 349 + 600 * o), R(2, 99)),
      ...popRecall,
      fGeoPop(`${g}gpL2`, 2, po[1], R(50 + 300 * o, 349 + 300 * o), R(2, 99)),
      fGeoAreaFromPop(`${g}gpL3`, 3, po[2], R(50 + 200 * o, 249 + 200 * o), R(2, 99)),
      fGeoDenGrow(`${g}gpL4`, 4, po[3], R(2 + 40 * o, 41 + 40 * o), R(1, 19)),
      fGeoDenCompare(`${g}gpL5`, 5, po[4], R(100 + 150 * o, 249 + 150 * o), R(10, 99)),
      fGeoMergeDen(`${g}gpL6`, 6, po[5], R(100 + 100 * o, 199 + 100 * o), R(2, 12), R(13, 30), R(5, 20)),
    ], "GEOGRAPHY"),
  ];
}

function histFiller(grade: number, deficit: number): TopicSpec[] {
  const o = grade - 3;
  const base = 2 + 195 * o;
  const g = `g${grade}`;
  // Former stand-alone landmark-year topics fold in as L1 recall rungs.
  const yearRecall: Template[] =
    grade === 7 ? [fEventYear(`${g}early`, 1, 16, 1400, 1900)]
    : grade === 9 ? [fEventYear(`${g}modern`, 1, 24, 1901, 2000)]
    : [];
  const yearRecallN = yearRecall.reduce((a, t) => a + t.want, 0);
  // Centuries chapter holds a fixed 600; upper timeline rungs take fixed
  // wants (chain/age spaces are wide); L1 absorbs the rest.
  const timelineL1 = deficit - 600 - (900 + 55 + 900 + 2000 + 800 + 1500) - yearRecallN;
  const book: Record<number, ChapterName> = {
    3: CN("Long Ago: Timeline Skills", "बहुत पहले: समयरेखा कौशल", "फार पूर्वी: कालरेषा कौशल्ये"),
    4: CN("Long Ago: Timeline Skills", "बहुत पहले: समयरेखा कौशल", "फार पूर्वी: कालरेषा कौशल्ये"),
    5: CN("Long Ago: Timeline Skills", "बहुत पहले: समयरेखा कौशल", "फार पूर्वी: कालरेषा कौशल्ये"),
    6: CN("Our Pasts: Timelines", "हमारे अतीत: समयरेखाएँ", "आपले भूतकाळ: कालरेषा"),
    7: CN("Our Pasts II: Timelines", "हमारे अतीत II: समयरेखाएँ", "आपले भूतकाळ II: कालरेषा"),
    8: CN("Our Pasts III: Timelines", "हमारे अतीत III: समयरेखाएँ", "आपले भूतकाळ III: कालरेषा"),
    9: CN("India and the Contemporary World: Timelines", "भारत और समकालीन विश्व: समयरेखाएँ", "भारत आणि समकालीन जग: कालरेषा"),
    10: CN("India and the Contemporary World II: Timelines", "भारत और समकालीन विश्व II: समयरेखाएँ", "भारत आणि समकालीन जग II: कालरेषा"),
    11: CN("Themes in World History: Timelines", "विश्व इतिहास के विषय: समयरेखाएँ", "जागतिक इतिहासातील विषय: कालरेषा"),
    12: CN("Themes in Indian History: Timelines", "भारतीय इतिहास के विषय: समयरेखाएँ", "भारतीय इतिहासातील विषय: कालरेषा"),
  };
  const centuries = CN("Centuries and Calendars", "शताब्दियाँ और कैलेंडर", "शतके आणि दिनदर्शिका");
  return [
    chapterTopic(grade, "hist-timeline", book[grade]!, [
      fHistAfter(`${g}hfL1`, 1, timelineL1, R(base, base + 80)),
      ...yearRecall,
      fHistBefore(`${g}htL2`, 2, 900, R(2 + 40 * o, 41 + 40 * o)),
      fHistBetween(`${g}hfL4`, 3, 55),
      fHistAfter(`${g}hfL3`, 3, 900, R(base + 81, base + 150)),
      fHistChain(`${g}htL4`, 4, 2000, R(2 + 5 * o, 6 + 5 * o), R(2, 25)),
      fHistAge(`${g}htL5`, 5, 800, R(2, 40)),
      fHistChainBack(`${g}htL6`, 6, 1500, R(2 + 9 * o, 10 + 9 * o), R(2, 60)),
    ], "HISTORY"),
    chapterTopic(grade, "hist-century", centuries, [
      fHistCentury(`${g}hfL2`, 1, 100, R(1201 + 140 * o, 1270 + 140 * o)),
      fHistDecade(`${g}hcL2`, 2, 100, R(1450 + 50 * o, 1499 + 50 * o)),
      fHistCentury(`${g}hfL6`, 3, 100, R(1271 + 140 * o, 1340 + 140 * o)),
      fHistCenturyEnd(`${g}hcL4`, 4, 100, R(1101 + 60 * o, 1160 + 60 * o)),
      fHistSpanCent(`${g}hcL5`, 5, 100, R(1301 + 50 * o, 1350 + 50 * o)),
      fHistCentAfter(`${g}hcL6`, 6, 100, R(1421 + 40 * o, 1460 + 40 * o), R(2, 6)),
    ], "HISTORY"),
  ];
}

function civFiller(grade: number, deficit: number): TopicSpec[] {
  const o = grade - 3;
  const g = `g${grade}`;
  // Constitution-numbers recall folds in as an L1 rung of the terms chapter.
  const termRecall: Template[] = grade === 9 ? [fCivNumber(`${g}facts`, 1, 12)] : [];
  const termRecallN = termRecall.reduce((a, t) => a + t.want, 0);
  // Quorum and majority chapters take fixed six-rung totals of 1,500 each and
  // the terms chapter 600; representation absorbs the rest of the deficit.
  const repBudget = deficit - 1500 - 1500 - 600 - termRecallN;
  const rl2 = Math.floor(repBudget * 0.15), rl3 = Math.floor(repBudget * 0.15);
  const rl4 = Math.floor(repBudget * 0.12), rl5 = Math.floor(repBudget * 0.12), rl6 = Math.floor(repBudget * 0.1);
  const rl1 = repBudget - rl2 - rl3 - rl4 - rl5 - rl6;
  const quorum: Record<number, ChapterName> = {
    3: CN("Meetings and Sharing", "बैठकें और साझेदारी", "सभा आणि वाटणी"),
    4: CN("Meetings and Sharing", "बैठकें और साझेदारी", "सभा आणि वाटणी"),
    5: CN("Meetings and Sharing", "बैठकें और साझेदारी", "सभा आणि वाटणी"),
    6: CN("Panchayati Raj", "पंचायती राज", "पंचायत राज"),
    7: CN("How the State Government Works", "राज्य सरकार कैसे काम करती है", "राज्य शासन कसे चालते"),
    8: CN("Quorums and Meetings", "कोरम और बैठकें", "गणपूर्ती आणि सभा"),
    9: CN("Working of Institutions", "संस्थाओं का कामकाज", "संस्थांचे कामकाज"),
    10: CN("Quorums and Meetings", "कोरम और बैठकें", "गणपूर्ती आणि सभा"),
    11: CN("Legislature: Quorums", "विधायिका: कोरम", "कायदेमंडळ: गणपूर्ती"),
    12: CN("Quorums and Meetings", "कोरम और बैठकें", "गणपूर्ती आणि सभा"),
  };
  const majority: Record<number, ChapterName> = {
    3: CN("Deciding Together", "मिलकर तय करना", "मिळून ठरवणे"),
    4: CN("Deciding Together", "मिलकर तय करना", "मिळून ठरवणे"),
    5: CN("Deciding Together", "मिलकर तय करना", "मिळून ठरवणे"),
    6: CN("Deciding Together", "मिलकर तय करना", "मिळून ठरवणे"),
    7: CN("Majority Decisions", "बहुमत के फ़ैसले", "बहुमताचे निर्णय"),
    8: CN("Why Do We Need a Parliament?", "हमें संसद क्यों चाहिए?", "आपल्याला संसद का हवी?"),
    9: CN("Majority Decisions", "बहुमत के फ़ैसले", "बहुमताचे निर्णय"),
    10: CN("Majority Decisions", "बहुमत के फ़ैसले", "बहुमताचे निर्णय"),
    11: CN("Parliament: Majorities", "संसद: बहुमत", "संसद: बहुमत"),
    12: CN("Majority Decisions", "बहुमत के फ़ैसले", "बहुमताचे निर्णय"),
  };
  const rep: Record<number, ChapterName> = {
    3: CN("Counting Our Community", "अपने समुदाय की गिनती", "आपल्या समुदायाची मोजणी"),
    4: CN("Counting Our Community", "अपने समुदाय की गिनती", "आपल्या समुदायाची मोजणी"),
    5: CN("Counting Our Community", "अपने समुदाय की गिनती", "आपल्या समुदायाची मोजणी"),
    6: CN("Representation Numbers", "प्रतिनिधित्व की संख्याएँ", "प्रतिनिधित्वाच्या संख्या"),
    7: CN("Representation Numbers", "प्रतिनिधित्व की संख्याएँ", "प्रतिनिधित्वाच्या संख्या"),
    8: CN("Representation Numbers", "प्रतिनिधित्व की संख्याएँ", "प्रतिनिधित्वाच्या संख्या"),
    9: CN("Electoral Politics", "चुनावी राजनीति", "निवडणुकीचे राजकारण"),
    10: CN("Representation Numbers", "प्रतिनिधित्व की संख्याएँ", "प्रतिनिधित्वाच्या संख्या"),
    11: CN("Elections and Representation", "चुनाव और प्रतिनिधित्व", "निवडणुका आणि प्रतिनिधित्व"),
    12: CN("Representation Numbers", "प्रतिनिधित्व की संख्याएँ", "प्रतिनिधित्वाच्या संख्या"),
  };
  const term = CN("Election Terms", "चुनावी कार्यकाल", "निवडणूक कार्यकाळ");
  return [
    chapterTopic(grade, "civ-quorum", quorum[grade]!, [
      fCivQuorum(`${g}cfL1`, 1, 200, R(2 + 80 * o, 81 + 80 * o)),
      fCivQuorumRev(`${g}cqL2`, 2, 250, R(2 + 60 * o, 61 + 60 * o)),
      fCivQuorumShort(`${g}cqL3`, 3, 350, R(2 + 50 * o, 51 + 50 * o), R(1, 15)),
      fCivTwoThirds(`${g}cqL4`, 4, 250, R(10 + 150 * o, 159 + 150 * o)),
      fCivPresentMaj(`${g}cqL5`, 5, 250, R(20 + 100 * o, 119 + 100 * o), R(2, 40)),
      fCivQuorumPct(`${g}cqL6`, 6, 200, R(6 + 15 * o, 20 + 15 * o)),
    ], "CIVICS"),
    chapterTopic(grade, "civ-majority", majority[grade]!, [
      fCivMajority(`${g}cfL2`, 1, 250, R(50 + 450 * o, 499 + 450 * o)),
      fCivMajGap(`${g}cmL2`, 2, 250, R(30 + 200 * o, 229 + 200 * o), R(1, 20)),
      fCivTwoThirdsVote(`${g}cmL3`, 3, 150, R(50 + 100 * o, 149 + 100 * o)),
      fCivCoalition(`${g}cmL4`, 4, 350, R(150 + 120 * o, 269 + 120 * o), R(30 + 80 * o, 109 + 80 * o), R(1, 25)),
      fCivRatioSeats(`${g}cmL5`, 5, 250, R(10 + 50 * o, 59 + 50 * o)),
      fCivImpeach(`${g}cmL6`, 6, 250, R(80 + 120 * o, 199 + 120 * o), R(50, 199)),
    ], "CIVICS"),
    chapterTopic(grade, "civ-rep", rep[grade]!, [
      fCivRep(`${g}cfL3`, 1, rl1, R(10, 199), R(100 + 600 * o, 299 + 600 * o)),
      fCivRepPop(`${g}crL2`, 2, rl2, R(10, 199), R(300 + 600 * o, 499 + 600 * o)),
      fCivRepSeats(`${g}crL3`, 3, rl3, R(10, 199), R(500 + 600 * o, 699 + 600 * o)),
      fCivRepGrow(`${g}crL4`, 4, rl4, R(10 + 50 * o, 59 + 50 * o), R(1, 15)),
      fCivRepTwo(`${g}crL5`, 5, rl5, R(500 + 500 * o, 899 + 500 * o), R(10, 109)),
      fCivRepMerge(`${g}crL6`, 6, rl6, R(200 + 300 * o, 499 + 300 * o), R(10, 30), R(31, 60), R(1, 20)),
    ], "CIVICS"),
    chapterTopic(grade, "civ-term", term, [
      fCivTerm(`${g}cfL6`, 1, 100, R(1900 + 50 * o, 1949 + 50 * o)),
      ...termRecall,
      fCivTermBack(`${g}ctL2`, 2, 100, R(1904 + 50 * o, 1953 + 50 * o)),
      fCivTermCount(`${g}ctL3`, 3, 100, R(1900 + 50 * o, 1911 + 50 * o), R(2, 7)),
      fCivTermNth(`${g}ctL4`, 4, 100, R(1912 + 50 * o, 1923 + 50 * o), R(3, 9)),
      fCivTermMid(`${g}ctL5`, 5, 100, R(1924 + 50 * o, 1935 + 50 * o), R(2, 5), R(1, 3)),
      fCivTermSync(`${g}ctL6`, 6, 100, R(1936 + 50 * o, 1947 + 50 * o)),
    ], "CIVICS"),
  ];
}

function ecoFiller(grade: number, deficit: number): TopicSpec[] {
  const o = grade - 3;
  const [cPrices, cIncome, cGrowth] = spread(deficit, [0.4, 0.27, 0.33]);
  const pr = rungs(cPrices!), inc = rungs(cIncome!), gr = rungs(cGrowth!);
  const g = `g${grade}`;
  const prices: Record<number, ChapterName> = {
    3: CN("Buying and Selling", "खरीदना और बेचना", "खरेदी आणि विक्री"),
    4: CN("Buying and Selling", "खरीदना और बेचना", "खरेदी आणि विक्री"),
    5: CN("Buying and Selling", "खरीदना और बेचना", "खरेदी आणि विक्री"),
    6: CN("Markets Around Us", "हमारे आस-पास के बाज़ार", "आपल्या भोवतालचे बाजार"),
    7: CN("Markets Around Us", "हमारे आस-पास के बाज़ार", "आपल्या भोवतालचे बाजार"),
    8: CN("Prices, Discounts and Taxes", "दाम, छूट और कर", "किमती, सूट आणि कर"),
    9: CN("Prices, Discounts and Taxes", "दाम, छूट और कर", "किमती, सूट आणि कर"),
    10: CN("Prices, Discounts and Taxes", "दाम, छूट और कर", "किमती, सूट आणि कर"),
    11: CN("Prices, Discounts and Taxes", "दाम, छूट और कर", "किमती, सूट आणि कर"),
    12: CN("GST and Prices", "जीएसटी और दाम", "जीएसटी आणि किमती"),
  };
  const income: Record<number, ChapterName> = {
    3: CN("Earning and Saving", "कमाई और बचत", "कमाई आणि बचत"),
    4: CN("Earning and Saving", "कमाई और बचत", "कमाई आणि बचत"),
    5: CN("Earning and Saving", "कमाई और बचत", "कमाई आणि बचत"),
    6: CN("Livelihoods and Incomes", "आजीविका और आय", "उपजीविका आणि उत्पन्न"),
    7: CN("Livelihoods and Incomes", "आजीविका और आय", "उपजीविका आणि उत्पन्न"),
    8: CN("Livelihoods and Incomes", "आजीविका और आय", "उपजीविका आणि उत्पन्न"),
    9: CN("People as Resource", "संसाधन के रूप में लोग", "साधन म्हणून माणसे"),
    10: CN("Development: Per Capita Income", "विकास: प्रति व्यक्ति आय", "विकास: दरडोई उत्पन्न"),
    11: CN("Incomes and Averages", "आय और औसत", "उत्पन्न आणि सरासरी"),
    12: CN("National Income Aggregates", "राष्ट्रीय आय समुच्चय", "राष्ट्रीय उत्पन्न एकत्रित"),
  };
  const growth: Record<number, ChapterName> = {
    3: CN("Growing More", "और उगाना", "अधिक पिकवणे"),
    4: CN("Growing More", "और उगाना", "अधिक पिकवणे"),
    5: CN("Growing More", "और उगाना", "अधिक पिकवणे"),
    6: CN("Farms and Growth", "खेत और वृद्धि", "शेते आणि वाढ"),
    7: CN("Farms and Growth", "खेत और वृद्धि", "शेते आणि वाढ"),
    8: CN("Farms and Growth", "खेत और वृद्धि", "शेते आणि वाढ"),
    9: CN("The Story of Village Palampur: Farm Numbers", "गाँव पालमपुर की कहानी: खेती के आँकड़े", "पालमपूर गावाची गोष्ट: शेतीचे आकडे"),
    10: CN("Growth Rates", "वृद्धि दरें", "वाढीचे दर"),
    11: CN("Growth Rates", "वृद्धि दरें", "वाढीचे दर"),
    12: CN("Growth Rates", "वृद्धि दरें", "वाढीचे दर"),
  };
  return [
    chapterTopic(grade, "eco-prices", prices[grade]!, [
      fEcoDiscount(`${g}efL1`, 1, pr[0], R(2 + 150 * o, 151 + 150 * o)),
      fEcoGST(`${g}efL2`, 2, pr[1], R(2 + 120 * o, 121 + 120 * o)),
      fEcoDiscPct(`${g}epL3`, 3, pr[2], R(2 + 100 * o, 101 + 100 * o)),
      fEcoDiscGST(`${g}epL4`, 4, pr[3], R(2 + 60 * o, 61 + 60 * o)),
      fEcoSuccDisc(`${g}epL5`, 5, pr[4], R(2 + 60 * o, 61 + 60 * o)),
      fEcoMarkup(`${g}epL6`, 6, pr[5], R(2 + 40 * o, 41 + 40 * o)),
    ], "ECONOMICS"),
    chapterTopic(grade, "eco-income", income[grade]!, [
      fEcoPerCapita(`${g}efL3`, 1, inc[0], R(50 + 300 * o, 199 + 300 * o), R(2, 99)),
      fEcoTotal(`${g}eiL2`, 2, inc[1], R(200 + 300 * o, 349 + 300 * o), R(2, 99)),
      fEcoPeople(`${g}eiL3`, 3, inc[2], R(30 + 120 * o, 149 + 120 * o), R(2, 99)),
      fEcoPCGrow(`${g}eiL4`, 4, inc[3], R(10 + 50 * o, 59 + 50 * o), R(1, 15)),
      fEcoWeighted(`${g}eiL5`, 5, inc[4], R(100 + 100 * o, 199 + 100 * o), R(1, 6), R(2, 4), R(10, 49)),
      fEcoMergeVillages(`${g}eiL6`, 6, inc[5], R(300 + 200 * o, 499 + 200 * o), R(10, 30), R(31, 60), R(1, 15)),
    ], "ECONOMICS"),
    chapterTopic(grade, "eco-growth", growth[grade]!, [
      fEcoGrowth(`${g}efL4`, 1, gr[0], R(2 + 140 * o, 71 + 140 * o), R(5, 60)),
      fEcoGrowAbs(`${g}egL2`, 2, gr[1], R(2 + 50 * o, 51 + 50 * o), R(1, 15)),
      fEcoDecline(`${g}egL3`, 3, gr[2], R(2 + 50 * o, 51 + 50 * o), R(1, 15)),
      fEcoTwoYear(`${g}egL4`, 4, gr[3], R(2 + 40 * o, 41 + 40 * o)),
      fEcoNetChange(`${g}egL5`, 5, gr[4], R(2 + 40 * o, 41 + 40 * o)),
      fEcoRatioSplit(`${g}egL6`, 6, gr[5], R(5 + 40 * o, 44 + 40 * o)),
    ], "ECONOMICS"),
  ];
}

/* ----------------------------- curricula ---------------------------------- */

function mathsCurriculum(grade: number): TopicSpec[] {
  const g = `g${grade}`;
  switch (grade) {
    case 3:
      return [
        mkTopic(3, 0, "addsub", "Give and Take", "लेन-देन", "देवाण-घेवाण", [
          fAdd(`${g}a1`, 1, 800, R(10, 49), R(10, 49)),
          fAdd(`${g}a2`, 2, 1500, R(50, 99), R(10, 99)),
          fSub(`${g}a3`, 3, 2500, R(60, 99), R(10, 59)),
          fAdd(`${g}a4`, 4, 2500, R(100, 499), R(100, 499)),
          fSub(`${g}a5`, 5, 1750, R(500, 999), R(100, 499)),
          fAdd(`${g}a6`, 6, 1000, R(1000, 4999), R(1000, 4999)),
        ]),
        mkTopic(3, 1, "tables", "How Many Times?", "कितनी बार?", "किती वेळा?", [
          fMul(`${g}t1`, 1, 450, R(2, 9), R(2, 19)),
          fMul(`${g}t2`, 2, 1500, R(2, 9), R(20, 99)),
          fMul(`${g}t3`, 3, 2500, R(10, 19), R(11, 99)),
          fMul(`${g}t4`, 4, 2500, R(20, 49), R(11, 99)),
          fMul(`${g}t5`, 5, 1750, R(50, 99), R(11, 99)),
          fMul(`${g}t6`, 6, 1000, R(100, 999), R(2, 9)),
        ]),
        mkTopic(3, 2, "division", "Can We Share?", "क्या हम बाँट सकते हैं?", "आपण वाटू शकतो का?", [
          fDiv(`${g}d1`, 1, 200, R(2, 9), R(2, 9)),
          fDiv(`${g}d2`, 2, 250, R(2, 9), R(10, 19)),
          fDiv(`${g}d3`, 3, 2200, R(10, 99), R(2, 9)),
          fDiv(`${g}d4`, 4, 2500, R(10, 99), R(10, 19)),
          fRem(`${g}d5`, 5, 1750, R(10, 99), R(3, 9), R(1, 8)),
          fRem(`${g}d6`, 6, 1000, R(100, 999), R(3, 9), R(1, 8)),
        ]),
        mkTopic(3, 3, "place", "Fun with Numbers", "संख्याओं के साथ मस्ती", "संख्यांची गंमत", [
          fRound(`${g}p1`, 1, 140, R(11, 99), 10),
          fRound(`${g}p2`, 2, 1400, R(101, 999), 10),
          fPlace(`${g}p3`, 3, 2500, 4),
          fRound(`${g}p4`, 4, 2500, R(1001, 9999), 100),
          fPlace(`${g}p5`, 5, 1750, 5),
          fRound(`${g}p6`, 6, 1000, R(10001, 99999), 1000),
        ]),
        mkTopic(3, 4, "units", "Time Goes On", "समय चलता रहता है", "वेळ पुढे जातो", [
          fTime(`${g}u1`, 1, 150, R(2, 49)),
          fTime(`${g}u2`, 2, 480, R(50, 199)),
          fMetric(`${g}u3`, 3, 630, R(2, 199)),
          fTime(`${g}u4`, 4, 2500, R(200, 999)),
          fMetric(`${g}u5`, 5, 1750, R(200, 999)),
          fTime(`${g}u6`, 6, 1000, R(1000, 9999)),
        ]),
        mkTopic(3, 5, "shapes", "Shapes and Designs", "आकृतियाँ और डिज़ाइन", "आकार आणि रचना", [
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
        mkTopic(4, 1, "longdiv", "Tables and Shares", "पहाड़े और बँटवारा", "पाढे आणि वाटण्या", [
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
        mkTopic(4, 3, "fracintro", "Halves and Quarters", "आधा और चौथाई", "अर्धा आणि पाव", [
          fFracOf(`${g}fr1`, 1, 800, R(2, 30)),
          fEquiv(`${g}fr2`, 2, 640, R(2, 6)),
          fFracOf(`${g}fr3`, 3, 2200, R(31, 90)),
          fEquiv(`${g}fr4`, 4, 770, R(7, 12)),
          fFracAdd(`${g}fr5`, 5, 400, 5, 18),
          fFracOf(`${g}fr6`, 6, 1000, R(91, 150)),
        ]),
        mkTopic(4, 4, "units4", "Measurement conversions", "मापन रूपांतरण", "मापन रूपांतरण", [
          fMetric(`${g}u1`, 1, 600, R(1000, 1199)),
          fTime(`${g}u2`, 2, 1500, R(10000, 10499)),
          fMetric(`${g}u3`, 3, 2500, R(1200, 1999)),
          fTime(`${g}u4`, 4, 2500, R(10500, 11499)),
          fMetric(`${g}u5`, 5, 1750, R(2000, 2999)),
          fTime(`${g}u6`, 6, 1000, R(11500, 11999)),
        ]),
        mkTopic(4, 5, "geo4", "Fields and Fences", "खेत और बाड़", "शेते आणि कुंपणे", [
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
        mkTopic(5, 0, "decimals", "Tenths and Hundredths", "दसवाँ और सौवाँ भाग", "दशांश आणि शतांश", [
          fDec(`${g}de1`, 1, 800, R(11, 99), R(11, 99), "+"),
          fDec(`${g}de2`, 2, 1500, R(101, 999), R(11, 99), "+"),
          fDec(`${g}de3`, 3, 2500, R(101, 999), R(11, 99), "-"),
          fDec(`${g}de4`, 4, 2500, R(11, 99), R(2, 19), "*"),
          fDec(`${g}de5`, 5, 1750, R(1001, 9999), R(101, 999), "-"),
          fDec(`${g}de6`, 6, 1000, R(101, 299), R(11, 19), "*"),
        ]),
        mkTopic(5, 1, "frac5", "Parts and Wholes", "हिस्से और पूरा", "भाग आणि पूर्ण", [
          fFracAdd(`${g}fa1`, 1, 300, 19, 32),
          fFracOf(`${g}fa2`, 2, 1500, R(151, 220)),
          fEquiv(`${g}fa3`, 3, 1000, R(13, 20)),
          fFracOf(`${g}fa4`, 4, 2200, R(221, 320)),
          fFracAdd(`${g}fa5`, 5, 380, 33, 45),
          fFracOf(`${g}fa6`, 6, 1000, R(321, 400)),
        ]),
        mkTopic(5, 2, "avg5", "Smart Charts: Averages", "स्मार्ट चार्ट: औसत", "स्मार्ट तक्ते: सरासरी", [
          fAvg(`${g}av1`, 1, 500, R(20, 99)),
          fAvg(`${g}av2`, 2, 1500, R(100, 299)),
          fAvg(`${g}av3`, 3, 1500, R(300, 499)),
          fAvg(`${g}av4`, 4, 1500, R(500, 699)),
          fAvg(`${g}av5`, 5, 1500, R(700, 899)),
          fAvg(`${g}av6`, 6, 780, R(900, 999)),
        ]),
        mkTopic(5, 3, "volume", "How Big? How Heavy?", "कितना बड़ा? कितना भारी?", "किती मोठे? किती जड?", [
          fVolCube(`${g}vo1`, 1, 75, R(2, 49)),
          fVolCuboid(`${g}vo2`, 2, 1500, R(2, 20), R(2, 20), R(2, 20)),
          fVolCuboid(`${g}vo3`, 3, 2500, R(21, 40), R(2, 20), R(2, 20)),
          fVolCuboid(`${g}vo4`, 4, 2500, R(41, 99), R(2, 30), R(2, 20)),
          fVolCuboid(`${g}vo5`, 5, 1750, R(100, 199), R(2, 30), R(2, 20)),
          fVolCube(`${g}vo6`, 6, 100, R(50, 120)),
        ]),
        mkTopic(5, 4, "pct5", "Percentages", "प्रतिशत", "शेकडेवारी", [
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
        mkTopic(6, 1, "ratio", "Ratio and Proportion", "अनुपात और समानुपात", "गुणोत्तर आणि प्रमाण", [
          fRatio(`${g}ra1`, 1, 700, R(2, 24)),
          fRatio(`${g}ra2`, 2, 1400, R(25, 49)),
          fRatio(`${g}ra3`, 3, 2100, R(50, 99)),
          fRatio(`${g}ra4`, 4, 1700, R(150, 199)),
          fRatio(`${g}ra5`, 5, 1700, R(100, 149)),
          fRatio(`${g}ra6`, 6, 1000, R(200, 229)),
        ]),
        mkTopic(6, 2, "angles", "Understanding Elementary Shapes", "प्रारंभिक आकारों को समझना", "मूलभूत आकार समजून घेणे", [
          fAngle(`${g}an1`, 1, 110, R(10, 80), "complementary"),
          fAngle(`${g}an2`, 2, 255, R(10, 170), "supplementary"),
          fTriAngle(`${g}an3`, 3, 2500, R(20, 80), R(20, 80)),
          fTriAngle(`${g}an4`, 4, 400, R(81, 100), R(20, 60)),
          fTriAngle(`${g}an5`, 5, 900, R(20, 80), R(81, 99)),
          fTriAngle(`${g}an6`, 6, 600, R(101, 140), R(20, 39)),
        ]),
        mkTopic(6, 3, "algintro", "Algebra", "बीजगणित", "बीजगणित", [
          fEvalLin(`${g}al1`, 1, 400, R(2, 9), R(1, 20), R(2, 9)),
          fSolve(`${g}al2`, 2, 750, R(2, 9), R(2, 20), R(1, 30)),
          fEvalLin(`${g}al3`, 3, 1250, R(2, 12), R(21, 60), R(10, 19)),
          fSolve(`${g}al4`, 4, 1250, R(2, 12), R(21, 50), R(31, 60)),
          fEvalLin(`${g}al5`, 5, 875, R(13, 19), R(1, 60), R(2, 19)),
          fSolve(`${g}al6`, 6, 500, R(13, 19), R(2, 50), R(1, 60)),
        ]),
        mkTopic(6, 4, "lcmhcf", "Playing with Numbers", "संख्याओं के साथ खेलना", "संख्यांशी खेळ", [
          fLcm(`${g}lh1`, 1, 500, R(61, 80), R(2, 30)),
          fHcf(`${g}lh2`, 2, 1200, R(31, 45), R(2, 12), R(2, 12)),
          fLcm(`${g}lh3`, 3, 2000, R(61, 99), R(31, 99)),
          fHcf(`${g}lh4`, 4, 1600, R(46, 60), R(2, 12), R(2, 12)),
          fLcm(`${g}lh5`, 5, 850, R(81, 99), R(2, 30)),
          fHcf(`${g}lh6`, 6, 1000, R(61, 75), R(2, 12), R(2, 12)),
        ]),
        mkTopic(6, 5, "mensuration6", "Mensuration", "क्षेत्रमिति", "क्षेत्रमिती", [
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
        mkTopic(7, 0, "int7", "Integers", "पूर्णांक", "पूर्णांक", [
          fInt(`${g}i1`, 1, 800, R(2000, 2999), R(2, 999)),
          fInt(`${g}i2`, 2, 1500, R(3000, 3999), R(2, 999)),
          fInt(`${g}i3`, 3, 2500, R(4000, 4999), R(2, 1999)),
          fInt(`${g}i4`, 4, 2500, R(5000, 5999), R(2, 1999)),
          fInt(`${g}i5`, 5, 1750, R(6000, 6999), R(2, 2999)),
          fInt(`${g}i6`, 6, 1000, R(7000, 7999), R(2, 2999)),
        ]),
        mkTopic(7, 1, "eq7", "Simple Equations", "सरल समीकरण", "साधी समीकरणे", [
          fSolve(`${g}e1`, 1, 800, R(2, 9), R(51, 99), R(61, 99)),
          fSolve(`${g}e2`, 2, 1500, R(2, 12), R(100, 199), R(1, 99)),
          fSolve(`${g}e3`, 3, 2500, R(13, 25), R(51, 150), R(1, 99)),
          fSolve(`${g}e4`, 4, 2500, R(26, 40), R(2, 99), R(100, 199)),
          fSolve(`${g}e5`, 5, 1750, R(41, 60), R(2, 99), R(200, 299)),
          fSolve(`${g}e6`, 6, 1000, R(61, 80), R(2, 99), R(300, 399)),
        ]),
        mkTopic(7, 2, "exp7", "Exponents and Powers", "घातांक और घात", "घातांक आणि घात", [
          fSquare(`${g}x1`, 1, 150, R(2, 99)),
          fPow(`${g}x2`, 2, 130, R(2, 15), R(2, 5)),
          fSquare(`${g}x3`, 3, 780, R(100, 599)),
          fCube(`${g}x4`, 4, 90, R(2, 60)),
          fPow(`${g}x5`, 5, 100, R(16, 30), R(2, 4)),
          fSquare(`${g}x6`, 6, 620, R(600, 999)),
        ]),
        mkTopic(7, 3, "dec7", "Fractions and Decimals", "भिन्न एवं दशमलव", "अपूर्णांक आणि दशांश", [
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
        mkTopic(8, 0, "lineq", "Linear Equations in One Variable", "एक चर वाले रैखिक समीकरण", "एका चलातील रेषीय समीकरणे", [
          fSolve(`${g}l1`, 1, 800, R(81, 99), R(2, 99), R(1, 99)),
          fSolve(`${g}l2`, 2, 1500, R(100, 125), R(2, 99), R(1, 99)),
          fSolve(`${g}l3`, 3, 2500, R(126, 160), R(2, 99), R(100, 199)),
          fSolve(`${g}l4`, 4, 2500, R(161, 199), R(2, 99), R(200, 299)),
          fSolve(`${g}l5`, 5, 1750, R(200, 249), R(2, 99), R(300, 399)),
          fSolve(`${g}l6`, 6, 1000, R(250, 299), R(2, 99), R(400, 499)),
        ]),
        mkTopic(8, 1, "roots", "Squares, Cubes and Roots", "वर्ग, घन और मूल", "वर्ग, घन आणि मुळे", [
          fSquare(`${g}r1`, 1, 700, R(1000, 1499)),
          fSqrt(`${g}r2`, 2, 470, R(2, 300)),
          fCube(`${g}r3`, 3, 140, R(61, 150)),
          fCbrt(`${g}r4`, 4, 90, R(2, 60)),
          fSqrt(`${g}r5`, 5, 470, R(301, 600)),
          fCbrt(`${g}r6`, 6, 100, R(61, 130)),
        ]),
        mkTopic(8, 2, "circle8", "Mensuration: Circles", "क्षेत्रमिति: वृत्त", "क्षेत्रमिती: वर्तुळे", [
          fCircle(`${g}ci1`, 1, 60, R(1, 40), "circumference"),
          fCircle(`${g}ci2`, 2, 60, R(1, 40), "area"),
          fCircle(`${g}ci3`, 3, 90, R(41, 99), "circumference"),
          fCircle(`${g}ci4`, 4, 90, R(41, 99), "area"),
          fCircle(`${g}ci5`, 5, 80, R(100, 150), "circumference"),
          fCircle(`${g}ci6`, 6, 80, R(100, 150), "area"),
        ]),
        mkTopic(8, 3, "solids", "Mensuration: Solids", "क्षेत्रमिति: ठोस", "क्षेत्रमिती: घनाकृती", [
          fVolCube(`${g}so1`, 1, 100, R(121, 199)),
          fCylVol(`${g}so2`, 2, 400, R(1, 20), R(2, 30)),
          fVolCuboid(`${g}so3`, 3, 2500, R(200, 299), R(2, 30), R(2, 20)),
          fCylVol(`${g}so4`, 4, 450, R(21, 40), R(2, 30)),
          fVolCuboid(`${g}so5`, 5, 1750, R(300, 399), R(2, 30), R(2, 20)),
          fCylVol(`${g}so6`, 6, 450, R(41, 60), R(2, 30)),
        ]),
        mkTopic(8, 4, "poly8", "Algebraic Expressions", "बीजीय व्यंजक", "बैजिक राशी", [
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
          fDist(`${g}co1`, 1, 480, R(0, 20), R(1, 8)),
          fSlope(`${g}co2`, 2, 900, R(0, 12), R(1, 9), R(0, 15)),
          fDist(`${g}co3`, 3, 1500, R(21, 45), R(1, 8)),
          fSlope(`${g}co4`, 4, 1500, R(0, 12), R(1, 9), R(16, 35)),
          fDist(`${g}co5`, 5, 1050, R(46, 70), R(1, 8)),
          fSlope(`${g}co6`, 6, 570, R(0, 12), R(1, 9), R(36, 55)),
        ]),
        mkTopic(9, 2, "tri9", "Areas of Triangles", "त्रिभुजों के क्षेत्रफल", "त्रिकोणांची क्षेत्रफळे", [
          fAreaTri(`${g}t1`, 1, 400, R(121, 160), R(2, 99)),
          fAreaTri(`${g}t2`, 2, 750, R(161, 220), R(2, 99)),
          fAreaTri(`${g}t3`, 3, 1250, R(221, 320), R(2, 99)),
          fAreaTri(`${g}t4`, 4, 1250, R(321, 420), R(2, 99)),
          fAreaTri(`${g}t5`, 5, 875, R(421, 520), R(2, 99)),
          fAreaTri(`${g}t6`, 6, 475, R(521, 620), R(2, 99)),
        ]),
        mkTopic(9, 3, "stats9", "Statistics", "सांख्यिकी", "संख्याशास्त्र", [
          fAvg(`${g}st1`, 1, 400, R(1000, 1199)),
          fAvg(`${g}st2`, 2, 750, R(1200, 1499)),
          fAvg(`${g}st3`, 3, 1250, R(1500, 1899)),
          fAvg(`${g}st4`, 4, 1250, R(1900, 2299)),
          fAvg(`${g}st5`, 5, 875, R(2300, 2599)),
          fAvg(`${g}st6`, 6, 475, R(2600, 2799)),
        ]),
        mkTopic(9, 4, "prob9", "Probability", "प्रायिकता", "संभाव्यता", [
          fProb(`${g}pr1`, 1, 300, R(1, 20), R(1, 20)),
          fProb(`${g}pr2`, 2, 700, R(21, 50), R(1, 30)),
          fProb(`${g}pr3`, 3, 900, R(1, 40), R(31, 60)),
          fProb(`${g}pr4`, 4, 900, R(41, 75), R(1, 35)),
          fProb(`${g}pr5`, 5, 800, R(51, 85), R(36, 70)),
          fProb(`${g}pr6`, 6, 500, R(86, 110), R(1, 40)),
        ]),
        mkTopic(9, 5, "solids9", "Surface Areas and Volumes", "पृष्ठीय क्षेत्रफल एवं आयतन", "पृष्ठफळ आणि घनफळ", [
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
        mkTopic(10, 0, "quad", "Quadratic Equations", "द्विघात समीकरण", "वर्गसमीकरणे", [
          fQuad(`${g}q1`, 1, 700, R(1, 30), R(1, 30)),
          fQuad(`${g}q2`, 2, 700, R(31, 60), R(1, 30)),
          fQuad(`${g}q3`, 3, 700, R(61, 90), R(1, 30)),
          fQuad(`${g}q4`, 4, 700, R(91, 120), R(1, 30)),
          fQuad(`${g}q5`, 5, 700, R(121, 150), R(1, 30)),
          fQuad(`${g}q6`, 6, 700, R(151, 180), R(1, 30)),
        ]),
        mkTopic(10, 1, "ap", "Arithmetic Progressions", "समांतर श्रेढ़ियाँ", "अंकगणिती श्रेढी", [
          fApN(`${g}a1`, 1, 800, R(2, 60), R(2, 30), R(5, 60)),
          fApSum(`${g}a2`, 2, 1500, R(2, 60), R(2, 30), R(5, 60)),
          fApN(`${g}a3`, 3, 2500, R(61, 150), R(2, 40), R(5, 80)),
          fApSum(`${g}a4`, 4, 2500, R(61, 150), R(2, 40), R(5, 80)),
          fApN(`${g}a5`, 5, 1750, R(151, 250), R(2, 50), R(5, 99)),
          fApSum(`${g}a6`, 6, 1000, R(151, 250), R(2, 50), R(5, 99)),
        ]),
        mkTopic(10, 2, "trig", "Introduction to Trigonometry", "त्रिकोणमिति का परिचय", "त्रिकोणमितीची ओळख", [
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
      ];
    case 11:
      return [
        mkTopic(11, 0, "counting", "Permutations and Combinations", "क्रमचय और संचय", "क्रमांतरण आणि संयोग", [
          fNpr(`${g}c1`, 1, 95, R(5, 30), R(2, 3)),
          fNcr(`${g}c2`, 2, 130, R(5, 30), R(2, 4)),
          fNpr(`${g}c3`, 3, 100, R(31, 60), R(2, 3)),
          fNcr(`${g}c4`, 4, 130, R(31, 60), R(2, 4)),
          fNpr(`${g}c5`, 5, 90, R(61, 90), R(2, 3)),
          fNcr(`${g}c6`, 6, 120, R(61, 90), R(2, 4)),
        ]),
        mkTopic(11, 1, "seq11", "Sequences and Series", "अनुक्रम तथा श्रेणी", "श्रेढी आणि श्रेणी", [
          fApN(`${g}s1`, 1, 800, R(251, 350), R(2, 60), R(5, 99)),
          fGpN(`${g}s2`, 2, 100, R(1, 6), R(2, 4), R(3, 9)),
          fApSum(`${g}s3`, 3, 2500, R(251, 350), R(2, 60), R(5, 99)),
          fGpN(`${g}s4`, 4, 100, R(7, 12), R(2, 4), R(3, 9)),
          fApN(`${g}s5`, 5, 1750, R(351, 450), R(2, 70), R(5, 99)),
          fApSum(`${g}s6`, 6, 1000, R(351, 450), R(2, 70), R(5, 99)),
        ]),
        mkTopic(11, 2, "lines", "Straight Lines", "सरल रेखाएँ", "सरळ रेषा", [
          fSlope(`${g}l1`, 1, 800, R(0, 12), R(1, 9), R(126, 145)),
          fDist(`${g}l2`, 2, 1500, R(156, 185), R(1, 8)),
          fSlope(`${g}l3`, 3, 2500, R(0, 12), R(1, 9), R(146, 175)),
          fDist(`${g}l4`, 4, 2500, R(186, 215), R(1, 8)),
          fSlope(`${g}l5`, 5, 1750, R(0, 12), R(1, 9), R(176, 205)),
          fDist(`${g}l6`, 6, 1000, R(216, 245), R(1, 8)),
        ]),
        mkTopic(11, 3, "trig11", "Trigonometric Functions", "त्रिकोणमितीय फलन", "त्रिकोणमितीय फले", [
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
        mkTopic(11, 5, "quad11", "Complex Numbers and Quadratic Equations", "सम्मिश्र संख्याएँ और द्विघात समीकरण", "संमिश्र संख्या आणि वर्गसमीकरणे", [
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
          fDet(`${g}m1`, 1, 400, R(0, 10)),
          fDet(`${g}m2`, 2, 750, R(0, 14)),
          fDet(`${g}m3`, 3, 1250, R(0, 18)),
          fDet(`${g}m4`, 4, 1250, R(0, 22)),
          fDet(`${g}m5`, 5, 875, R(0, 26)),
          fDet(`${g}m6`, 6, 500, R(0, 30)),
        ]),
        mkTopic(12, 1, "vectors", "Vectors", "सदिश", "सदिश", [
          fDot(`${g}v1`, 1, 400, R(0, 8)),
          fDot(`${g}v2`, 2, 750, R(0, 10)),
          fDot(`${g}v3`, 3, 1250, R(0, 12)),
          fDot(`${g}v4`, 4, 1250, R(0, 14)),
          fDot(`${g}v5`, 5, 875, R(0, 16)),
          fDot(`${g}v6`, 6, 500, R(0, 18)),
        ]),
        mkTopic(12, 2, "deriv", "Continuity and Differentiability", "सांतत्य तथा अवकलनीयता", "सांतत्य आणि अवकलनीयता", [
          fDeriv(`${g}d1`, 1, 400, R(1, 9), R(-9, 9), R(1, 6)),
          fDeriv(`${g}d2`, 2, 750, R(1, 12), R(-12, 12), R(7, 12)),
          fDeriv(`${g}d3`, 3, 1250, R(1, 15), R(-15, 15), R(13, 20)),
          fDeriv(`${g}d4`, 4, 1250, R(1, 18), R(-18, 18), R(21, 28)),
          fDeriv(`${g}d5`, 5, 875, R(1, 21), R(-21, 21), R(29, 36)),
          fDeriv(`${g}d6`, 6, 500, R(1, 24), R(-24, 24), R(37, 44)),
        ]),
        mkTopic(12, 3, "integ", "Integrals", "समाकलन", "संकलन", [
          fInteg(`${g}i1`, 1, 400, R(1, 20), R(0, 10), R(1, 10)),
          fInteg(`${g}i2`, 2, 750, R(1, 30), R(0, 12), R(11, 20)),
          fInteg(`${g}i3`, 3, 1250, R(1, 40), R(0, 14), R(21, 32)),
          fInteg(`${g}i4`, 4, 1250, R(1, 50), R(0, 16), R(33, 44)),
          fInteg(`${g}i5`, 5, 875, R(1, 60), R(0, 18), R(45, 56)),
          fInteg(`${g}i6`, 6, 500, R(1, 70), R(0, 20), R(57, 68)),
        ]),
        mkTopic(12, 4, "prob12", "Probability", "प्रायिकता", "संभाव्यता", [
          fProb(`${g}p1`, 1, 500, R(321, 350), R(1, 40)),
          fProb(`${g}p2`, 2, 900, R(351, 385), R(1, 45)),
          fProb(`${g}p3`, 3, 1200, R(386, 425), R(1, 50)),
          fProb(`${g}p4`, 4, 1200, R(426, 465), R(1, 50)),
          fProb(`${g}p5`, 5, 1000, R(466, 500), R(1, 45)),
          fProb(`${g}p6`, 6, 700, R(501, 530), R(1, 40)),
        ]),
        mkTopic(12, 5, "series12", "Sequences and Series Revision", "अनुक्रम-श्रेणी पुनरावृत्ति", "श्रेढी-श्रेणी उजळणी", [
          fApSum(`${g}s1`, 1, 800, R(451, 550), R(2, 80), R(5, 99)),
          fGpN(`${g}s2`, 2, 100, R(13, 18), R(2, 4), R(3, 9)),
          fApSum(`${g}s3`, 3, 2500, R(551, 650), R(2, 80), R(5, 99)),
          fApN(`${g}s4`, 4, 2500, R(451, 550), R(2, 80), R(5, 99)),
          fApSum(`${g}s5`, 5, 1750, R(651, 750), R(2, 80), R(5, 99)),
          fApN(`${g}s6`, 6, 1000, R(551, 650), R(2, 80), R(5, 99)),
        ]),
      ];
    default:
      throw new Error(`no maths plan for grade ${grade}`);
  }
}

/**
 * Subject curricula beyond maths. Small and specific: recall topics appear in
 * exactly ONE grade each (a fact question exists once in the whole bank), and
 * the moved money/interest/profit families keep their original ranges so no
 * stem collides with anything the maths plans ever generated.
 */
function subjectCurriculum(grade: number, subject: Subject): TopicSpec[] {
  const g = `g${grade}`;
  if (subject === "SCIENCE") {
    if (grade === 5)
      return [
        mkTopic(5, 0, "scispeed5", "Fast and Slow: Speed", "तेज़ और धीमा: चाल", "जलद आणि हळू: वेग", [
          fSpeed(`${g}un2`, 1, 550, R(5, 90), R(2, 9)),
          fSpeed(`${g}un4`, 2, 650, R(91, 299), R(2, 9)),
          fSpeed(`${g}un6`, 3, 1000, R(300, 480), R(2, 9)),
          fSpeed(`${g}un8`, 4, 300, R(661, 760), R(2, 9)),
          fSciDist(`${g}un10`, 5, 200, R(1300, 1399), R(2, 29)),
          fSciAvgSpeed(`${g}un12`, 6, 150, R(850, 909), R(1, 15), R(2, 9)),
        ], "SCIENCE"),
      ];
    if (grade === 6)
      return [
        mkTopic(6, 0, "scimeasure", "Motion and Measurement", "गति और मापन", "गती आणि मापन", [
          fRecall(`${g}siunits`, 1, 20, SI_UNITS, UNIT_SKIN),
          fSciCF(`${g}cf`, 2, 30, R(1, 20)),
          fSpeed(`${g}ra6`, 3, 1000, R(481, 660), R(2, 9)),
          fSciFC(`${g}fc6`, 4, 60, R(21, 80)),
          fSciDist(`${g}md6`, 5, 400, R(1210, 1269), R(2, 29)),
          fSciAvgSpeed(`${g}ma6`, 6, 300, R(920, 979), R(1, 15), R(2, 9)),
        ], "SCIENCE"),
      ];
    if (grade === 8)
      return [
        mkTopic(8, 0, "scielements", "Materials: Elements and Symbols", "सामग्री: तत्व और प्रतीक", "पदार्थ: मूलद्रव्ये आणि चिन्हे", [
          fRecall(`${g}elem`, 1, 38, ELEMENTS, ELEMENT_SKIN),
          fRecall(`${g}sym`, 2, 38, reverseFacts(ELEMENTS), SYMBOL_SKIN),
          fSciHeat(`${g}heat`, 3, 400, R(2, 21), R(5, 40)),
          fSciHeat(`${g}heat2`, 4, 400, R(22, 41), R(5, 40)),
          fSciHeatM(`${g}heatm`, 5, 300, R(2, 30), R(5, 30)),
          fSciHeatT(`${g}heatt`, 6, 300, R(2, 30), R(31, 55)),
        ], "SCIENCE"),
      ];
    if (grade === 9)
      return [
        mkTopic(9, 0, "scimoles9", "Atoms and Molecules", "परमाणु एवं अणु", "अणू आणि रेणू", [
          fSciMoles(`${g}mol`, 1, 450, R(2, 60)),
          fSciMolesMass(`${g}molm`, 2, 350, R(2, 40)),
          fSciMolarM(`${g}molM`, 3, 300, R(2, 50)),
          fSciMolesCompound(`${g}molc`, 4, 300, R(1, 10), R(2, 20), R(2, 20)),
          fSciMolesMix(`${g}molx`, 5, 250, R(2, 20), R(2, 20)),
          fSciMolarity(`${g}molr`, 6, 250, R(1, 10), R(2, 8)),
        ], "SCIENCE"),
      ];
    if (grade === 10)
      return [
        mkTopic(10, 0, "sciwaves10", "Sound and Waves", "ध्वनि और तरंगें", "ध्वनी आणि तरंग", [
          fSciWave(`${g}wave`, 1, 400, R(2, 60), R(2, 20)),
          fSciWaveL(`${g}wavl`, 2, 300, R(2, 50), R(2, 30)),
          fSciWaveF(`${g}wavf`, 3, 300, R(2, 50), R(31, 60)),
          fSciWaveCount(`${g}wavc`, 4, 250, R(5, 60), R(2, 30)),
          fSciEcho(`${g}wave5`, 5, 250, R(1, 60)),
          fSciSonar(`${g}wave6`, 6, 250, R(1, 50)),
        ], "SCIENCE"),
      ];
    return [];
  }
  // Geography, history and civics recall micro-topics fold into their filler
  // chapters as L1 rungs — see geoFiller/histFiller/civFiller.
  if (subject === "GEOGRAPHY" || subject === "HISTORY" || subject === "CIVICS") return [];
  if (subject === "ECONOMICS") {
    if (grade === 3)
      return [
        mkTopic(3, 0, "money", "Rupees and Paise", "रुपये और पैसे", "रुपये आणि पैसे", [
          fSpend(`${g}m1`, 1, 800, R(11, 59), R(11, 59)),
          fSpend(`${g}m2`, 2, 800, R(60, 199), R(25, 199)),
          fChange(`${g}m3`, 3, 120, 100, R(11, 88)),
          fChange(`${g}m4`, 4, 400, 500, R(38, 461)),
          fChange(`${g}m5`, 5, 500, 2000, R(115, 1885)),
          fSpend(`${g}m6`, 6, 600, R(200, 999), R(200, 999)),
        ], "ECONOMICS"),
      ];
    if (grade === 4)
      return [
        mkTopic(4, 0, "money4", "The Junk Seller", "कबाड़ीवाली", "भंगारवाली", [
          fSpend(`${g}mo1`, 1, 400, R(1000, 2999), R(1000, 2999)),
          fChange(`${g}mo2`, 2, 600, 1000, R(115, 985)),
          fUnitCost(`${g}mo3`, 3, 900, R(2, 12), R(2, 99)),
          fSpend(`${g}mo4`, 4, 800, R(3000, 9999), R(1000, 9999)),
          fChange(`${g}mo5`, 5, 800, 5000, R(1115, 4885)),
          fUnitCost(`${g}mo6`, 6, 600, R(13, 25), R(100, 299)),
        ], "ECONOMICS"),
      ];
    if (grade === 5)
      return [
        mkTopic(5, 0, "shop5", "Shop maths", "दुकान का गणित", "दुकानाचे गणित", [
          fUnitCost(`${g}un1`, 1, 500, R(26, 32), R(2, 99)),
          fUnitCost(`${g}un3`, 2, 800, R(33, 44), R(2, 99)),
          fUnitCost(`${g}un5`, 3, 900, R(45, 56), R(2, 99)),
          fSpend(`${g}un7`, 4, 700, R(10000, 19999), R(10000, 19999)),
          fChange(`${g}un9`, 5, 500, 10000, R(1115, 9885)),
          fShopChange(`${g}un11`, 6, 400, R(3, 9), R(57, 99)),
        ], "ECONOMICS"),
      ];
    if (grade === 7)
      return [
        mkTopic(7, 0, "profit", "Profit and loss", "लाभ और हानि", "नफा आणि तोटा", [
          fProfit(`${g}p1`, 1, 490, R(2, 20), R(5, 30)),
          fProfit(`${g}p2`, 2, 1000, R(21, 50), R(5, 40)),
          fProfit(`${g}p3`, 3, 1200, R(51, 99), R(5, 60)),
          fProfit(`${g}p4`, 4, 1000, R(100, 149), R(5, 60)),
          fProfit(`${g}p5`, 5, 800, R(150, 199), R(5, 60)),
          fProfit(`${g}p6`, 6, 500, R(200, 249), R(5, 60)),
        ], "ECONOMICS"),
      ];
    if (grade === 8)
      return [
        mkTopic(8, 0, "ci8", "Comparing Quantities: Interest", "राशियों की तुलना: ब्याज", "राशींची तुलना: व्याज", [
          fCI(`${g}c1`, 1, 130, R(2, 20), R(2, 10)),
          fCI(`${g}c2`, 2, 220, R(21, 40), R(2, 15)),
          fCI(`${g}c3`, 3, 300, R(41, 60), R(2, 20)),
          fCI(`${g}c4`, 4, 300, R(61, 80), R(2, 20)),
          fCI(`${g}c5`, 5, 280, R(81, 99), R(2, 20)),
          fCI(`${g}c6`, 6, 310, R(100, 120), R(2, 20)),
        ], "ECONOMICS"),
      ];
    if (grade === 10)
      return [
        mkTopic(10, 0, "interest10", "Money and Credit", "मुद्रा और साख", "पैसा आणि पत", [
          fSI(`${g}si1`, 1, 800, R(400, 499), R(2, 15), R(2, 9)),
          fCI(`${g}si2`, 2, 450, R(121, 150), R(2, 20)),
          fSI(`${g}si3`, 3, 2500, R(500, 699), R(2, 15), R(2, 9)),
          fCI(`${g}si4`, 4, 600, R(151, 190), R(2, 20)),
          fSI(`${g}si5`, 5, 1750, R(700, 899), R(2, 15), R(2, 9)),
          fCI(`${g}si6`, 6, 440, R(191, 220), R(2, 20)),
        ], "ECONOMICS"),
      ];
    return [];
  }
  return [];
}

const FILLERS: Record<Subject, (grade: number, deficit: number) => TopicSpec[]> = {
  MATHS: mathsFiller,
  SCIENCE: sciFiller,
  GEOGRAPHY: geoFiller,
  HISTORY: histFiller,
  CIVICS: civFiller,
  ECONOMICS: ecoFiller,
};

function gradeTopics(grade: number): TopicSpec[] {
  const targets = split(grade);
  const out: TopicSpec[] = [];
  let position = 0;
  for (const subject of Object.keys(targets) as Subject[]) {
    const topics =
      subject === "MATHS" ? mathsCurriculum(grade) : subjectCurriculum(grade, subject);
    const planned = topics.flatMap((t) => t.templates).reduce((a, t) => a + t.want, 0);
    const deficit = targets[subject] - planned;
    if (deficit <= 0) {
      throw new Error(`grade ${grade} ${subject}: curriculum ${planned} ≥ target ${targets[subject]}`);
    }
    for (const t of topics) out.push({ ...t, position: position++ });
    for (const t of FILLERS[subject](grade, deficit)) out.push({ ...t, position: position++ });
  }
  const total = out.flatMap((t) => t.templates).reduce((a, t) => a + t.want, 0);
  if (total !== GRADE_TARGET) throw new Error(`grade ${grade} plans ${total}, not ${GRADE_TARGET}`);
  // Every chapter must climb the full ladder: exactly levels 1..MAX_LEVEL.
  for (const t of out) {
    const levels = new Set(t.templates.map((x) => x.level));
    if (levels.size !== MAX_LEVEL || Math.min(...levels) !== 1 || Math.max(...levels) !== MAX_LEVEL) {
      throw new Error(`${t.slug}: levels {${[...levels].sort((a, b) => a - b).join(",")}} — every chapter must span L1–L${MAX_LEVEL}`);
    }
  }
  return out;
}

main().catch(async (error) => {
  console.error(error);
  await db.$disconnect();
  process.exit(1);
});
