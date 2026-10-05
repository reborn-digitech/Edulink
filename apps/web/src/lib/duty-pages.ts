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
  LAB_INCHARGE: { href: "/duties/lab", screen: "/(app)/lab-desk", module: "ACADEMICS" },
  // Its records are coming (the preset's notBuilt): the page says so in the preset's sentence.
  CLINICAL_COORDINATOR: { href: "/duties/clinical", screen: "", module: "ACADEMICS" },
  PRACTICE_TEACHING_COORDINATOR: { href: "/duties/teaching-practice", screen: "/(app)/teaching-practice", module: "ACADEMICS" },
  STUDIO_COORDINATOR: { href: "/duties/studio", screen: "", module: "ACADEMICS" },
  NSS_OFFICER: { href: "/duties/nss", screen: "/(app)/nss", module: "IQAC" },
  NCC_OFFICER: { href: "/duties/ncc", screen: "/(app)/ncc", module: "IQAC" },
  RESEARCH_DEAN: { href: "/duties/research", screen: "/(app)/research-desk", module: "IQAC" },
  EXAM_SQUAD: { href: "/duties/exam-squad", screen: "/(app)/exam-squad", module: "EXAMS" },
};
