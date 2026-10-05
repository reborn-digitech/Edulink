import type { ReactNode } from "react";
import type { DriveApplicationView, EligibilityFail, OfferView } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { getLocale, getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { TabBar } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ModuleOff } from "@/components/module-off";
import { Flash } from "@/components/library/parts";
import type { Translate, TranslationKey } from "@/lib/i18n/dictionary";

/**
 * The placement module's shared pieces (4 October 2026): the cell's frame
 * with its tabs, the words for every coded value, the package as lakh a
 * year, and the eligibility reasons as sentences. Every form posts to
 * app/(app)/placement/actions.ts with `back`.
 */

export { Flash };

export const DRIVE_STATUS_KEY: Record<string, TranslationKey> = { DRAFT: "placement.statusDRAFT", OPEN: "placement.statusOPEN", SHORTLISTING: "placement.statusSHORTLISTING", ROUNDS: "placement.statusROUNDS", OFFERS: "placement.statusOFFERS", CLOSED: "placement.statusCLOSED" };
export const DRIVE_KIND_KEY: Record<string, TranslationKey> = { ON_CAMPUS: "placement.kindON_CAMPUS", OFF_CAMPUS: "placement.kindOFF_CAMPUS", POOLED: "placement.kindPOOLED" };
export const APP_STATUS_KEY: Record<string, TranslationKey> = { APPLIED: "placement.appAPPLIED", SHORTLISTED: "placement.appSHORTLISTED", ROUND: "placement.appROUND", SELECTED: "placement.appSELECTED", REJECTED: "placement.appREJECTED", WITHDRAWN: "placement.appWITHDRAWN" };
export const OUTCOME_KEY: Record<string, TranslationKey> = { PASSED: "placement.outcomePASSED", REJECTED: "placement.outcomeREJECTED", ABSENT: "placement.outcomeABSENT", ON_HOLD: "placement.outcomeON_HOLD" };
export const ROUND_KIND_KEY: Record<string, TranslationKey> = { APTITUDE: "placement.roundAPTITUDE", TECHNICAL_TEST: "placement.roundTECHNICAL_TEST", GROUP_DISCUSSION: "placement.roundGROUP_DISCUSSION", TECHNICAL_INTERVIEW: "placement.roundTECHNICAL_INTERVIEW", HR_INTERVIEW: "placement.roundHR_INTERVIEW", CODING: "placement.roundCODING", CASE: "placement.roundCASE", OTHER: "placement.roundOTHER" };
export const SECTOR_KEY: Record<string, TranslationKey> = { IT_SOFTWARE: "placement.sectorIT_SOFTWARE", CORE_ENGINEERING: "placement.sectorCORE_ENGINEERING", BFSI: "placement.sectorBFSI", CONSULTING: "placement.sectorCONSULTING", MANUFACTURING: "placement.sectorMANUFACTURING", PHARMA_HEALTH: "placement.sectorPHARMA_HEALTH", FMCG_RETAIL: "placement.sectorFMCG_RETAIL", EDTECH: "placement.sectorEDTECH", GOVT_PSU: "placement.sectorGOVT_PSU", STARTUP: "placement.sectorSTARTUP", OTHER: "placement.sectorOTHER" };
export const INTERNSHIP_STATUS_KEY: Record<string, TranslationKey> = { PROPOSED: "placement.internPROPOSED", APPROVED: "placement.internAPPROVED", SUBMITTED: "placement.internSUBMITTED", EVALUATED: "placement.internEVALUATED", CREDITED: "placement.internCREDITED", REFUSED: "placement.internREFUSED" };
export const INTERNSHIP_KIND_KEY: Record<string, TranslationKey> = { INDUSTRY: "placement.internKindINDUSTRY", RESEARCH: "placement.internKindRESEARCH", FAMILY_BUSINESS: "placement.internKindFAMILY_BUSINESS", COURT: "streamRecords.internKindCOURT", FIRM: "streamRecords.internKindFIRM", LEGAL_AID: "streamRecords.internKindLEGAL_AID", SUMMER: "streamRecords.internKindSUMMER" };
export const GIFT_KIND_KEY: Record<string, TranslationKey> = { DONATION: "placement.giftDONATION", ENDOWMENT: "placement.giftENDOWMENT", SCHOLARSHIP: "placement.giftSCHOLARSHIP", IN_KIND: "placement.giftIN_KIND" };
export const BAND_KEY: Record<string, TranslationKey> = { UNDER_3: "placement.bandUNDER_3", "3_TO_5": "placement.band3_TO_5", "5_TO_8": "placement.band5_TO_8", "8_TO_12": "placement.band8_TO_12", "12_PLUS": "placement.band12_PLUS" };
export const GENDER_KEY: Record<string, TranslationKey> = { M: "placement.genderM", F: "placement.genderF", T: "placement.genderT" };
const FAIL_KEY: Record<EligibilityFail["code"], TranslationKey> = {
  CGPA: "placement.failCGPA",
  CGPA_UNKNOWN: "placement.failCGPA_UNKNOWN",
  BACKLOGS: "placement.failBACKLOGS",
  BACKLOGS_UNKNOWN: "placement.failBACKLOGS_UNKNOWN",
  PROGRAMME: "placement.failPROGRAMME",
  BATCH: "placement.failBATCH",
  GENDER: "placement.failGENDER",
  OPTED_OUT: "placement.failOPTED_OUT",
  PLACED: "placement.failPLACED",
};

