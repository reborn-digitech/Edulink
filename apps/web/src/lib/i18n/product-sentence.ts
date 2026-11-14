import { DICTIONARIES } from "./dictionary";

/**
 * WHETHER A STRING IS ONE OF THE PRODUCT'S OWN SENTENCES (TA-427, after TA-309's IqacFlash): a page that hands the
 * address's ?ok= or ?error= to a notice prints it only when it is a sentence of the three dictionaries, which is
 * what the module forms that still redirect put there; anything else in the address, which anybody can write into
 * a link on the platform's own origin, is dropped rather than shown as the app's own alert.
 */
let SENTENCES: Set<string> | null = null;

export function isProductSentence(text: string): boolean {
  if (!SENTENCES) {
    const out = new Set<string>();
    const walk = (v: unknown) => {
      if (typeof v === "string") out.add(v);
      else if (v && typeof v === "object") for (const x of Object.values(v)) walk(x);
    };
    walk(DICTIONARIES);
    SENTENCES = out;
  }
  return SENTENCES.has(text);
}
