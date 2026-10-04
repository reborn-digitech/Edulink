import { z } from "zod";
import { SCHOOL_MODULES, type SchoolModuleCode } from "./modules";
import type { Regulator } from "./academics";
import { COLLEGE_FILING_KINDS, type CollegeFilingKind } from "./iqac";
import { DUTIES, streamOffersDuty, type DutyCode } from "./duties";

/**
 * A COLLEGE'S STREAMS (the owner's decision of 5 October 2026). The operator
 * chooses them at onboarding beside affiliated or autonomous (the tenant's
 * kind), self-registration asks the same, and the registrar may change them
 * on the college profile. What the registrar's and the principal's homes
 * show, which modules a new college starts with, which regulator a new
 * programme answers to, which filings and which duties the college is
 * offered — all of it is read from the streams (STREAM_PRESETS below), the
 * union over every stream the college has.
 *
 * Stored on School.streamsJson as a JSON array of these codes; empty for a
 * school and a junior college. A coded list: what each says to a person is
 * `streams.<CODE>.name` / `.what`.
 *
 * Each stream's council, the body whose norms its records answer to:
 *   ARTS, SCIENCE, COMMERCE — the UGC (and the affiliating university);
 *   MANAGEMENT — AICTE for the MBA/PGDM, the UGC for the BBA/BMS;
 *   ENGINEERING — AICTE (and NBA for programme accreditation);
 *   PHARMACY — the Pharmacy Council of India (PCI), with AICTE's approval;
 *   LAW — the Bar Council of India (BCI);
 *   EDUCATION — the National Council for Teacher Education (NCTE);
 *   HEALTH_SCIENCES — the National Medical Commission (NMC), the Dental
 *     Council of India (DCI), the Indian Nursing Council (INC);
 *   ARCHITECTURE — the Council of Architecture (COA);
 *   AGRICULTURE — the Indian Council of Agricultural Research (ICAR);
 *   VOCATIONAL — the UGC's B.Voc framework (NSQF-aligned).
 */
export const STREAMS = [
  "ARTS",
  "SCIENCE",
  "COMMERCE",
  "MANAGEMENT",
  "ENGINEERING",
  "PHARMACY",
  "LAW",
  "EDUCATION",
  "HEALTH_SCIENCES",
  "ARCHITECTURE",
  "AGRICULTURE",
  "VOCATIONAL",
] as const;
export const streamSchema = z.enum(STREAMS);
export type StreamCode = z.infer<typeof streamSchema>;
/** A college's streams as a form or a door sends them: known codes, each once. */
export const streamListSchema = z
  .array(streamSchema)
  .max(STREAMS.length)
  .refine((list) => new Set(list).size === list.length, { message: "duplicate" });

/** A JSON array of stream codes, as School.streamsJson holds it: unknown words are dropped, the order is STREAMS'. */
export function parseStreams(raw: string | null | undefined): StreamCode[] {
  let list: unknown = [];
  try {
    list = JSON.parse(raw ?? "[]");
  } catch {
    list = [];
  }
  const set = new Set(Array.isArray(list) ? list : []);
  return STREAMS.filter((s) => set.has(s));
}

/**
 * THE TILES OF THE REGISTRAR'S AND THE PRINCIPAL'S HOME, as codes in the order
 * they are drawn. The web maps each to its page (src/lib/stream-tiles.ts); a
 * tile whose page is not built yet is drawn as "coming", so a builder who adds
 * the page gives it an href and nothing else changes.
 */
export const HOME_TILES = [
  "people",
  "academics",
  "exams",
  "admissions",
  "scholarships",
  "iqac",
  "library",
  "labs",
  "placement",
  "internships",
  "nba",
  "mootCourt",
  "teachingPractice",
  "clinicalPostings",
  "studios",
  "fieldWork",
] as const;
export type HomeTileCode = (typeof HOME_TILES)[number];

/**
 * THE WORDS THAT DIFFER BY STREAM (`tv()` in apps/web/src/lib/stream-words.ts):
 * an architecture college's lecture is a studio, a pharmacy college's lab a
 * practical, a law college's department a faculty. Each word and each variant
 * is a dictionary key (`streams.word.<variant>` and `.<variant>s`); no
 * existing key is renamed. A college of several streams keeps the general word
 * unless every one of its streams says otherwise.
 */
export const STREAM_WORDS = ["lecture", "lab", "department"] as const;
export type StreamWord = (typeof STREAM_WORDS)[number];
export const STREAM_WORD_VARIANTS = ["lecture", "studio", "lab", "practical", "department", "faculty"] as const;
export type StreamWordVariant = (typeof STREAM_WORD_VARIANTS)[number];

