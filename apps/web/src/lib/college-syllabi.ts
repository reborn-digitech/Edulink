import type { PrismaClient } from "@prisma/client";
import {
  collegeSyllabusBoardOf,
  STREAMS,
  type CollegeSyllabi,
  type CollegeSyllabusBoard,
  type CollegeSyllabusDocument,
  type CollegeTerm,
  type StreamCode,
} from "@edulink/contracts";

/**
 * THE COLLEGE SYLLABI AS THE GENERATOR SEES THEM (college-content, 12 October 2026).
 *
 * The corpus holds the university's and the councils' syllabus documents (ContentDocument source
 * "syllabi": SPPU's faculties, AICTE's model curricula, the Pharmacy Council's, MPKV's) as chunks with a
 * heading path. For the quiz generator's "College" scope a document is read as:
 *   - its STREAM, from the board, the faculty and section the site filed it under, and its title
 *     (`syllabusStreamOf`): an SPPU law syllabus is LAW, a B.Voc syllabus VOCATIONAL wherever SPPU filed it;
 *   - its PROGRAMME, from the title ("LL.M.", "B.Pharm"), else the site's own grouping;
 *   - its YEAR OR SEMESTER when the title says one (`collegeTermOf`);
 *   - its UNITS: the runs of chunks under one level-one heading, in order, numbered from 1, leaving out
 *     the administrative ones (the contents, the rules, the scheme of examination, the reading lists);
 *     a document with no heading is one unit.
 *
 * No server-only import: the generator's runner (scripts/quiz-gen/college.ts) reads it, and the desk's
 * card reads `collegeSyllabi` through src/lib/quiz-college.ts. tests/college-practice.test.ts holds the rules.
 */

type DocLike = { board: string; gradeOrProgramme: string; subject: string; title: string; path?: string };

const has = (re: RegExp, ...texts: string[]) => texts.some((t) => re.test(t));

/** The stream a syllabus document is for, or null for one that is for every stream (SPPU's common courses) or none we know. */
export function syllabusStreamOf(doc: DocLike): StreamCode | null {
  const board = collegeSyllabusBoardOf(doc.board);
  if (!board) return null;
  // The site's file names carry underscores and date stamps ("B. Voc_Syllabus Rubber Technology_17042025").
  const title = tidyTitle(doc.title);
  // The section the site filed it under ("II) Engineering (All Branches)"); the faculty is gradeOrProgramme.
  const section = doc.subject;
  if (board === "PCI") return "PHARMACY";
  if (board === "MPKV") return "AGRICULTURE";
  // The title first: SPPU files a B.Voc syllabus under "Physical Education" and a B.Ed under "Colleges".
  if (has(/\bLL\.?\s?[BM]\b|\bLL\.\s?B|\bLL\.\s?M|\blaws?\b|jurisprud/i, title) && !has(/engineering|technology/i, title)) return "LAW";
  if (has(/\bB\.?\s?Voc\b|\bVOC\b/i, title)) return "VOCATIONAL";
  if (has(/pharm/i, title, section)) return "PHARMACY";
  if (has(/B\.?\s?Voc/i, section)) return "VOCATIONAL";
  if (has(/\bB\.?\s?Ed\b|\bM\.?\s?Ed\b|\bITEP\b|B\.?\s?P\.?\s?Ed|teacher education|education syllabus|special education/i, title)) return "EDUCATION";
  if (has(/architecture/i, title, section)) return "ARCHITECTURE";
  if (board === "AICTE") {
    if (has(/\bMBA\b|\bBBA\b|\bPGDM\b|management|supply chain/i, title)) return "MANAGEMENT";
    return "ENGINEERING";
  }
  // SPPU: the section the site filed it under.
  if (has(/\blaw\b/i, section)) return "LAW";
  if (has(/commerce/i, section)) return "COMMERCE";
  if (has(/management/i, section)) return "MANAGEMENT";
  if (has(/engineering|technology/i, section)) return "ENGINEERING";
  if (has(/science/i, section) && has(/science & technology/i, doc.gradeOrProgramme)) return "SCIENCE";
  if (has(/humanities|inter-disciplinary/i, doc.gradeOrProgramme)) return "ARTS";
  // "faculty": the common courses every undergraduate takes (NSS, NCC, the ability-enhancement languages): no one stream's.
  return null;
}

