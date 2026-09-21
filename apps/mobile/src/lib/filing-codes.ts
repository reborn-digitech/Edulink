/**
 * The UDISE+ student module's 21 impairment types, by their portal code —
 * the portal's own English list (the web's lib/filings.ts carries the same
 * table), shown as "code — name" so the office can match the portal's form.
 */
export const CWSN_TYPE_NAMES: Record<string, string> = {
  "1": "Blindness",
  "2": "Low vision",
  "3": "Hearing impairment",
  "4": "Speech and language",
  "5": "Locomotor disability",
  "6": "Mental illness",
  "7": "Specific learning disabilities",
  "8": "Cerebral palsy",
  "9": "Autism spectrum disorder",
  "10": "Multiple disability including deaf-blindness",
  "11": "Leprosy cured",
  "12": "Dwarfism",
  "13": "Intellectual disability",
  "14": "Muscular dystrophy",
  "15": "Chronic neurological conditions",
  "16": "Multiple sclerosis",
  "17": "Thalassemia",
  "18": "Haemophilia",
  "19": "Sickle cell disease",
  "20": "Acid attack victim",
  "21": "Parkinson's disease",
};

/** "9 — Autism spectrum disorder"; a code the list does not know is shown as itself. */
export function cwsnLabel(code: string): string {
  const name = CWSN_TYPE_NAMES[code];
  return name ? `${code} — ${name}` : code;
}