/**
 * WHAT A STREAM ASKS FOR THAT THE APP DOES NOT KEEP YET (5 Oct 2026): a
 * health-sciences college's clinical postings, logbooks and the attached
 * hospital; an architecture college's studios and juries; an agriculture
 * college's farm and field work. The registrar's home says so in a banner
 * (`streams.notBuilt.<CODE>`, one sentence each) rather than pretending.
 */
export const NOT_BUILT = ["CLINICAL_POSTINGS", "LOGBOOKS", "HOSPITAL", "STUDIOS", "JURIES", "FARM", "FIELD_WORK"] as const;
export type NotBuiltCode = (typeof NOT_BUILT)[number];

export type StreamPreset = {
  /** The modules a new college with this stream starts with (every module may still be switched by the college). */
  modulesOn: readonly SchoolModuleCode[];
  /** The programme regulators this stream uses, the default first. */
  regulators: readonly Regulator[];
  /** The college filings that apply (COLLEGE_FILING_KINDS); the filings builder extends the lists. */
  filings: readonly CollegeFilingKind[];
  /** The duties a college of this stream may give its teachers (from DUTY_STREAMS). */
  duties: readonly DutyCode[];
  /** The home's tiles after the base ones, in order. */
  homeTiles: readonly HomeTileCode[];
  /** The words this stream says differently. */
  vocabulary: Partial<Record<StreamWord, StreamWordVariant>>;
  /** The records this stream asks for that are not built yet. */
  notBuilt: readonly NotBuiltCode[];
};

/** What every college starts with, whatever its streams: alumni, academics, exams, admissions, scholarships and the IQAC. */
const BASE_MODULES: readonly SchoolModuleCode[] = ["ALUMNI", "ACADEMICS", "EXAMS", "ADMISSIONS", "SCHOLARSHIPS", "IQAC"];
/** …and a professional stream (a council other than the UGC) adds the placement cell. */
const PROFESSIONAL_MODULES: readonly SchoolModuleCode[] = [...BASE_MODULES, "PLACEMENT"];
/** The NAAC documents, NIRF and AISHE: every college files them. */
const BASE_FILINGS: readonly CollegeFilingKind[] = ["SSR", "AQAR", "IIQA", "NIRF", "AISHE"];
/** …and a college under AICTE its mandatory disclosure and the affiliation return. */
const AICTE_FILINGS: readonly CollegeFilingKind[] = [...BASE_FILINGS, "AICTE_DISCLOSURE", "AFFILIATION_RETURN"];
/** The tiles every college's home starts with, before its streams'. */
export const BASE_HOME_TILES: readonly HomeTileCode[] = ["people", "academics", "exams", "admissions", "scholarships", "iqac"];

const dutiesOf = (stream: StreamCode): DutyCode[] => DUTIES.filter((d) => streamOffersDuty(stream, d));

type PresetSpec = Omit<StreamPreset, "duties">;
const SPEC: Record<StreamCode, PresetSpec> = {
  ARTS: { modulesOn: BASE_MODULES, regulators: ["UGC"], filings: BASE_FILINGS, homeTiles: ["library"], vocabulary: {}, notBuilt: [] },
  SCIENCE: { modulesOn: BASE_MODULES, regulators: ["UGC"], filings: BASE_FILINGS, homeTiles: ["labs", "library"], vocabulary: {}, notBuilt: [] },
  COMMERCE: { modulesOn: BASE_MODULES, regulators: ["UGC"], filings: BASE_FILINGS, homeTiles: ["library"], vocabulary: {}, notBuilt: [] },
  MANAGEMENT: { modulesOn: PROFESSIONAL_MODULES, regulators: ["AICTE", "UGC"], filings: AICTE_FILINGS, homeTiles: ["placement", "internships"], vocabulary: {}, notBuilt: [] },
  ENGINEERING: { modulesOn: [...PROFESSIONAL_MODULES, "INVENTORY"], regulators: ["AICTE"], filings: AICTE_FILINGS, homeTiles: ["labs", "placement", "nba"], vocabulary: {}, notBuilt: [] },
  PHARMACY: { modulesOn: [...PROFESSIONAL_MODULES, "INVENTORY"], regulators: ["PCI", "AICTE"], filings: AICTE_FILINGS, homeTiles: ["labs", "placement"], vocabulary: { lab: "practical" }, notBuilt: [] },
  LAW: { modulesOn: PROFESSIONAL_MODULES, regulators: ["BCI", "UGC"], filings: BASE_FILINGS, homeTiles: ["mootCourt", "internships"], vocabulary: { department: "faculty" }, notBuilt: [] },
  EDUCATION: { modulesOn: PROFESSIONAL_MODULES, regulators: ["NCTE"], filings: BASE_FILINGS, homeTiles: ["teachingPractice"], vocabulary: {}, notBuilt: [] },
  HEALTH_SCIENCES: { modulesOn: PROFESSIONAL_MODULES, regulators: ["NMC", "DCI", "INC"], filings: BASE_FILINGS, homeTiles: ["clinicalPostings", "labs"], vocabulary: {}, notBuilt: ["CLINICAL_POSTINGS", "LOGBOOKS", "HOSPITAL"] },
  ARCHITECTURE: { modulesOn: PROFESSIONAL_MODULES, regulators: ["COA"], filings: BASE_FILINGS, homeTiles: ["studios"], vocabulary: { lecture: "studio" }, notBuilt: ["STUDIOS", "JURIES"] },
  AGRICULTURE: { modulesOn: PROFESSIONAL_MODULES, regulators: ["ICAR"], filings: BASE_FILINGS, homeTiles: ["fieldWork", "labs"], vocabulary: {}, notBuilt: ["FARM", "FIELD_WORK"] },
  VOCATIONAL: { modulesOn: BASE_MODULES, regulators: ["UGC"], filings: BASE_FILINGS, homeTiles: ["labs", "internships"], vocabulary: {}, notBuilt: [] },
};

