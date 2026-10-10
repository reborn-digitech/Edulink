/**
 * The quiz bank's figure builder (docs/plans/assistant-and-quiz-bank.md Phase 1, the owner's decision of
 * 10 October 2026): a figure spec (packages/contracts quiz-figure.ts) in, an SVG string out, then a PNG.
 *
 * PURE AND DETERMINISTIC. No DOM, no clock, no randomness, no network; numbers written to two decimals,
 * words drawn as outlines from the bundled Mukta faces. The same spec and language give the same bytes
 * on every machine, which is what the golden tests in tests/quiz-figures.test.ts compare.
 *
 * The SVG is never stored or served: the uploads store refuses SVG on purpose (an executable document,
 * src/lib/storage.ts), so the importer stores the PNG made from it by sharp (librsvg inside, already a
 * dependency), and the SVG is for the preview CLI and the tests.
 */
import sharp from "sharp";
import { quizFigureSpecSchema, missingFigureLabels, type QuizFigure, type QuizFigureLanguage } from "@edulink/contracts";
import { drawBar, drawPie } from "./charts";
import { drawCircuit } from "./circuit";
import { drawDiagram } from "./diagram";
import { drawGeometry } from "./geometry";
import { drawGraph } from "./graph";
import { FigureLabelError, labelReader } from "./labels";
import { drawNumberline } from "./numberline";
import type { Svg } from "./svg";

export { FigureLabelError } from "./labels";
export { WIDTH as FIGURE_WIDTH, HEIGHT as FIGURE_HEIGHT } from "./svg";

/**
 * Bumped whenever a change here alters what a spec draws. The importer stores it with the spec and
 * re-renders an item whose stored version differs, so a fix to the renderer reaches the served PNGs.
 */
export const FIGURE_RENDER_VERSION = 2; // 2: a diagram's labels kept off every part and every other label (11 Oct 2026)

/** The PNG is drawn at twice the viewBox (1280 × 800) so it stays sharp on a phone's dense screen. */
export const FIGURE_PNG_DENSITY = 144;

/** Parses with the contract; throws the zod error's first message, with its path, on a bad spec. */
export function parseFigure(input: unknown): QuizFigure {
  const parsed = quizFigureSpecSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0]!;
    throw new Error(`figure spec refused: ${issue.path.join(".") || "(root)"}: ${issue.message}`);
  }
  return parsed.data;
}

/** The figure drawn in one language, as an SVG document. Throws on a spec the contract refuses or a label with no text in that language. */
export function renderFigureSvg(input: unknown, language: QuizFigureLanguage): string {
  const figure = parseFigure(input);
  const missing = missingFigureLabels(figure, language);
  if (missing.length) throw new FigureLabelError(`no ${language} text for label${missing.length === 1 ? "" : "s"} ${missing.join(", ")}`);
  const labels = labelReader(figure, language);
  let svg: Svg;
  switch (figure.kind) {
    case "geometry":
      svg = drawGeometry(figure, labels);
      break;
    case "graph":
      svg = drawGraph(figure, labels);
      break;
    case "numberline":
      svg = drawNumberline(figure, labels);
      break;
    case "bar":
      svg = drawBar(figure, labels);
      break;
    case "pie":
      svg = drawPie(figure, labels);
      break;
    case "circuit":
      svg = drawCircuit(figure, labels);
      break;
    case "diagram":
      svg = drawDiagram(figure, labels);
      break;
  }
  return svg.toString();
}

/** The SVG rasterised to PNG (1280 × 800). */
export async function renderFigurePng(svg: string): Promise<Buffer> {
  return sharp(Buffer.from(svg), { density: FIGURE_PNG_DENSITY }).png({ compressionLevel: 9 }).toBuffer();
}
