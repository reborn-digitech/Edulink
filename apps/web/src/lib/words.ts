/**
 * Numbers and dates in words, in English, Hindi and Marathi.
 *
 * An Indian certificate writes the date of birth twice: in figures and in
 * words, so that neither can be altered without the other giving it away.
 * Hindi and Marathi name every number to ninety-nine with its own word, so
 * the tables below are the words themselves rather than a rule.
 */
export type WordsLocale = "en" | "hi" | "mr";

const EN_ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const EN_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

const HI = [
  "शून्य", "एक", "दो", "तीन", "चार", "पाँच", "छह", "सात", "आठ", "नौ",
  "दस", "ग्यारह", "बारह", "तेरह", "चौदह", "पंद्रह", "सोलह", "सत्रह", "अठारह", "उन्नीस",
  "बीस", "इक्कीस", "बाईस", "तेईस", "चौबीस", "पच्चीस", "छब्बीस", "सत्ताईस", "अट्ठाईस", "उनतीस",
  "तीस", "इकतीस", "बत्तीस", "तैंतीस", "चौंतीस", "पैंतीस", "छत्तीस", "सैंतीस", "अड़तीस", "उनतालीस",
  "चालीस", "इकतालीस", "बयालीस", "तैंतालीस", "चौवालीस", "पैंतालीस", "छियालीस", "सैंतालीस", "अड़तालीस", "उनचास",
  "पचास", "इक्यावन", "बावन", "तिरपन", "चौवन", "पचपन", "छप्पन", "सत्तावन", "अट्ठावन", "उनसठ",
  "साठ", "इकसठ", "बासठ", "तिरसठ", "चौंसठ", "पैंसठ", "छियासठ", "सड़सठ", "अड़सठ", "उनहत्तर",
  "सत्तर", "इकहत्तर", "बहत्तर", "तिहत्तर", "चौहत्तर", "पचहत्तर", "छिहत्तर", "सतहत्तर", "अठहत्तर", "उनासी",
  "अस्सी", "इक्यासी", "बयासी", "तिरासी", "चौरासी", "पचासी", "छियासी", "सत्तासी", "अट्ठासी", "नवासी",
  "नब्बे", "इक्यानवे", "बानवे", "तिरानवे", "चौरानवे", "पचानवे", "छियानवे", "सत्तानवे", "अट्ठानवे", "निन्यानवे",
];

const MR = [
  "शून्य", "एक", "दोन", "तीन", "चार", "पाच", "सहा", "सात", "आठ", "नऊ",
  "दहा", "अकरा", "बारा", "तेरा", "चौदा", "पंधरा", "सोळा", "सतरा", "अठरा", "एकोणीस",
  "वीस", "एकवीस", "बावीस", "तेवीस", "चोवीस", "पंचवीस", "सव्वीस", "सत्तावीस", "अठ्ठावीस", "एकोणतीस",
  "तीस", "एकतीस", "बत्तीस", "तेहेतीस", "चौतीस", "पस्तीस", "छत्तीस", "सदतीस", "अडतीस", "एकोणचाळीस",
  "चाळीस", "एक्केचाळीस", "बेचाळीस", "त्रेचाळीस", "चव्वेचाळीस", "पंचेचाळीस", "सेहेचाळीस", "सत्तेचाळीस", "अठ्ठेचाळीस", "एकोणपन्नास",
  "पन्नास", "एक्कावन्न", "बावन्न", "त्रेपन्न", "चोपन्न", "पंचावन्न", "छप्पन्न", "सत्तावन्न", "अठ्ठावन्न", "एकोणसाठ",
  "साठ", "एकसष्ट", "बासष्ट", "त्रेसष्ट", "चौसष्ट", "पासष्ट", "सहासष्ट", "सदुसष्ट", "अडुसष्ट", "एकोणसत्तर",
  "सत्तर", "एक्काहत्तर", "बाहत्तर", "त्र्याहत्तर", "चौऱ्याहत्तर", "पंच्याहत्तर", "शहात्तर", "सत्याहत्तर", "अठ्ठ्याहत्तर", "एकोणऐंशी",
  "ऐंशी", "एक्क्याऐंशी", "ब्याऐंशी", "त्र्याऐंशी", "चौऱ्याऐंशी", "पंच्याऐंशी", "सहाऐंशी", "सत्त्याऐंशी", "अठ्ठ्याऐंशी", "एकोणनव्वद",
  "नव्वद", "एक्क्याण्णव", "ब्याण्णव", "त्र्याण्णव", "चौऱ्याण्णव", "पंच्याण्णव", "शहाण्णव", "सत्त्याण्णव", "अठ्ठ्याण्णव", "नव्व्याण्णव",
];

