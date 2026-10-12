import "server-only";
import type { Prisma } from "@prisma/client";
import { isCollegeKind, PREP_BOARD, type PracticeSection, type PracticeTenant } from "@edulink/contracts";
import { institutionKindOf } from "./modules";
import { streamsOf } from "./streams";

/**
 * WHICH PRACTICE CHAPTERS A TENANT LISTS (college-content, the owner's decisions of 12 October 2026).
 *
 *   a school (and a junior college) — the school bank only (audience SCHOOL), every board; the board
 *     switch on the page narrows it as before;
 *   a college — section STREAM: the COLLEGE chapters whose streams include one of the college's, or that
 *     name none (a college-wide bank, as the placement banks are); section PREP ("Competitive Exams
 *     Prep"): the school bank's NCERT chapters. Nothing else from the school bank reaches a college.
 *
 * The pure rule is `practiceSectionOf` in packages/contracts v1/college-practice.ts; this is the same
 * rule as a query, used by every practice read and by the doors that start a sitting, so a chapter a
 * tenant cannot list cannot be opened by its slug either. tests/college-practice.test.ts holds both.
 */

/** The tenant's kind and streams, read once per request (both readers are cached). */
export async function practiceTenantOf(schoolId: string | null | undefined): Promise<PracticeTenant> {
  const kind = await institutionKindOf(schoolId);
  if (!isCollegeKind(kind)) return { college: false, streams: [] };
  return { college: true, streams: await streamsOf(schoolId) };
}

/** A college's own streams' banks (and the college-wide ones). */
function streamWhere(tenant: PracticeTenant): Prisma.QuizTopicWhereInput {
  return { audience: "COLLEGE", OR: [{ streams: { isEmpty: true } }, ...(tenant.streams.length ? [{ streams: { hasSome: [...tenant.streams] } }] : [])] };
}

/** The prep section: the school bank's NCERT chapters. */
const PREP_WHERE: Prisma.QuizTopicWhereInput = { audience: "SCHOOL", board: PREP_BOARD };

/**
 * The chapters a tenant lists, as a where clause; with a section, that section's only (a section at a
 * school is ignored: a school has none).
 */
export function practiceTopicsWhere(tenant: PracticeTenant, section?: PracticeSection | null): Prisma.QuizTopicWhereInput {
  if (!tenant.college) return { audience: "SCHOOL" };
  if (section === "STREAM") return streamWhere(tenant);
  if (section === "PREP") return PREP_WHERE;
  return { OR: [streamWhere(tenant), PREP_WHERE] };
}

/** The same, read for a school by its id. */
export async function practiceTopicsWhereFor(schoolId: string | null | undefined, section?: PracticeSection | null): Promise<Prisma.QuizTopicWhereInput> {
  return practiceTopicsWhere(await practiceTenantOf(schoolId), section);
}
