/**
 * Latin letters to Devanagari, as they are typed: "namaste" becomes नमस्ते,
 * "shaalaa" शाळा under the Marathi rules, "kRShNa" कृष्ण. The scheme is the
 * phonetic one people already type Hindi and Marathi in on a phone, close
 * to ITRANS, forgiving of case where it can be: a capital changes a letter
 * only where two letters share a sound (t/T, d/D, n/N, s/S, l/L for the
 * Marathi ळ, R for ऋ, M for the anusvara). IT IS STRICT: a long vowel is
 * typed twice ("raam" is राम and "ram" is रम) and a vowel between two
 * consonants is typed ("kulakarNI"), because the converter has no
 * dictionary and guesses nothing; what is typed is what is written.
 *
 * RUNS IN THE BROWSER, AND NOWHERE ELSE. Every keystroke of a pupil's name
 * stays on the device; nothing is sent to anybody to be converted. That is
 * why the scheme is a table here and not a call to a service with a better
 * one.
 *
 * THE WORD IS CONVERTED WHEN IT ENDS. A word is what lies between spaces
 * or punctuation; the letters typed so far are shown as they will become,
 * and become it when the space is typed. A word that is already Devanagari,
 * or a number, is left alone, so a name can be typed in either script in
 * the same sentence.
 */
export type TypingLanguage = "en" | "hi" | "mr";

const VOWELS: Record<string, [string, string]> = {
  // independent form, then the mark it makes on a consonant
  a: ["अ", ""],
  aa: ["आ", "ा"],
  A: ["आ", "ा"],
  i: ["इ", "ि"],
  ii: ["ई", "ी"],
  I: ["ई", "ी"],
  ee: ["ई", "ी"],
  u: ["उ", "ु"],
  uu: ["ऊ", "ू"],
  U: ["ऊ", "ू"],
  oo: ["ऊ", "ू"],
  R: ["ऋ", "ृ"],
  Ru: ["ऋ", "ृ"],
  RRi: ["ऋ", "ृ"],
  e: ["ए", "े"],
  ai: ["ऐ", "ै"],
  o: ["ओ", "ो"],
  au: ["औ", "ौ"],
  ou: ["औ", "ौ"],
  E: ["ऍ", "ॅ"],
  O: ["ऑ", "ॉ"],
};

const CONSONANTS: Record<string, string> = {
  k: "क", kh: "ख", g: "ग", gh: "घ", "~N": "ङ",
  c: "च", ch: "च", Ch: "छ", chh: "छ", j: "ज", jh: "झ", "~n": "ञ",
  T: "ट", Th: "ठ", D: "ड", Dh: "ढ", N: "ण",
  t: "त", th: "थ", d: "द", dh: "ध", n: "न",
  p: "प", ph: "फ", f: "फ", b: "ब", bh: "भ", m: "म",
  y: "य", r: "र", l: "ल", L: "ळ", v: "व", w: "व",
  sh: "श", Sh: "ष", S: "ष", s: "स", h: "ह",
  x: "क्ष", ksh: "क्ष", GY: "ज्ञ", dny: "ज्ञ", jn: "ज्ञ", "j~n": "ज्ञ",
  q: "क़", z: "ज़", "D.": "ड़", "Dh.": "ढ़",
};
const VIRAMA = "्";
const ANUSVARA = "ं";
const CHANDRABINDU = "ँ";
const VISARGA = "ः";
const AVAGRAHA = "ऽ";

/** The longest key of a table that the text starts with at `at`, up to four letters long. */
function longest(table: Record<string, unknown>, text: string, at: number): string | null {
  for (let length = 4; length >= 1; length--) {
    const piece = text.slice(at, at + length);
    if (piece.length === length && piece in table) return piece;
  }
  return null;
}

const DEVANAGARI = /[ऀ-ॿ]/;
const LATIN_WORD = /^[A-Za-z~.]+$/;

/** One Latin word as Devanagari. A word that is not Latin letters comes back as it was. */
export function transliterateWord(word: string, language: TypingLanguage): string {
  if (language === "en" || !LATIN_WORD.test(word) || DEVANAGARI.test(word)) return word;
  let out = "";
  let at = 0;
  // Whether the last thing written was a consonant with no vowel yet: the next vowel is a mark on it.
  let openConsonant = false;
  while (at < word.length) {
    // The nasal before a consonant: "M" is always the anusvara; "n" before a stop of another class is too ("hindi").
    if (word[at] === "M") {
      out += (openConsonant ? "" : "") + ANUSVARA;
      openConsonant = false;
      at += 1;
      continue;
    }
    if (word.slice(at, at + 2) === ".n" || word.slice(at, at + 2) === "~M") {
      out += CHANDRABINDU;
      openConsonant = false;
      at += 2;
      continue;
    }
    if (word[at] === "H") {
      out += VISARGA;
      openConsonant = false;
      at += 1;
      continue;
    }
    if (word.slice(at, at + 2) === ".a") {
      out += AVAGRAHA;
      openConsonant = false;
      at += 2;
      continue;
    }
    const consonant = longest(CONSONANTS, word, at);
    const vowel = longest(VOWELS, word, at);
    // A consonant wins over a vowel of the same start ("Sh" over "S" is not a vowel; "R" alone is the vowel ऋ only after nothing or a consonant).
    if (consonant && !(consonant === "R" && vowel)) {
      if (openConsonant) out += VIRAMA;
      out += CONSONANTS[consonant]!;
      openConsonant = true;
      at += consonant.length;
      continue;
    }
    if (vowel) {
      // A lone "i" that ends the word is the long one, as the words are written: हिंदी, मराठी, not हिंदि.
      const [independent, mark] = VOWELS[vowel === "i" && at + 1 === word.length && openConsonant ? "ii" : vowel]!;
      out += openConsonant ? mark : independent;
      openConsonant = false;
      at += vowel.length;
      continue;
    }
    // A lone "n" that is not a consonant of the table? The table has it; anything else unknown is copied.
    out += word[at];
    openConsonant = false;
    at += 1;
  }
  // A word ending in a consonant keeps its inherent vowel, as the language writes it: "ram" is राम, not राम्.
  if (language === "mr" || language === "hi") {
    // "n" before a stop of the same class inside a word is the anusvara in modern writing: हिंदी, not हिन्दी.
    out = out.replace(/([क-ह])्([क-घच-झट-ढत-धप-भ])/g, (whole, first: string, second: string) => (first === "न" || first === "म" || first === "ङ" || first === "ञ" || first === "ण" ? ANUSVARA + second : whole));
  }
  return out;
}

/** Where the word at the caret begins and ends: the run of letters around it. */
export function wordAt(text: string, caret: number): { start: number; end: number } {
  let start = caret;
  while (start > 0 && /[A-Za-z~.]/.test(text[start - 1]!)) start -= 1;
  let end = caret;
  while (end < text.length && /[A-Za-z~.]/.test(text[end]!)) end += 1;
  return { start, end };
}
