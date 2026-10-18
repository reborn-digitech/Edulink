/**
 * TIME TO THE FIRST WORD (Vidura pass 3, 18 October 2026; docs/plans/vidura.md, "Latency"): twenty questions across
 * the three modes and the three languages (content/assistant-eval/latency.json), asked through `previewAnswer` — the
 * same tables, retrieval, rendering, classifier, prompt, model and answer gate as the doors — with each model call and
 * search timed. Vidura shows nothing unchecked (the answer streams only after the answer gate has passed it), so the
 * first word reaches the person when the whole checked answer does: the time to the first word is the question's
 * whole time here, less nothing.
 *
 *   npm run assistant:latency                     two rounds, the median per question, a table and a JSON file
 *   npm run assistant:latency -- --rounds=3 --out=<file.json>
 *
 * The model servers are this machine's (ASSISTANT_*; ASSISTANT_GATE_MODEL_URL when the classifier has its own small
 * model). Run it on an idle machine: a generation run or a crawl sharing the model's slots measures them, not Vidura.
 * Writes nothing to the database.
 */
import { config } from "dotenv";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import type { AssistantLanguage } from "@edulink/contracts";
import type { Role } from "../src/lib/constants";
import { previewAnswer, realDeps, type AssistantDeps } from "../src/lib/assistant/service";
import { renderCache } from "../src/lib/assistant/render";
import { toolDataForModel, type ToolRun } from "../src/lib/assistant/tools";
import { detectLanguage } from "../src/lib/assistant/language";
import type { ChatMessage } from "../src/lib/assistant-model";
import { db } from "../src/lib/db";

