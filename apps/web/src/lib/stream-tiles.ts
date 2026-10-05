import type { HomeTileCode, SchoolModuleCode } from "@edulink/contracts";
import type { TranslationKey } from "./i18n/dictionary";

/**
 * THE HOME'S TILES (5 Oct 2026): each HOME_TILES code as the registrar's and
 * the principal's homes draw it — its words, the page it opens for each of
 * the two, and the module the page needs. `href: null` is a page not built
 * yet, drawn as "coming"; a builder who adds the page fills the href here and
 * nothing else changes. The order on the page is the preset's
 * (STREAM_PRESETS[…].homeTiles, after BASE_HOME_TILES), never this object's.
 */
export type HomeTile = {
  labelKey: TranslationKey;
  /** The registrar's page, and the principal's where it differs; null while the page is not built. */
  href: string | null;
  principalHref?: string;
  module?: SchoolModuleCode;
};

export const HOME_TILE_META: Record<HomeTileCode, HomeTile> = {
  people: { labelKey: "streams.tile.people", href: "/admin/people", principalHref: "/principal/staff" },
  academics: { labelKey: "streams.tile.academics", href: "/admin/academics", module: "ACADEMICS" },
  exams: { labelKey: "streams.tile.exams", href: "/exam-cell", module: "EXAMS" },
  admissions: { labelKey: "streams.tile.admissions", href: "/admin/college-admissions", module: "ADMISSIONS" },
  scholarships: { labelKey: "streams.tile.scholarships", href: "/accounts/scholarships", module: "SCHOLARSHIPS" },
  iqac: { labelKey: "streams.tile.iqac", href: "/iqac", principalHref: "/principal/accreditation", module: "IQAC" },
  library: { labelKey: "streams.tile.library", href: "/library", module: "LIBRARY" },
  // The lab in-charge's desk, which the office and the head read (5 Oct 2026, the UX pass): the labs with their stock,
  // the batches, the practical record to sign and the breakages, under ACADEMICS — an engineering college with the
  // stores off read "Switched off" here while its batches and practicals were kept.
  labs: { labelKey: "streams.tile.labs", href: "/duties/lab", module: "ACADEMICS" },
  placement: { labelKey: "streams.tile.placement", href: "/placement", module: "PLACEMENT" },
  internships: { labelKey: "streams.tile.internships", href: "/placement/internships", module: "PLACEMENT" },
  // The NBA SAR (the filings builder, 5 Oct 2026): its figures and worksheet on the IQAC's documents.
  nba: { labelKey: "streams.tile.nba", href: "/iqac/documents/nba", module: "IQAC" },
  mootCourt: { labelKey: "streams.tile.mootCourt", href: "/admin/stream-records/moot-courts", module: "ACADEMICS" },
  teachingPractice: { labelKey: "streams.tile.teachingPractice", href: "/duties/teaching-practice", module: "ACADEMICS" },
  clinicalPostings: { labelKey: "streams.tile.clinicalPostings", href: null },
  studios: { labelKey: "streams.tile.studios", href: null },
  fieldWork: { labelKey: "streams.tile.fieldWork", href: null },
};

/** Where a tile leads for this role, or null while its page is not built. */
export function tileHref(tile: HomeTileCode, role: "ADMIN" | "PRINCIPAL"): string | null {
  const meta = HOME_TILE_META[tile];
  if (!meta.href) return null;
  return role === "PRINCIPAL" ? (meta.principalHref ?? meta.href) : meta.href;
}
