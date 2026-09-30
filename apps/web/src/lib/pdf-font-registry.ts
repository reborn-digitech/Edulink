import "server-only";
import path from "node:path";
import { Font } from "@react-pdf/renderer";
import { FONTS, fontByKey, fontFile } from "./fonts";

/**
 * The bundled typefaces, registered for the PDFs from the same files the
 * pages load, once per process. Every face is registered, because a PDF's
 * fonts are named when its page is drawn and a face that is not registered
 * is a blank. The family a paper is set in: the chosen face, then Mukta
 * for whatever the face lacks (a Latin face has no Devanagari), then the
 * renderer's own Helvetica.
 */
let registered = false;
export function registerPdfFonts(): void {
  if (registered) return;
  registered = true;
  for (const face of FONTS) {
    if (face.key === "mukta") continue; // registered by each renderer from src/lib/pdf-fonts, as it always was
    Font.register({ family: face.family, fonts: face.weights.map((weight) => ({ src: path.join(process.cwd(), "public", fontFile(face, weight)), fontWeight: weight })) });
  }
}

export function pdfFamilyFor(key: string | null | undefined): string[] {
  registerPdfFonts();
  const face = fontByKey(key);
  return face && face.key !== "mukta" ? [face.family, "Mukta", "Helvetica"] : ["Mukta", "Helvetica"];
}