/** The programme a title names, as the site writes it; else the site's own grouping. */
const PROGRAMMES: [RegExp, string][] = [
  [/\bBA\s*LL\.?\s?B|\bB\.A\.?\s*LL\.?\s?B/i, "BA LL.B."],
  [/\bBBA\s*LL\.?\s?B/i, "BBA LL.B."],
  [/\bLL\.?\s?M\b|\bLL\.\s?M/i, "LL.M."],
  [/\bLL\.?\s?B\b|\bLL\.\s?B/i, "LL.B."],
  [/\bM\.?\s?Pharm/i, "M.Pharm"],
  [/\bB\.?\s?Pharm/i, "B.Pharm"],
  [/\bD\.?\s?Pharm/i, "D.Pharm"],
  [/\bM\.?\s?Tech\b/i, "M.Tech"],
  [/\bB\.?\s?Tech\b/i, "B.Tech"],
  [/\bM\.?\s?B\.?\s?A\b/i, "MBA"],
  [/\bB\.?\s?B\.?\s?A\b/i, "BBA"],
  [/\bB\.?\s?C\.?\s?A\b/i, "BCA"],
  [/\bM\.?\s?C\.?\s?A\b/i, "MCA"],
  [/\bB\.?\s?Voc\b/i, "B.Voc"],
  [/\bM\.?\s?Ed\b/i, "M.Ed"],
  [/\bB\.?\s?Ed\b|\bITEP\b/i, "B.Ed"],
  [/\bM\.?\s?Com\b/i, "M.Com"],
  [/\bB\.?\s?Com\b/i, "B.Com"],
  [/\bM\.?\s?Sc\b/i, "M.Sc"],
  [/\bB\.?\s?Sc\b/i, "B.Sc"],
  [/\bB\.?\s?F\.?\s?A\b|\bB\.?\s?V\.?\s?A\b/i, "BFA"],
  [/\bMSW\b/i, "MSW"],
  [/\bBSW\b/i, "BSW"],
  [/\bM\.?\s?A\b/, "M.A."],
  [/\b[FST]\.?\s?Y\.?\s?B\.?\s?A\b|\bB\.?\s?A\b/, "B.A."],
  [/\bB\.?\s?E\b|engineering/i, "B.E."],
  [/\bdiploma\b/i, "Diploma"],
  [/\bminor\b/i, "Minor"],
  [/\bplanning\b/i, "Planning"],
];
export function programmeOf(doc: DocLike): string {
  const title = tidyTitle(doc.title);
  for (const [re, name] of PROGRAMMES) if (re.test(title)) return name;
  const own = doc.gradeOrProgramme.trim();
  return own && !/^faculty/i.test(own) ? own.replace(/^[IVX]+\)\s*/, "") : doc.subject.replace(/^[A-Z]?[IVX]*\)\s*/, "").trim() || "—";
}

const ROMAN: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10 };
const numberOf = (s: string) => (/^\d+$/.test(s) ? Number(s) : (ROMAN[s.toUpperCase()] ?? NaN));

