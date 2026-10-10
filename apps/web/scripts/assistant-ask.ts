/**
 * The assistant's smoke test, end to end on this machine — re-pointed at the library in Phase B, so
 * there is ONE path: `previewAnswer` in src/lib/assistant/service.ts runs the same refusal table, the
 * same retrieval and thresholds, the same one-word classifier, the same system prompt (prompt.ts), the
 * same model and the same answer gate as POST /api/v1/assistant/conversations/{id}/messages, for a role,
 * a class and a board given here, saving nothing. The first piece of the evaluation harness (Phase D).
 *
 *   npm run assistant:ask -- --role=STUDENT --grade=8 [--language=en|hi|mr] [--board=CBSE|MSBSHSE|NIOS] "explain newton's third law"
 *   npm run assistant:ask -- --role=ADMIN "where do I record a pupil's departure"
 *   … --json   prints the outcome (verdict, mode, text, citations, tokens) as JSON
 *
 * Reads as the app role (DATABASE_URL); writes nothing.
 */
import { config } from "dotenv";
import { ROLES, type Role } from "../src/lib/constants";
import { previewAnswer, realDeps } from "../src/lib/assistant/service";
import type { AssistantLanguage } from "@edulink/contracts";

config();

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`) || a === `--${name}`);
  if (!hit) return undefined;
  return hit.includes("=") ? hit.slice(hit.indexOf("=") + 1) : "true";
}

async function main() {
  const question = process.argv.slice(2).filter((a) => !a.startsWith("--")).join(" ").trim();
  if (!question) throw new Error('usage: npm run assistant:ask -- --role=STUDENT --grade=8 [--language=en|hi|mr] [--board=CBSE] "question"');
  const role = (arg("role") ?? "STUDENT").toUpperCase() as Role;
  if (!(ROLES as readonly string[]).includes(role)) throw new Error(`--role is one of ${ROLES.join(", ")}`);
  const language = arg("language") as AssistantLanguage | undefined;
  if (language && !["en", "hi", "mr"].includes(language)) throw new Error("--language is en, hi or mr");
  const started = Date.now();
  const out = await previewAnswer({ role, question, language, grade: arg("grade") ? Number(arg("grade")) : null, board: arg("board") ?? "CBSE", college: arg("college") === "true" }, realDeps());
  if (arg("json") === "true") {
    console.log(JSON.stringify({ question, role, ...out, seconds: (Date.now() - started) / 1000 }, null, 2));
    return;
  }
  console.log(`\nQ (${role}${arg("grade") ? `, class ${arg("grade")}` : ""}, ${out.language}): ${question}`);
  console.log(`Verdict: ${out.verdict}${out.mode ? ` (${out.mode})` : ""}${out.hint ? " — hint" : ""}  [${out.modelCalls} model calls, ${out.promptTokens}+${out.completionTokens} tokens, ${((Date.now() - started) / 1000).toFixed(1)} s]\n`);
  console.log(out.text);
  if (out.citations.length) {
    console.log("\nCitations:");
    for (const c of out.citations) {
      if (c.kind === "CURRICULUM") console.log(`  [${c.n}] ${c.board}, "${c.book}" (class ${c.grade}), ${c.chapter ?? "—"}${c.section ? ` › ${c.section}` : ""}, p. ${c.page}${c.sourceUrl ? ` — ${c.sourceUrl}` : ""}`);
      else console.log(`  [${c.n}] ${c.title}${c.pagePath ? ` — ${c.pagePath}` : ""}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
