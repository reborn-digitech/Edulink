import type { DutyCode, SchoolModuleCode } from "@edulink/contracts";

/**
 * THE PAGE EACH DUTY OPENS (5 Oct 2026), for the cards on a FACULTY's and an
 * HOD's home and the phone's duty card: the web path, the phone screen, and
 * the module the duty's doors sit under. `null` is a duty whose page is not
 * built yet — its card says so. ANTI_RAGGING_SQUAD is the model; the duties
 * builder (S2) fills the rest here, and adds each page's NAV entry with
 * `duty:` in nav.ts and its doors with `duties:` in the catalog.
 */
export const DUTY_PAGES: Record<DutyCode, { href: string; screen: string; module: SchoolModuleCode } | null> = {
  ANTI_RAGGING_SQUAD: { href: "/duties/anti-ragging", screen: "/(app)/anti-ragging", module: "IQAC" },
  LAB_INCHARGE: null,
  CLINICAL_COORDINATOR: null,
  PRACTICE_TEACHING_COORDINATOR: null,
  STUDIO_COORDINATOR: null,
  NSS_OFFICER: null,
  NCC_OFFICER: null,
  RESEARCH_DEAN: null,
  EXAM_SQUAD: null,
};