/** THE PRESET PER STREAM, as built (the table in scratchpad/reports/streams-s0.md is this object). */
export const STREAM_PRESETS: Record<StreamCode, StreamPreset> = Object.fromEntries(
  STREAMS.map((s) => [s, { ...SPEC[s], duties: dutiesOf(s) }]),
) as unknown as Record<StreamCode, StreamPreset>;

/** The regulator a new programme of this stream defaults to: the first the stream names. */
export function defaultRegulatorFor(stream: StreamCode): Regulator {
  return STREAM_PRESETS[stream].regulators[0]!;
}

/** Whether a stream answers to a council other than the UGC: the professional ones, which start with the placement cell. */
export function isProfessionalStream(stream: StreamCode): boolean {
  return STREAM_PRESETS[stream].regulators[0] !== "UGC";
}

function unionInOrder<T>(order: readonly T[], lists: readonly (readonly T[])[]): T[] {
  const set = new Set<T>(lists.flat());
  return order.filter((x) => set.has(x));
}

/**
 * THE UNION OVER A COLLEGE'S STREAMS: the modules, regulators, filings and
 * duties any of them asks for; the home's tiles, the base ones then each
 * stream's in STREAMS order, each once; the words, only where every stream
 * agrees; the not-built records of any. An empty list (a school, or a college
 * not yet given its streams) is the base alone.
 */
export function presetUnion(streams: readonly StreamCode[]): StreamPreset {
  const known = STREAMS.filter((s) => streams.includes(s));
  const presets = known.map((s) => STREAM_PRESETS[s]);
  const regulatorOrder: Regulator[] = [];
  for (const p of presets) for (const r of p.regulators) if (!regulatorOrder.includes(r)) regulatorOrder.push(r);
  const tiles: HomeTileCode[] = [...BASE_HOME_TILES];
  for (const p of presets) for (const tile of p.homeTiles) if (!tiles.includes(tile)) tiles.push(tile);
  const vocabulary: Partial<Record<StreamWord, StreamWordVariant>> = {};
  if (presets.length > 0) {
    for (const word of STREAM_WORDS) {
      const variant = presets[0]!.vocabulary[word];
      if (variant && presets.every((p) => p.vocabulary[word] === variant)) vocabulary[word] = variant;
    }
  }
  return {
    modulesOn: presets.length ? unionInOrder<SchoolModuleCode>(SCHOOL_MODULES, presets.map((p) => p.modulesOn)) : unionInOrder<SchoolModuleCode>(SCHOOL_MODULES, [BASE_MODULES]),
    regulators: regulatorOrder,
    filings: unionInOrder<CollegeFilingKind>(COLLEGE_FILING_KINDS, presets.length ? presets.map((p) => p.filings) : [BASE_FILINGS]),
    duties: unionInOrder(DUTIES, presets.map((p) => p.duties)),
    homeTiles: tiles,
    vocabulary,
    notBuilt: unionInOrder(NOT_BUILT, presets.map((p) => p.notBuilt)),
  };
}
