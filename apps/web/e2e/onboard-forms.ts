import type { OperatorOnboardBody } from "@edulink/contracts";

/**
 * THE THREE ONBOARDING FORMS THE CHAIN IS HELD ON (the coordinating session's direction of 22 November 2026, C7): the browser
 * case (e2e/onboard-submit-body.spec.ts) presses each on /root/onboard and reads the body the click built, aborting it so
 * nothing is made; the vitest case (tests/premium-onboard.test.ts) saves the same bodies through onboardSchoolAction and reads
 * back what the summary said. One helper for both, so the form the browser fills and the body vitest saves are one thing.
 * The day is passed in: the browser's moves with the clock, vitest's is the school's own today.
 */
export type OnboardFormName = "school-opened" | "school-own-price-long" | "college-tier-discount";

export const ONBOARD_FORMS: { name: OnboardFormName; title: string }[] = [
  { name: "school-opened", title: "a school as the form opens, with Students ticked" },
  { name: "school-own-price-long", title: "a school at an own price of ₹150, its renewal typed more than a year on, with its tick" },
  { name: "college-tier-discount", title: "a college on the Affiliated tier with its own 10 % discount" },
];

/** A day key so many days on (the renewal typed in form (b)). */
export function daysOn(day: string, days: number): string {
  const [y, m, d] = day.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
/** A day key as the date field is typed: dd/mm/yyyy. */
export function typedDay(day: string): string {
  const [y, m, d] = day.split("-");
  return `${d}/${m}/${y}`;
}

/**
 * The body each form builds, as far as the terms go, for a day, our offer's free months and the names given: the browser
 * case compares the click's body with it field by field, and vitest saves it whole.
 */
export function onboardFormBody(form: OnboardFormName, input: { day: string; freeMonths: number; name: string; contactEmail: string; adminEmail: string }): OperatorOnboardBody {
  const common = { name: input.name, contactEmail: input.contactEmail, timezone: "Asia/Kolkata", adminEmail: input.adminEmail, trial: false, startsAt: input.day };
  switch (form) {
    case "school-opened":
      return { ...common, kind: "SCHOOL", freeMonths: input.freeMonths, subscription: { mode: "OURS" }, premium: { students: true, teachers: false, terms: { mode: "OURS" } }, planId: null };
    case "school-own-price-long":
      return { ...common, kind: "SCHOOL", dueAt: daysOn(input.day, 400), subscription: { mode: "OWN_PRICE", pricePaise: 15_000 }, premium: { students: false, teachers: false, terms: { mode: "OURS" } }, planId: null, acceptOverAYear: true };
    case "college-tier-discount":
      return { ...common, kind: "COLLEGE", streams: ["ARTS"], tier: "college-affiliated", freeMonths: input.freeMonths, subscription: { mode: "OWN_DISCOUNT", discountBps: 1_000 }, premium: { students: false, teachers: false, terms: { mode: "OURS" } } };
  }
}

/** The fields of a body the summary and the click must agree on (C7 point 2). */
export const TERMS_FIELDS = ["name", "kind", "timezone", "startsAt", "dueAt", "freeMonths", "subscription", "premium", "tier"] as const;