/** The year or semester a title or heading names: a semester first ("Sem II", "Semester 3"), then a year ("F.Y.", "Second Year", "2nd Year"). */
export function collegeTermOf(text: string): CollegeTerm | null {
  const sem = /\bSem(?:ester)?\s*[-–.]?\s*([IVX]+|\d{1,2})\b/i.exec(text);
  if (sem) {
    const n = numberOf(sem[1]!);
    if (n >= 1 && n <= 10) return `S${n}` as CollegeTerm;
  }
  const short = /\b([FST])\.?\s?Y\.?\s?(?=B|M|\s)/.exec(text);
  if (short) return ({ F: "Y1", S: "Y2", T: "Y3" } as const)[short[1] as "F" | "S" | "T"];
  const word = /\b(First|Second|Third|Fourth|Fifth|1st|2nd|3rd|4th|5th)\s+Year\b/i.exec(text);
  if (word) {
    const w = word[1]!.toLowerCase();
    const n = w.startsWith("f") && w !== "fourth" && w !== "fifth" ? 1 : w.startsWith("s") || w === "2nd" ? 2 : w.startsWith("t") || w === "3rd" ? 3 : w === "fourth" || w === "4th" ? 4 : 5;
    return `Y${n}` as CollegeTerm;
  }
  return null;
}

/** A level-one heading that is the document's administration, not a unit of study. */
const ADMIN = /table of contents?|^contents$|\brules?\b|regulations?|scheme of (?:exam|evaluation|teaching)|examination|evaluation|assessment|equivalence|structure|credits?\b|reference|reading|bibliograph|preamble|general guidelines|course outcome|programme outcome|^index$|^annexure|rulebook|grading system|graduates will be able/i;
/**
 * A level-one "heading" that is the page's running header or the title page (the university's or the
 * council's name, the year the syllabus takes effect): its chunks belong to the unit before it, or, at the
 * head of the document, to the first unit after it.
 */
