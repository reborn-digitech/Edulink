/**
 * Where a school is, spelled the one way the directory can group on.
 *
 * WHY THIS EXISTS. The directory filters by country and then by state, and it
 * builds both dropdowns from whatever the schools typed. Three schools typed
 * their STATE into the country box — "Maharashtra", "Karnataka", "Himachal
 * Pradesh" — because the sign-up wizard offered a country box and nothing for
 * the state, and the settings form put the two boxes far apart. The India
 * filter then listed one school out of four, and the country menu offered
 * three Indian states as countries. Nothing was wrong with any single row;
 * the product had simply let a location be entered in two shapes and then
 * grouped on the exact string.
 *
 * TWO LINES OF DEFENCE, because a form can be bypassed and a list can be
 * misread:
 *   - the forms (`LocationFields`) default the country to India and offer
 *     the state as a dropdown beside it, so the mistake has no box to land in;
 *   - every write path calls `normaliseLocation`, which moves a state out of
 *     the country box, spells India one way, and canonicalises a state's
 *     casing — so "gujarat" and "Gujarat" are one filter bucket, and a row
 *     saved by a script or an old draft comes out the same as one saved by
 *     the form.
 *
 * India is the product's home (Hindi and Marathi, Asia/Kolkata, DLT SMS), so
 * its states get the full treatment. Any other country stays free text: a
 * school in Nepal or Dubai types what it calls its region and is grouped on
 * that, which is the honest amount of structure we have for it.
 */

export const INDIA = "India";

/** The 28 states and 8 union territories, in the spelling the directory shows. */
export const INDIAN_STATES: readonly string[] = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

/** Older or looser spellings people genuinely type, mapped to the row above. */
const STATE_ALIASES: Record<string, string> = {
  orissa: "Odisha",
  pondicherry: "Puducherry",
  "new delhi": "Delhi",
  "nct of delhi": "Delhi",
  "delhi ncr": "Delhi",
  uttaranchal: "Uttarakhand",
  chattisgarh: "Chhattisgarh",
  "tamilnadu": "Tamil Nadu",
  "andaman & nicobar islands": "Andaman and Nicobar Islands",
  "andaman and nicobar": "Andaman and Nicobar Islands",
  "jammu & kashmir": "Jammu and Kashmir",
  "j&k": "Jammu and Kashmir",
  "dadra and nagar haveli": "Dadra and Nagar Haveli and Daman and Diu",
  "daman and diu": "Dadra and Nagar Haveli and Daman and Diu",
};

const INDIA_NAMES = new Set(["india", "in", "ind", "bharat", "bharath", "hindustan", "भारत"]);

function fold(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function clean(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim().replace(/\s+/g, " ");
  return trimmed === "" ? null : trimmed;
}

/** "India" in any of the ways a form receives it. */
export function isIndia(country: string | null | undefined): boolean {
  const folded = clean(country);
  return folded !== null && INDIA_NAMES.has(fold(folded));
}

/**
 * The canonical state for whatever was typed, or null when it is not one.
 * Case-insensitive, whitespace-tolerant, and aware of the spellings above.
 */
export function matchIndianState(value: string | null | undefined): string | null {
  const cleaned = clean(value);
  if (!cleaned) return null;
  const folded = fold(cleaned);
  const exact = INDIAN_STATES.find((s) => fold(s) === folded);
  if (exact) return exact;
  return STATE_ALIASES[folded] ?? null;
}

export type Location = { country: string | null; region: string | null };

/**
 * The one shape every write path saves.
 *
 *   { country: "Maharashtra", region: "" }   -> { country: "India", region: "Maharashtra" }
 *   { country: "",  region: "gujarat" }      -> { country: "India", region: "Gujarat" }
 *   { country: "india", region: "Orissa" }   -> { country: "India", region: "Odisha" }
 *   { country: "Nepal", region: "Bagmati" }  -> unchanged
 *
 * When the country box holds a state AND the region box holds a different
 * recognised state, the region box wins: it is the one labelled for it.
 */
export function normaliseLocation(input: {
  country?: string | null;
  region?: string | null;
}): Location {
  const country = clean(input.country);
  const region = clean(input.region);
  const countryAsState = matchIndianState(country);
  const regionAsState = matchIndianState(region);

  const india = isIndia(country) || countryAsState !== null || (country === null && regionAsState !== null);
  if (!india) return { country, region };

  return { country: INDIA, region: regionAsState ?? countryAsState ?? region };
}