config();

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`) || a === `--${name}`);
  if (!hit) return undefined;
  return hit.includes("=") ? hit.slice(hit.indexOf("=") + 1) : "true";
}

type Case = { id: string; mode: "USING" | "RECORDS" | "LEARNING"; role: Role; grade?: number; question: string; tool?: string; data?: unknown };
type Timed = { kind: "render" | "classifyQuestion" | "classifyAnswer" | "answer" | "embed" | "search"; ms: number; tokens?: number; cached?: number; read?: number };
type Run = { total: number; verdict: string; chip: string | null; calls: Timed[] };

const ROOT = join(__dirname, "..");
const ROUNDS = Math.max(1, Number(arg("rounds") ?? 2));
const OUT = arg("out") ?? join(ROOT, "storage", "assistant-eval", `latency-${new Date().toISOString().replace(/[:T]/g, "-").slice(0, 16)}.json`);

/** Which call a chat request is, read off its messages (prompt.ts's builders). */
function chatKind(messages: ChatMessage[], grammar: boolean): Timed["kind"] {
  const system = messages[0]?.content ?? "";
  if (grammar) return /an answer a school platform's assistant wrote/.test(system) ? "classifyAnswer" : "classifyQuestion";
  if (/^You render a question/.test(system)) return "render";
  return "answer";
}

function timedDeps(base: AssistantDeps, calls: Timed[]): AssistantDeps {
  const time = async <T>(kind: Timed["kind"], work: () => Promise<T>, more?: (r: T) => Partial<Timed>): Promise<T> => {
    const t = performance.now();
    const r = await work();
    calls.push({ kind, ms: performance.now() - t, ...(more ? more(r) : {}) });
    return r;
  };
  // The prompt the server took from its cache and the part it read afresh (llama-server's timings, pass 3).
  const chat = (via: AssistantDeps["chat"]): AssistantDeps["chat"] => (messages, opts) =>
    time(chatKind(messages, !!opts.grammar), () => via(messages, opts), (r) => ({ tokens: r.usage?.completionTokens ?? 0, cached: r.promptCache?.cachedTokens, read: r.promptCache?.readTokens }));
  return {
    ...base,
    chat: chat(base.chat),
    ...(base.classify ? { classify: chat(base.classify) } : {}),
    embed: (texts) => time("embed", () => base.embed(texts)),
    searchHelp: (q) => time("search", () => base.searchHelp(q)),
    searchCurriculum: (q) => time("search", () => base.searchCurriculum(q)),
    // The rendering (pass 2) is its own port: timed whole (a cached rendering costs about nothing).
    render: base.render ? (stripped, language) => time("render", () => base.render!(stripped, language)) : undefined,
  };
}

const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2]! : (s[s.length / 2 - 1]! + s[s.length / 2]!) / 2;
};
const sec = (ms: number) => (ms / 1000).toFixed(2);
const sum = (calls: Timed[], kind: Timed["kind"]) => calls.filter((c) => c.kind === kind).reduce((a, c) => a + c.ms, 0);

async function main() {
  const set = JSON.parse(readFileSync(join(ROOT, "content", "assistant-eval", "latency.json"), "utf8")) as { cases: Case[] };
  const base = realDeps();
  const results = new Map<string, Run[]>();
  // One question first, unrecorded: the servers' first request after idle loads nothing it should be charged for.
  await previewAnswer({ role: "ADMIN", question: "where do I see the school calendar" }, base);
  for (let round = 1; round <= ROUNDS; round++) {
    // The rendering's in-process cache would make every later round's Hindi and Marathi question free.
    renderCache.clear();
    for (const c of set.cases) {
      const calls: Timed[] = [];
      const deps = timedDeps(base, calls);
      const toolRuns: ToolRun[] | undefined = c.tool ? [{ name: c.tool, ok: true, status: 200, data: toolDataForModel(c.data, []), raw: c.data }] : undefined;
      const language = (detectLanguage(c.question) ?? "en") as AssistantLanguage;
      const t = performance.now();
      const out = await previewAnswer({ role: c.role, question: c.question, language, grade: c.grade ?? null, board: "CBSE", toolRuns }, deps);
      const total = performance.now() - t;
      const run: Run = { total, verdict: out.verdict, chip: out.chip, calls };
      results.set(c.id, [...(results.get(c.id) ?? []), run]);
      console.log(`round ${round} ${c.id.padEnd(8)} ${c.mode.padEnd(8)} ${language} ${sec(total).padStart(6)} s  ${out.verdict}${out.chip ? ` (${out.chip})` : ""}`);
    }
  }

  console.log("\n| Case | Mode | Lang | Verdict | First word (s, median) | Searches | Render | Classify Q | Answer (tokens) | Prompt cached / read | Classify A |");
  console.log("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");
  const byMode = new Map<string, number[]>();
  const gateByMode = new Map<string, number[]>();
  const searchByMode = new Map<string, number[]>();
  const rows = [];
  for (const c of set.cases) {
    const runs = results.get(c.id) ?? [];
    const first = median(runs.map((r) => r.total));
    const pick = (kind: Timed["kind"]) => median(runs.map((r) => sum(r.calls, kind)));
    const tokens = median(runs.map((r) => r.calls.filter((x) => x.kind === "answer").reduce((a, x) => a + (x.tokens ?? 0), 0)));
    const answerCall = (r: Run) => r.calls.find((x) => x.kind === "answer");
    const cached = median(runs.map((r) => answerCall(r)?.cached ?? 0));
    const read = median(runs.map((r) => answerCall(r)?.read ?? 0));
    const language = detectLanguage(c.question) ?? "en";
    const gate = pick("classifyQuestion") + pick("classifyAnswer");
    console.log(`| ${c.id} | ${c.mode} | ${language} | ${runs.map((r) => r.verdict).join("/")} | ${sec(first)} | ${sec(pick("search"))} | ${sec(pick("render"))} | ${sec(pick("classifyQuestion"))} | ${sec(pick("answer"))} (${tokens}) | ${cached} / ${read} | ${sec(pick("classifyAnswer"))} |`);
    byMode.set(c.mode, [...(byMode.get(c.mode) ?? []), first]);
    gateByMode.set(c.mode, [...(gateByMode.get(c.mode) ?? []), gate]);
    searchByMode.set(c.mode, [...(searchByMode.get(c.mode) ?? []), pick("search")]);
    rows.push({ id: c.id, mode: c.mode, language, verdicts: runs.map((r) => r.verdict), firstWordMs: first, searchMs: pick("search"), renderMs: pick("render"), classifyQuestionMs: pick("classifyQuestion"), answerMs: pick("answer"), answerTokens: tokens, promptCached: cached, promptRead: read, classifyAnswerMs: pick("classifyAnswer"), runs });
  }
  console.log("\n| Mode | Questions | First word, median (s) | Searches, median (s) | The two classifier calls, median (s) |");
  console.log("| --- | --- | --- | --- | --- |");
  for (const [mode, xs] of byMode) console.log(`| ${mode} | ${xs.length} | ${sec(median(xs))} | ${sec(median(searchByMode.get(mode) ?? []))} | ${sec(median(gateByMode.get(mode) ?? []))} |`);
  const all = [...byMode.values()].flat();
  const allGate = [...gateByMode.values()].flat();
  console.log(`| all | ${all.length} | ${sec(median(all))} | ${sec(median([...searchByMode.values()].flat()))} | ${sec(median(allGate))} |`);
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify({ rounds: ROUNDS, gateEndpoint: process.env.ASSISTANT_GATE_MODEL_URL ?? null, rows, medianFirstWordMs: median(all), medianGateMs: median(allGate) }, null, 1));
  console.log(`\nwritten ${OUT}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect().catch(() => {});
    process.exit();
  });