const HUNDRED = { en: "hundred", hi: "सौ", mr: "शे" } as const;
const THOUSAND = { en: "thousand", hi: "हज़ार", mr: "हजार" } as const;

function below100(n: number, locale: WordsLocale): string {
  if (locale === "hi") return HI[n]!;
  if (locale === "mr") return MR[n]!;
  if (n < 20) return EN_ONES[n]!;
  const tens = EN_TENS[Math.floor(n / 10)]!;
  return n % 10 === 0 ? tens : `${tens}-${EN_ONES[n % 10]}`;
}

function below1000(n: number, locale: WordsLocale): string {
  if (n < 100) return below100(n, locale);
  const h = Math.floor(n / 100);
  const rest = n % 100;
  // Marathi joins the hundreds: "नऊशे" (nine hundred), "एकशे" for one hundred.
  const hundreds = locale === "mr" ? `${MR[h]}${HUNDRED.mr}` : `${below100(h, locale)} ${HUNDRED[locale]}`;
  if (rest === 0) return hundreds;
  return locale === "en" ? `${hundreds} and ${below100(rest, locale)}` : `${hundreds} ${below100(rest, locale)}`;
}

/** 0 to 99,999 in words. Enough for a year, a day and an admission number. */
export function numberToWords(n: number, locale: WordsLocale = "en"): string {
  if (!Number.isInteger(n) || n < 0 || n > 99_999) return String(n);
  if (n < 1000) return below1000(n, locale);
  const th = Math.floor(n / 1000);
  const rest = n % 1000;
  const thousands = `${below100(th, locale)} ${THOUSAND[locale]}`;
  if (rest === 0) return thousands;
  const tail = below1000(rest, locale);
  return locale === "en" && rest < 100 ? `${thousands} and ${tail}` : `${thousands} ${tail}`;
}

/** Title case for an English certificate: "Two Thousand and Sixteen". */
function titleCase(s: string): string {
  return s.replace(/\b([a-z])/g, (m) => m.toUpperCase()).replace(/\bAnd\b/g, "and");
}

/**
 * "2016-03-10" → "Tenth March Two Thousand and Sixteen", "दस मार्च दो हज़ार
 * सोलह", "दहा मार्च दोन हजार सोळा". Ordinals in English; Hindi and Marathi
 * name the day plainly, as their certificates do.
 */
export function dateInWords(dateKey: string, locale: WordsLocale = "en"): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!m) return dateKey;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const monthName = new Intl.DateTimeFormat(locale === "en" ? "en-IN" : locale, { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2024, month - 1, 1)));
  if (locale === "en") return `${titleCase(ordinalEn(day))} ${monthName} ${titleCase(numberToWords(year, "en"))}`;
  return `${numberToWords(day, locale)} ${monthName} ${numberToWords(year, locale)}`;
}

const EN_ORDINAL_ONES = ["", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth", "thirteenth", "fourteenth", "fifteenth", "sixteenth", "seventeenth", "eighteenth", "nineteenth"];
const EN_ORDINAL_TENS = ["", "", "twentieth", "thirtieth"];

function ordinalEn(day: number): string {
  if (day < 20) return EN_ORDINAL_ONES[day] ?? String(day);
  const tens = Math.floor(day / 10);
  const ones = day % 10;
  if (ones === 0) return EN_ORDINAL_TENS[tens] ?? String(day);
  return `${EN_TENS[tens]}-${EN_ORDINAL_ONES[ones]}`;
}

/** "10/03/2016" for a certificate's figures, whatever the reader's locale. */
export function dateInFigures(dateKey: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : dateKey;
}