/** "₹6.5 lakh a year" in the reader's words; the figure is the CTC in rupees. */
export function lpa(rupees: number, t: Translate): string {
  const lakh = Math.round((rupees / 100_000) * 100) / 100;
  return t("placement.lpa", { amount: String(lakh) });
}
export function packageRange(min: number, max: number, t: Translate): string {
  return min === max ? lpa(min, t) : `${lpa(min, t)} – ${lpa(max, t)}`;
}

/** Each failed condition as a sentence: "CGPA 6.80 is below 7.00". */
export function reasons(failed: EligibilityFail[], t: Translate): string[] {
  return failed.map((f) => t(FAIL_KEY[f.code], { need: f.need ?? "", have: f.have ?? "—" }));
}

export function statusBadge(status: string, t: Translate) {
  const tone = status === "CLOSED" ? "neutral" : status === "DRAFT" ? "outline" : status === "OPEN" ? "ok" : "accent";
  return <Badge tone={tone}>{t(DRIVE_STATUS_KEY[status] ?? "placement.statusDRAFT")}</Badge>;
}

export function applicationBadge(a: Pick<DriveApplicationView, "status" | "round">, t: Translate) {
  const tone = a.status === "SELECTED" ? "ok" : a.status === "REJECTED" || a.status === "WITHDRAWN" ? "neutral" : "accent";
  return <Badge tone={tone}>{a.status === "ROUND" ? t("placement.appRoundN", { round: a.round ?? 1 }) : t(APP_STATUS_KEY[a.status]!)}</Badge>;
}

export function offerLine(o: OfferView, t: Translate): string {
  const state = o.joinedAt ? t("placement.offerJoined") : o.acceptedAt ? t("placement.offerAcceptedState") : o.declinedAt ? t("placement.offerDeclinedState") : t("placement.offerWaiting");
  return `${o.companyName} · ${lpa(o.packageRupees, t)} · ${state}${o.dreamException ? ` · ${t("placement.dreamOffer")}` : ""}`;
}

/** The cell's pages: the TPO, and the office and principal who read them, at a college with PLACEMENT on. */
export async function cellContext() {
  const ctx = await requireRole("TPO", "ADMIN", "PRINCIPAL", "IQAC");
  const [t, locale, on, kind] = await Promise.all([getT(), getLocale(), isModuleOn(ctx.schoolId, "PLACEMENT"), institutionKindOf(ctx.schoolId)]);
  return { ctx, t, locale, on, college: isCollegeKind(kind), canWrite: ctx.role === "TPO" };
}

const TABS = [
  ["home", "/placement", "placement.tabHome"],
  ["drives", "/placement/drives", "placement.tabDrives"],
  ["students", "/placement/students", "placement.tabStudents"],
  ["companies", "/placement/companies", "placement.tabCompanies"],
  ["internships", "/placement/internships", "placement.tabInternships"],
  ["analytics", "/placement/analytics", "placement.tabAnalytics"],
] as const;

export function CellFrame({ t, on, college, current, title, description, ok, error, children, back }: { t: Translate; on: boolean; college: boolean; current: (typeof TABS)[number][0] | null; title: string; description?: string; ok?: string; error?: string; children: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="space-y-5">
      <PageHeader title={title} description={on ? description : undefined} back={back} />
      {on ? (
        <>
          <TabBar ariaLabel={t("placement.cellNav")} current={current ?? ""} tabs={TABS.map(([key, href, label]) => ({ key, href, label: t(label) }))} />
          <Flash ok={ok} error={error} />
          {children}
        </>
      ) : (
        <ModuleOff module="PLACEMENT" t={t} college={college} />
      )}
    </div>
  );
}

export const LINK = "font-medium text-accent-strong hover:underline";
export const TABLE = "w-full text-left text-sm";
export const TH = "px-3 py-2 text-xs font-semibold uppercase tracking-wide text-fg-muted";
export const TD = "px-3 py-2 align-top";
