/**
 * THE CASE RULE FOR A CHAPTER'S TITLE (the owner's ask of 20 October 2026). A drop capital the text layer read out of
 * place leaves a capital inside a word: "Lines and angLes" (NCERT class 6 Ganita Prakash, chapter 2). A word whose
 * letters after the first carry exactly one capital, and which is not set wholly in capitals, is lowered after its
 * first letter: "angLes" → "angles", "AngLes" → "Angles"; its first letter stays as printed. Known forms keep their
 * case ("pH", "kWh", "NumPy", "YouTube"), and so does every word of three letters or fewer, where a unit or an
 * abbreviation is likelier than an artefact ("mA", "MeV"). Two words run together, a lower-case word of three letters
 * or more and a capitalised one of five or more ("theirCharacteristics"), are parted rather than lowered ("their
 * Characteristics"). Words are runs of letters, so a hyphen or an apostrophe parts them ("Self-Reliance" is two words).
 *
 * Pure and client-safe: the bank desk applies it when it shows a chapter's name (src/lib/bank-desk.ts) and
 * scripts/corpus-titles.ts applies it to the corpus's titles and, with --topics, writes it into the bank's chapters.
 */

/** Forms printed with a capital inside the word on purpose. Compared exactly. */
export const KNOWN_MIXED_CASE: ReadonlySet<string> = new Set([
  "pH", "pOH", "pKa", "pKb", "kWh", "kHz", "MHz", "GHz", "MeV", "keV", "GeV", "mRNA", "tRNA", "rRNA", "cDNA", "mtDNA", "SI", "DNA", "RNA", "ATP",
  "NumPy", "PyPlot", "DataFrame", "DataFrames", "MySQL", "JavaScript", "PowerPoint", "YouTube", "WhatsApp", "LinkedIn", "GitHub", "iPhone", "iPad",
  "eBook", "eMail", "McDonald", "LibreOffice", "OpenOffice", "PageMaker", "CorelDraw", "PhD", "BSc", "MSc", "BEd", "MEd", "LLB", "LLM", "UNESCO",
]);

const RUN_TOGETHER = /^(\p{Ll}{3,})(\p{Lu}\p{Ll}{4,})$/u;

/** One word (a run of letters) under the rule. */
export function fixWordCase(word: string): string {
  if (KNOWN_MIXED_CASE.has(word) || word.length <= 3) return word;
  const rest = word.slice(1);
  const inner = rest.match(/\p{Lu}/gu)?.length ?? 0;
  if (inner !== 1 || word === word.toUpperCase()) return word;
  const parted = RUN_TOGETHER.exec(word);
  if (parted) return `${parted[1]} ${parted[2]}`;
  return word.charAt(0) + rest.toLowerCase();
}

/** A title under the rule, word by word; everything that is not a letter stays where it was. */
export function fixTitleCase(text: string): string {
  return text.replace(/\p{L}+/gu, (word) => fixWordCase(word));
}
