import { INSTITUTION_KINDS, isCollegeKind, type InstitutionKind } from "@edulink/contracts";
import type { Translate } from "./i18n/dictionary";

export { INSTITUTION_KINDS, isCollegeKind, type InstitutionKind };

/**
 * THE WORD FOR THE TENANT (4 October 2026). A tenant is a school, a junior
 * college, a college or an autonomous college (School.kind), and a sentence
 * that names it should say which. Client-safe: no data layer here, so a page,
 * a component and an email can all call it with the kind they already read
 * (`institutionKindOf` in modules.ts on the server, /api/v1/me's
 * `institutionKind` on the phone).
 *
 * THE REST OF THE DICTIONARY STILL SAYS "SCHOOL", and the owner accepts that
 * for the college batch: renaming every sentence is a later sweep. What says
 * "college" by kind now is the college roles' homes, the modules page and the
 * operator's tenant list — and any new college screen, which should call this.
 */
function asKind(kind: string | null | undefined): InstitutionKind {
  return (INSTITUTION_KINDS as readonly string[]).includes(kind ?? "") ? (kind as InstitutionKind) : "SCHOOL";
}

/** The plain noun for a sentence: "school", "junior college", "college" (an autonomous college is a college). */
export function institutionNoun(kind: string | null | undefined, t: Translate): string {
  return t(`institution.noun.${asKind(kind)}`);
}

/** The kind's name as a label: "School", "Junior college", "College", "Autonomous college". */
export function institutionKindLabel(kind: string | null | undefined, t: Translate): string {
  return t(`institution.kind.${asKind(kind)}`);
}
