import { z } from "zod";

/**
 * school-offer-parts: the pieces of the school's subscription and premium terms that more than one contract uses (the
 * offer's and the terms' bodies in school-offer.ts, and the onboarding body in operator-dashboard.ts). A leaf: it
 * imports nothing of the contracts, so operator-dashboard.ts may import it without a cycle (school-offer.ts imports
 * operator-dashboard.ts). Re-exported by school-offer.ts; see there for the terms as a whole.
 */

/** The free months a new school may be given, covering both parts. */
export const FREE_MONTHS = [0, 1, 3, 6, 12] as const;
export type FreeMonths = (typeof FREE_MONTHS)[number];

/** A price is ₹1 to ₹10,000 a student a year, in whole rupees; a discount 0 to 100 %, in basis points. */
export const PRICE_MIN_PAISE = 100;
export const PRICE_MAX_PAISE = 1_000_000;
export const DISCOUNT_MAX_BPS = 10_000;

/** A price a student a year: whole rupees from ₹1 to ₹10,000, in paise. parseRupees takes two decimals, so the whole rupee is refused here. */
export const wholeRupeesPaise = z
  .number()
  .int()
  .min(PRICE_MIN_PAISE)
  .max(PRICE_MAX_PAISE)
  .refine((paise) => paise % 100 === 0, "root.priceWholeRupees");
/** A discount, 0 to 100 % in basis points. */
export const discountBpsSchema = z.number().int().min(0).max(DISCOUNT_MAX_BPS);
/** The free months, from the list. */
export const freeMonthsSchema = z
  .number()
  .int()
  .refine((months) => (FREE_MONTHS as readonly number[]).includes(months), "root.freeMonthsFromList");

/** A school's own terms for one part, one chip at a time: ours, an own discount on ours, or an own price. */
export const partTermsSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("OURS") }).strict(),
  z.object({ mode: z.literal("OWN_DISCOUNT"), discountBps: discountBpsSchema }).strict(),
  z.object({ mode: z.literal("OWN_PRICE"), pricePaise: wholeRupeesPaise }).strict(),
]);
export type PartTermsBody = z.infer<typeof partTermsSchema>;
