/**
 * The UDISE+ student module's twenty-one impairment types, by their portal
 * code. Client-safe: the record form's picker shows them beside the code,
 * and src/lib/filings.ts writes the same words into the enrolment tables.
 * These are the portal's own English list (it takes the code, never the
 * word), so they are not translated.
 */
export const CWSN_TYPE_NAMES: Record<string, string> = {
  "1": "Blindness", "2": "Low vision", "3": "Hearing impairment", "4": "Speech and language", "5": "Locomotor disability", "6": "Mental illness", "7": "Specific learning disabilities", "8": "Cerebral palsy", "9": "Autism spectrum disorder", "10": "Multiple disability including deaf-blindness", "11": "Leprosy cured", "12": "Dwarfism", "13": "Intellectual disability", "14": "Muscular dystrophy", "15": "Chronic neurological conditions", "16": "Multiple sclerosis", "17": "Thalassemia", "18": "Haemophilia", "19": "Sickle cell disease", "20": "Acid attack victim", "21": "Parkinson's disease",
};
