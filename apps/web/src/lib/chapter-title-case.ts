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

/* qb-A (QB-17, the QA pass of 31 October 2026): names set in capitals ("CHANGING TRADITIONS", "THE THREE ORDERS",
 * "TOWARDS Modernisation", the corpus's "HUMAN SETTLEMENTS") are put in title case before they name a chapter. */

/** Abbreviations and numerals a chapter's name prints in capitals on purpose. Compared exactly. */
export const KNOWN_CAPITALS: ReadonlySet<string> = new Set([
  "NCERT", "CBSE", "UNESCO", "UNICEF", "UNDP", "UNO", "UN", "USA", "USSR", "UK", "EU", "NATO", "ASEAN", "SAARC", "OPEC", "BRICS", "WTO", "IMF", "WHO",
  "GATT", "NITI", "ISRO", "NASA", "SEBI", "RBI", "NABARD", "MSME", "GST", "GDP", "GNP", "NDP", "NNP", "AIDS", "HIV", "COVID", "LASER", "RADAR", "SONAR",
  "HTML", "HTTP", "JSON", "ASCII", "SQL", "CSV", "ICT", "IT", "AI", "NGO", "NGOs", "DNA", "RNA", "ATP", "SI", "II", "III", "IV", "VI", "VII", "VIII",
  "IX", "XI", "XII", "XIII", "XIV", "XV", "XVI",
]);
const SMALL_WORDS: ReadonlySet<string> = new Set(["a", "an", "and", "as", "at", "but", "by", "for", "from", "in", "into", "of", "on", "or", "the", "to", "with"]);

/**
 * qb-A (QB-17): a title with no word set in capitals. A run of words in capitals (letters only, separated by spaces
 * or marks) that holds a word of four letters or more outside KNOWN_CAPITALS is put in title case: the run's first
 * word, a word after a colon or a dash and every word but a small joining one capitalised, the rest lowered; known
 * abbreviations keep their capitals.
 * "THE THREE ORDERS" → "The Three Orders", "TOWARDS Modernisation" → "Towards Modernisation", "Chapter 3 — CHANGING
 * TRADITIONS" → "Chapter 3 — Changing Traditions"; "NCERT and the UN" and "DNA" are left. Pure and client-safe.
 */
export function fixShoutedTitle(text: string): string {
  const tokens = text.match(/\p{L}+|[^\p{L}]+/gu) ?? [];
  const isWord = (t: string) => /^\p{L}/u.test(t);
  const shouted = (t: string) => isWord(t) && t.length >= 2 && t === t.toUpperCase() && t !== t.toLowerCase();
  const out = [...tokens];
  let i = 0;
  while (i < tokens.length) {
    if (!shouted(tokens[i]!)) {
      i++;
      continue;
    }
    // The run: shouted words with only non-letters between them.
    let j = i;
    const words: number[] = [];
    while (j < tokens.length && (shouted(tokens[j]!) || (!isWord(tokens[j]!) && j + 1 < tokens.length && shouted(tokens[j + 1]!)))) {
      if (isWord(tokens[j]!)) words.push(j);
      j++;
    }
    const loud = words.some((k) => tokens[k]!.length >= 4 && !KNOWN_CAPITALS.has(tokens[k]!) && !KNOWN_MIXED_CASE.has(tokens[k]!));
    if (loud) {
      words.forEach((k, n) => {
        const w = tokens[k]!;
        if (KNOWN_CAPITALS.has(w) || KNOWN_MIXED_CASE.has(w)) return;
        const lower = w.toLowerCase();
        const afterMark = k > 0 && /[:—–]\s*$/u.test(tokens[k - 1]!);
        out[k] = n > 0 && !afterMark && SMALL_WORDS.has(lower) ? lower : lower.charAt(0).toUpperCase() + lower.slice(1);
      });
    }
    i = Math.max(j, i + 1);
  }
  return out.join("");
}
