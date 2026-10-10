/**
 * The figure builder's preview: a spec in, the SVG (and PNG) out, for a hand check.
 *
 *   npm run quiz:figure -- <spec.json> [--lang en|hi|mr|all] [--out <dir>] [--png]
 *   npm run quiz:figure -- --samples <dir> [--png]
 *
 * <spec.json> holds a figure ({ kind, spec, labels }) or an item carrying one under `figure`. The
 * files are written as <name>.<lang>.svg beside the spec unless --out says where. --samples draws one
 * figure per kind and each of the twenty diagram parts alone. Nothing is stored or imported.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { QUIZ_DIAGRAM_PART_NAMES, QUIZ_FIGURE_LANGUAGES, type QuizFigureLanguage } from "@edulink/contracts";
import { renderFigurePng, renderFigureSvg } from "./quiz-gen/figures/render";
import { KIND_SAMPLES, partSample } from "./quiz-gen/figures/samples";

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const png = args.includes("--png");

async function write(figure: unknown, name: string, dir: string, languages: readonly QuizFigureLanguage[]): Promise<void> {
  mkdirSync(dir, { recursive: true });
  for (const lang of languages) {
    const svg = renderFigureSvg(figure, lang);
    const file = join(dir, `${name}.${lang}.svg`);
    writeFileSync(file, svg);
    console.log(`  ${file}  ${svg.length.toLocaleString("en-IN")} bytes`);
    if (png) {
      const bytes = await renderFigurePng(svg);
      writeFileSync(join(dir, `${name}.${lang}.png`), bytes);
      console.log(`  ${join(dir, `${name}.${lang}.png`)}  ${bytes.length.toLocaleString("en-IN")} bytes`);
    }
  }
}

async function main() {
  const samples = flag("--samples");
  if (samples) {
    for (const [kind, figure] of Object.entries(KIND_SAMPLES)) await write(figure, `kind-${kind}`, samples, QUIZ_FIGURE_LANGUAGES);
    for (const part of QUIZ_DIAGRAM_PART_NAMES) await write(partSample(part), `part-${part}`, samples, QUIZ_FIGURE_LANGUAGES);
    return;
  }
  const file = args.find((a, i) => !a.startsWith("--") && !["--lang", "--out"].includes(args[i - 1] ?? ""));
  if (!file) {
    console.error("usage: npm run quiz:figure -- <spec.json> [--lang en|hi|mr|all] [--out <dir>] [--png]   or   -- --samples <dir> [--png]");
    process.exit(2);
  }
  const raw = JSON.parse(readFileSync(file, "utf8")) as { figure?: unknown };
  const figure = raw && typeof raw === "object" && "figure" in raw ? raw.figure : raw;
  const lang = flag("--lang") ?? "all";
  const languages = lang === "all" ? QUIZ_FIGURE_LANGUAGES : ([lang] as QuizFigureLanguage[]);
  if (!languages.every((l) => (QUIZ_FIGURE_LANGUAGES as readonly string[]).includes(l))) {
    console.error(`--lang is en, hi, mr or all, not ${lang}`);
    process.exit(2);
  }
  await write(figure, basename(file).replace(/\.json$/, ""), flag("--out") ?? dirname(file), languages);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
