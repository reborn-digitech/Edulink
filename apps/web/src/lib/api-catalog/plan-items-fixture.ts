/**
 * The fixed ids of the plan items package 5A built (R-2 / A3-inventory-10, the risks batch of 5 October
 * 2026; scripts/zz-plan-items.ts writes the rows with them), at ZZ Vidya College. Only ZZ data.
 *
 *   visit(1..3)      the reading-room register today: zz.cstudent01 in and out, zz.faculty01 in and out,
 *                    zz.cstudent02 still inside (signed in by zz.cadmin, the registrar's desk)
 *   council          "ZZ Student Council", a STUDENT_COUNCIL committee: zz.cstudent01 (president) and zz.cstudent02
 *   councilNotice(1) the council's notice to the college, published by the registrar on its behalf
 *   councilNotice(2) zz.cstudent01's notice for the council, waiting for the registrar's review
 *   appointmentTemplate(1|2|3)  the appointment letter in English, Hindi and Marathi (prefix AL)
 *   appointmentLetter(1)        zz.faculty02's letter, issued from the English template
 */
const pad = (prefix: string, n: number) => `c${prefix}${String(n).padStart(20 - prefix.length, "0")}`;

export const PLAN_ITEMS_FIXTURE = {
  visit: (n: number) => pad("zzrrvisit", n),
  council: pad("zzcouncil", 1),
  councilNotice: (n: number) => pad("zzcnotice", n),
  appointmentTemplate: (n: number) => pad("zzaltmpl", n),
  appointmentLetter: (n: number) => pad("zzalletter", n),
} as const;