const RUNNING_HEAD = /savitribai\s*phule\s*pune\s*university|^university\b|pharmacy council of india|^faculty of|with effect from|\bw\.?\s?e\.?\s?f\b|academic year|^curriculum \d{4}|programme curriculum|^duration:?$|^\(?to be implemented|^program(?:me)? (?:name|detail)|^level \d/i;

export type UnitChunk = { ordinal: number; headingPath: string[] };
/**
 * One unit of a document. `name` is what the bank calls it; `heading` is the level-one heading as printed (tidied); a
 * unit whose heading is the document's furniture is `refusal`'s reason and is never drafted (qb-A, QB-01), but keeps
 * its number so the units after it keep theirs (a unit's number is in its topic's slug).
 */
export type SyllabusUnit<T extends UnitChunk = UnitChunk> = { number: number; name: string; heading: string; refusal: string | null; chunks: T[] };

/* qb-A (QB-01, the QA pass of 31 October 2026): a unit is named after what the programme teaches. Nine of the first
 * eighteen college units drafted were named after the document's own headings ("Notes:", "Syllabus", "Intake: 60
 * Duration: 4 Year", "MM Curriclum upadated structure 2024", "BA LL. B., BBA LL.B., and LL. B.", "Core Subjects") and
 * one served questions on the marks of a paper. These rules are the college twin of corpus-titles' titleFragment. */

/** A heading that labels a part of the document rather than naming a subject. */
const LABEL_HEADING =
  /^(?:(?:model|detailed|revised|updated|draft)\s+)?(?:syllabus|syllabi|notes?|intake|duration|structure|curriculum|curriclum|course structure|course contents?|contents|(?:core|elective|optional|compulsory|open)\s+(?:subjects?|courses?|papers?)|subjects?|courses?|papers?|introduction|overview|about the course|programme details?|program details?|teaching scheme|annexures?)$/i;
/** Words that make a name the document's own title rather than a unit's, when a year stands beside them. */
const DOCUMENT_WORDS = /syllab|curric|\bstructure\b|\bupdated?\b|upadated|\brevised\b|\bfinal\b|\bscheme\b|\bw\.?\s?e\.?\s?f\b|with effect/i;
/** The programme's facts, which a front page prints ("Intake: 60 Duration: 4 Year"). */
const PROGRAMME_FACTS = /\bintake\b|\bduration\b|\beligibility\b|\bseats?\s*[:\d]/i;

/** How many of the programmes PROGRAMMES knows a name mentions ("BA LL. B., BBA LL.B., and LL. B." names three). Pure. */
export function programmesNamed(text: string): number {
  const found = new Set<string>();
  for (const [re, name] of PROGRAMMES) if (name !== "B.E." && name !== "Diploma" && name !== "Minor" && name !== "Planning" && re.test(text)) found.add(name);
  return found.size;
}

/**
 * qb-A (QB-01): why a unit's name may not name a practice chapter, or null. Refused: no letters; a heading cut after a
 * mark ("Notes:"); a label of the document ("Syllabus", "Core Subjects", "Course Structure"); the programme's facts
 * ("Intake: 60 Duration: 4 Year"); the document's own title with its year ("MM Curriclum upadated structure 2024",
 * "BTechDataScience 2024 Final"); a list of programmes ("BA LL. B., BBA LL.B., and LL. B."); a sentence. Pure.
 */
export function unitNameRefusal(name: string): string | null {
  const t = name.replace(/\s+/g, " ").trim();
  if (!/\p{L}/u.test(t)) return "no name";
  if (/[:;,\-–—]$/.test(t)) return "a heading cut after a mark";
  if (LABEL_HEADING.test(t.replace(/[.]+$/, ""))) return "a label of the document, not a subject";
  if (PROGRAMME_FACTS.test(t)) return "the programme's facts (intake, duration, eligibility)";
  if (/^click here\b/i.test(t)) return "a link's words";
  if (/\b(?:19|20)\d\d\b/.test(t) && DOCUMENT_WORDS.test(t)) return "the document's own title (a syllabus, curriculum or structure and its year)";
  if (programmesNamed(t) >= 2) return "a list of programmes";
  if (t.split(" ").length > 14 || /[^.]\.$/.test(t)) return "a sentence";
  return null;
}

/** Words that dress a syllabus document's title and name no subject. */
const TITLE_FURNITURE =
  /\b(?:revised|updated?|upadated|final|draft|new|syllab(?:us|ii?)|curricul(?:um|a)|curriclum|patt(?:ern)?s?|nep[-\s]?(?:20\d\d)?|national education policy|from|onwards|w\.?\s?e\.?\s?f\.?|with effect from|a\.?\s?y\.?|academic year|ac\.?\s*year|ac|department|copy|with corrected codes|with credit ?points|(?:new )?codes?\s*\d*|as per|integrated|sppu|for (?:affil?i?ated|afiiated)(?: law)? colleges|(?:all )?sem(?:ester|ister|i)?s?\s*[-–]?\s*(?:[ivx]+|\d{1,2})?(?:\s*(?:,|and|&|to|-|–)\s*(?:sem(?:ester|i)?\s*)?(?:[ivx]+|\d{1,2}))*|part\s*[-–]?\s*(?:[ivx]+|\d)\b|(?:first|second|third|fourth|1st|2nd|3rd|4th)\s+year|\d\s*year|year|degree|program(?:me)?|[FSTB]E|ME|M\.?\s?Arch|B\.?\s?Arch|[IVX]{1,4}|r\d)\b/gi;
/** What makes a title a programme's administration, or a leftover no unit may be named by. */
const NOT_A_SUBJECT = /\bequival|\bclarification|\bcredit distribution|\brules?\b|\bregulations?\b|\bstructure\b|\bscheme\b|\bimplemented\b|\bsession\b|\bguidelines?\b|\bclick here\b/i;
const MONTHS = "jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?";
/** A word a subject's name is made of: a word of letters (one capital at most, in front), a joining word, "Dr." */
const SUBJECT_WORD = /^(?:\p{Lu}?\p{Ll}{2,}(?:['’]s)?|and|of|in|the|for|to|with|on|&|Dr\.|St\.)$/u;

/**
 * qb-A (QB-01): the subject a syllabus document's title names, its programme, year, semester, dates and "Syllabus …
 * Pattern NEP" taken away: "F.Y.B.A. Psychology Syllabus From 2024-25" → "Psychology", "MBA Digital Marketing -
 * Syllabus 2024 Pattern - NEP 2020" → "Digital Marketing", "SE Electrical Syllabus 2024 pattern 14th July" →
 * "Electrical". "" when what is left is not a subject's name in words ("SE IT", "B.Lib. and I.Sc", "4th yr B. Des") or
 * the document is the programme's administration (an equivalence, a credit structure, a scheme, rules). Pure.
 */
export function subjectOfTitle(title: string): string {
  const tidy = tidyTitle(title);
  if (NOT_A_SUBJECT.test(tidy)) return "";
  let t = ` ${tidy} `
    .replace(/\b\d{1,2}[ .]\d{1,2}[ .](?:19|20)\d\d\b/g, " ")
    .replace(new RegExp(`\\b\\d{1,2}(?:st|nd|rd|th)?\\s+(?:${MONTHS})\\b|\\b(?:${MONTHS})\\s+(?:19|20)\\d\\d\\b`, "gi"), " ")
    .replace(/\b(?:19|20)\d\d(?:\s*[-–]\s*(?:19|20)?\d\d)*\b/g, " ")
    .replace(/\b[FST]\.?\s?Y\.?\s?(?=B|M)/g, " ")
    .replace(/\b[FST]Y\s?(?:B|M)\.?\s?(?:A|Sc|Com)\b/gi, " ")
    .replace(/\b[FST]Y\b/g, " ");
  for (const [re, name] of PROGRAMMES) {
    if (["B.E.", "Diploma", "Minor", "Planning"].includes(name)) continue;
    t = t.replace(new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`), " ");
  }
  for (let i = 0; i < 3; i++) t = t.replace(TITLE_FURNITURE, " ");
  // Brackets: square ones go; a pair left empty goes; one left unpaired goes.
  t = t.replace(/[[\]]/g, " ");
  for (let i = 0; i < 3; i++) t = t.replace(/\(\s*(?:[-–.,/&:;]|and|&)?\s*\)/g, " ");
  if ((t.match(/\(/g) ?? []).length !== (t.match(/\)/g) ?? []).length) t = t.replace(/[()]/g, " ");
  t = t.replace(/(?:^|\s)[-–.,/&:;]+(?=\s|$)/g, " ").replace(/\s+/g, " ").trim();
  t = t.replace(/\s(?:and|&)\s*(?=\()/gi, " ").replace(/\(\s*(?:and|&)\s+/gi, "(");
  for (let i = 0; i < 3; i++) {
    t = t
      .replace(/^(?:[-–.,/&:;]+|(?:and|in|of|for|the|with|to)\b)\s*/i, "")
      .replace(/\s*(?:[-–.,/&:;]+|\b(?:and|in|of|for|the|with|to))$/i, "")
      .trim();
  }
  const bracketed = /^\(([^()]+)\)$/.exec(t);
  if (bracketed) t = bracketed[1]!.trim();
  if (!t || NOT_A_SUBJECT.test(t) || unitNameRefusal(t)) return "";
  // One word in capitals is an abbreviation ("CHNA", "AIANDML") unless it is long enough to be a word ("SOCIOLOGY").
  if (/^\p{Lu}{2,7}$/u.test(t)) return "";
  const named = tidyName(t);
  const words = named.replace(/[()]/g, " ").split(/\s+/).filter(Boolean);
  if (words.length > 8 || !words.every((w) => SUBJECT_WORD.test(w)) || !words.some((w) => /^\p{Lu}?\p{Ll}{3,}/u.test(w))) return "";
  return named.charAt(0).toUpperCase() + named.slice(1);
}

const wordsOf = (s: string) => s.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
/** Whether a heading is the document's title (all its words there, at most two more): the title page. Pure. */
export function isTitleHeading(heading: string, docTitle: string): boolean {
  const title = wordsOf(docTitle);
  const head = new Set(wordsOf(heading));
  return title.length > 0 && title.every((w) => head.has(w)) && head.size - new Set(title).size <= 2;
}

/**
 * A chunk that is a list of books and articles, not something to ask about: most of its lines are numbered
 * references, or (when the PDF ran the list into one paragraph) it opens a list ("References", "Suggested
 * readings", "Books") or holds four or more numbered "Author, Title" entries in a row.
 */
export function isReadingListChunk(text: string): boolean {
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 12);
  const refLine = (l: string) => /^\d{1,2}[.)]\s/.test(l) && (/\b(19|20)\d\d\b/.test(l) || /\bEd(?:n|ition|s)?\.|Publish|Press\b|Journal|Vol\.|Law of|Manual|Act\b/i.test(l));
  if (lines.length >= 4 && lines.filter(refLine).length / lines.length >= 0.5) return true;
  // Run-in lists: "3. Dr. S.N. Misra … 4. Batuk Lal - Law of Evidence … 6. M.V. Chitaley: …" — numbered entries that read as
  // an author (initials, "Dr.", a name then a dash or a colon) or a link; a numbered list of topics ("4. Trials by Courts of
  // Session") reads as none of these.
  const entries = text.split(/(?:^|\s)(?=\d{1,2}\.\s)/).filter((e) => /^\d{1,2}\.\s/.test(e));
  const authorish = entries.filter((e) => /^\d{1,2}\.\s+(?:Dr\.|Prof\.|(?:[A-Z]\.\s?){1,3}[A-Z][a-z]|[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\s*(?:[-–:,]\s|[“"])|https?:)/.test(e)).length;
  const opening = /^\s*(?:\d+\.\s*)?(?:references?|suggested readings?|recommended books?|books? recommended|bibliography|text ?books?|reference books?)\b/i.test(text);
  // A chunk that still carries a unit of study (a module, the objectives, the outcomes) is kept: the model is told not to ask about its reading list.
  if (/\b(?:MODULE|UNIT)\s*[-–:]?\s*[IVX\d]|course (?:aims|objectives)|learning outcomes/i.test(text)) return false;
  const cited = entries.filter((e) => /\b(?:19|20)\d\d\b|[“"]|\bPress\b|Publi(?:cation|shers?|shing)|https?:|\bEd(?:ition|n)?\.|\bvol\./i.test(e)).length;
  return (authorish >= 3 && (cited >= 1 || authorish >= 4)) || (opening && entries.length >= 3);
}

/**
 * A drafted question about the syllabus itself rather than its subject (college-content, 12 Oct 2026): which book,
 * module, paper code, credit or part of the course says something. The generator's form stage refuses it for a
 * college unit; the drafting prompt asks the model not to write one, and the 12 October live run showed it still did.
 */
export function aboutTheSyllabus(item: { stem: string; choices: string[] }): string | null {
  const stem = item.stem;
  if (/\b(?:which|what)\s+(?:book|text ?book|reference|module|unit|part of the (?:course|syllabus)|paper code|course code|credit)/i.test(stem)) return "asks which book, module or part of the course";
  if (/\b(?:mentioned|listed|prescribed|recommended)\s+(?:as|in)\b/i.test(stem) && /\b(?:book|source|reading|syllabus|course)\b/i.test(stem)) return "asks what the syllabus lists";
  if (item.choices.filter((c) => /^\s*(?:module|unit)\s*\d+/i.test(c)).length >= 2) return "its options are the syllabus's modules";
  if (/\b(?:aim|aims|objective|objectives|purpose|goal|goals)\s+of\s+(?:the|this)\s+(?:course|programme|program|syllabus|paper|module|curriculum)\b/i.test(stem)) return "asks what the course aims at";
  if (/\blearning outcomes?\b|\bcourse outcomes?\b|\b(?:as )?(?:discussed|covered|taught|studied|mentioned|listed) in (?:the|this) (?:course|syllabus|paper|module|unit)\b|\bof the course on\b/i.test(stem)) return "asks about the course, not its subject";
  return null;
}

/**
 * The units of one document, in order: the runs under one level-one heading, the administrative ones left
 * out. Numbered from the headings alone (no chunk text), so the desk's card and the runner always agree on
 * a unit's number; the runner then drops a unit's reading-list chunks (`studyChunks`).
 */
export function unitsOf<T extends UnitChunk>(chunks: T[], fallbackName: string): SyllabusUnit<T>[] {
  const ordered = [...chunks].sort((a, b) => a.ordinal - b.ordinal);
  const runs: { name: string; chunks: T[] }[] = [];
  for (const c of ordered) {
    const head = (c.headingPath[0] ?? "").replace(/\s+/g, " ").trim();
    const last = runs[runs.length - 1];
    if (!head) {
      if (last) last.chunks.push(c);
      else runs.push({ name: "", chunks: [c] });
    } else if (last && last.name === head) last.chunks.push(c);
    else runs.push({ name: head, chunks: [c] });
  }
  // A running head's chunks go to the unit before it (or after it, at the head); an administrative run is dropped.
  const kept: { name: string; chunks: T[] }[] = [];
  let pending: T[] = [];
  for (const r of runs) {
    const junk = !r.name || RUNNING_HEAD.test(r.name) || /^\$|[^\x20-\x7e\u0900-\u097f]{3}/.test(r.name);
    if (junk) {
      const last = kept[kept.length - 1];
      if (last) last.chunks.push(...r.chunks);
      else pending.push(...r.chunks);
      continue;
    }
    if (ADMIN.test(r.name)) continue;
    kept.push({ name: r.name, chunks: [...pending, ...r.chunks] });
    pending = [];
  }
  // A document with no unit of its own is one unit, named after the document (its administrative runs still out).
  if (!kept.length) {
    const body = runs.filter((r) => !r.name || !ADMIN.test(r.name)).flatMap((r) => r.chunks);
    if (body.length) kept.push({ name: fallbackName, chunks: body.sort((a, b) => a.ordinal - b.ordinal) });
  }
  return nameUnits(
    kept.map((r, i) => ({ number: i + 1, heading: tidyName(r.name), chunks: r.chunks })),
    fallbackName,
  );
}

/**
 * qb-A (QB-01): the units named, numbers unchanged. A unit headed by the document's own title while the document has
 * other units is its title page (the course's about, eligibility and marks): refused. A unit whose heading is a label
 * ("Syllabus") takes the document's title when that title names a subject and no other unit carries it (the Foundation
 * Course in Cyber Security is one "Syllabus"); otherwise it is refused with the reason. Pure.
 */
export function nameUnits<T extends UnitChunk>(units: { number: number; heading: string; chunks: T[] }[], docTitle: string): SyllabusUnit<T>[] {
  const title = docTitle.trim();
  // The name the document's title gives a unit: the title itself when it names a subject, else the subject it names.
  const fromTitle = subjectOfTitle(title);
  const named = units.map((u) => {
    const frontMatter = units.length > 1 && isTitleHeading(u.heading, title);
    const refusal = frontMatter ? "the document's title page (its front matter)" : unitNameRefusal(u.heading);
    return { ...u, name: u.heading, refusal };
  });
  // A document read as one unit is named by its title: by the subject the title names when the title itself is refused.
  if (named.length === 1 && named[0]!.heading === tidyName(title) && named[0]!.refusal && fromTitle) {
    named[0]!.name = fromTitle;
    named[0]!.refusal = null;
  }
  const labelled = named.filter((u) => u.refusal === "a label of the document, not a subject");
  const titleTaken = named.some((u) => !u.refusal && (isTitleHeading(u.name, title) || (!!fromTitle && isTitleHeading(u.name, fromTitle))));
  if (fromTitle && labelled.length === 1 && !titleTaken) {
    labelled[0]!.name = fromTitle;
    labelled[0]!.refusal = null;
  }
  return named.map((u) => ({ number: u.number, name: u.name, heading: u.heading, refusal: u.refusal, chunks: u.chunks }));
}

/** A unit's chunks worth asking about: its reading lists left out. */
export function studyChunks<T extends UnitChunk & { text: string }>(unit: SyllabusUnit<T>): T[] {
  return unit.chunks.filter((c) => !isReadingListChunk(c.text));
}

/** "(3) CONSTITUTIONAL AND ADMINISTRATIVE LAW" → "Constitutional and Administrative Law". */
export function tidyName(name: string): string {
  const bare = name.replace(/^\(?\d{1,2}\)?[.:)]?\s*/, "").replace(/\s+/g, " ").trim();
  if (bare !== bare.toUpperCase()) return bare.slice(0, 120);
  const small = new Set(["and", "of", "the", "in", "to", "for", "on", "a", "an", "with"]);
  return bare
    .toLowerCase()
    .split(" ")
    .map((w, i) => (i > 0 && small.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ")
    .slice(0, 120);
}

/** A document's title as a person reads it: the site's date stamps and underscores gone. */
export function tidyTitle(title: string): string {
  return title.replace(/_\d{6,8}(?:_\d+)*$/, "").replace(/_/g, " ").replace(/\s+/g, " ").trim().slice(0, 140);
}

type DocRow = DocLike & { id: string; path: string };

/** Every syllabus document with its stream, programme, term and units (the chunk text is read, so call it once per page). */
export async function readCollegeSyllabi(db: Pick<PrismaClient, "contentDocument" | "contentChunk">): Promise<{ doc: DocRow; stream: StreamCode; board: CollegeSyllabusBoard; programme: string; term: CollegeTerm | null; units: SyllabusUnit[] }[]> {
  const docs = await db.contentDocument.findMany({ where: { source: "syllabi" }, select: { id: true, path: true, board: true, gradeOrProgramme: true, subject: true, title: true }, orderBy: { path: "asc" } });
  const out = [];
  const classified = docs.map((d) => ({ doc: d, stream: syllabusStreamOf(d), board: collegeSyllabusBoardOf(d.board) })).filter((x): x is { doc: DocRow; stream: StreamCode; board: CollegeSyllabusBoard } => !!x.stream && !!x.board);
  const chunks = await db.contentChunk.findMany({ where: { documentId: { in: classified.map((x) => x.doc.id) } }, select: { documentId: true, ordinal: true, headingPath: true } });
  const byDoc = new Map<string, UnitChunk[]>();
  for (const c of chunks) {
    const list = byDoc.get(c.documentId) ?? [];
    list.push(c);
    byDoc.set(c.documentId, list);
  }
  for (const x of classified) {
    const units = unitsOf(byDoc.get(x.doc.id) ?? [], tidyTitle(x.doc.title));
    // qb-A (QB-01): a document whose every unit is refused offers nothing to draft.
    if (!units.some((u) => !u.refusal)) continue;
    out.push({ ...x, programme: programmeOf(x.doc), term: collegeTermOf(x.doc.title), units });
  }
  return out;
}

/** The desk card's catalogue: the streams with a syllabus, their programmes and documents with units; the streams with none. */
export async function collegeSyllabi(db: Pick<PrismaClient, "contentDocument" | "contentChunk">): Promise<CollegeSyllabi> {
  const rows = await readCollegeSyllabi(db);
  const streams = STREAMS.filter((s) => rows.some((r) => r.stream === s)).map((stream) => {
    const mine = rows.filter((r) => r.stream === stream);
    const programmes = [...new Set(mine.map((r) => r.programme))].sort((a, b) => a.localeCompare(b));
    return {
      stream,
      boards: [...new Set(mine.map((r) => r.board))],
      programmes: programmes.map((programme) => ({
        programme,
        documents: mine
          .filter((r) => r.programme === programme)
          .map(
            (r): CollegeSyllabusDocument => ({
              path: r.doc.path,
              title: tidyTitle(r.doc.title),
              board: r.board,
              programme,
              term: r.term,
              // qb-A (QB-01): a refused unit is not offered; the others keep their numbers.
              units: r.units.filter((u) => !u.refusal).map((u) => ({ number: u.number, name: u.name, chunks: u.chunks.length })),
            }),
          ),
      })),
    };
  });
  return { streams, without: STREAMS.filter((s) => !streams.some((x) => x.stream === s)) };
}
