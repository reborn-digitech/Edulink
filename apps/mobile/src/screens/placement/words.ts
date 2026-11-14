import type { TranslationKey, Translate } from "@edulink/i18n";
import type { DriveApplicationView, EligibilityFail, OfferView, PlacementSector } from "@edulink/contracts";

/**
 * The placement module's words on the phone (4 Oct 2026), the web's
 * components/placement/parts.tsx again: every coded value as a key, the
 * package as lakh a year, each eligibility reason as a sentence.
 */
export const DRIVE_STATUS_KEY: Record<string, TranslationKey> = { DRAFT: "placement.statusDRAFT", OPEN: "placement.statusOPEN", SHORTLISTING: "placement.statusSHORTLISTING", ROUNDS: "placement.statusROUNDS", OFFERS: "placement.statusOFFERS", CLOSED: "placement.statusCLOSED" };
export const APP_STATUS_KEY: Record<string, TranslationKey> = { APPLIED: "placement.appAPPLIED", SHORTLISTED: "placement.appSHORTLISTED", ROUND: "placement.appROUND", SELECTED: "placement.appSELECTED", REJECTED: "placement.appREJECTED", WITHDRAWN: "placement.appWITHDRAWN" };
export const OUTCOME_KEY: Record<string, TranslationKey> = { PASSED: "placement.outcomePASSED", REJECTED: "placement.outcomeREJECTED", ABSENT: "placement.outcomeABSENT", ON_HOLD: "placement.outcomeON_HOLD" };
/** A company's sectors, as the web's SECTOR_KEY (TA-351: the recruiter's form on the phone asks for them). */
export const SECTOR_KEY: Record<PlacementSector, TranslationKey> = { IT_SOFTWARE: "placement.sectorIT_SOFTWARE", CORE_ENGINEERING: "placement.sectorCORE_ENGINEERING", BFSI: "placement.sectorBFSI", CONSULTING: "placement.sectorCONSULTING", MANUFACTURING: "placement.sectorMANUFACTURING", PHARMA_HEALTH: "placement.sectorPHARMA_HEALTH", FMCG_RETAIL: "placement.sectorFMCG_RETAIL", EDTECH: "placement.sectorEDTECH", GOVT_PSU: "placement.sectorGOVT_PSU", STARTUP: "placement.sectorSTARTUP", OTHER: "placement.sectorOTHER" };
export const INTERNSHIP_STATUS_KEY: Record<string, TranslationKey> = { PROPOSED: "placement.internPROPOSED", APPROVED: "placement.internAPPROVED", SUBMITTED: "placement.internSUBMITTED", EVALUATED: "placement.internEVALUATED", CREDITED: "placement.internCREDITED", REFUSED: "placement.internREFUSED" };
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

export function lpa(rupees: number, t: Translate): string {
  return t("placement.lpa", { amount: String(Math.round((rupees / 100_000) * 100) / 100) });
}
export function packageRange(min: number, max: number, t: Translate): string {
  return min === max ? lpa(min, t) : `${lpa(min, t)} – ${lpa(max, t)}`;
}
export function reasons(failed: EligibilityFail[], t: Translate): string[] {
  return failed.map((f) => t(FAIL_KEY[f.code], { need: needOf(f), have: f.have ?? "—" }));
}
/** A package floor (PLACED, in rupees) reads in lakh, as on the web (A3-journeys-19). */
function needOf(f: EligibilityFail): string {
  if (f.need === null) return "";
  return f.code === "PLACED" && /^\d+(\.\d+)?$/.test(f.need) ? String(Math.round((Number(f.need) / 100_000) * 100) / 100) : f.need;
}
export function applicationLabel(a: Pick<DriveApplicationView, "status" | "round">, t: Translate): string {
  return a.status === "ROUND" ? t("placement.appRoundN", { round: a.round ?? 1 }) : t(APP_STATUS_KEY[a.status]!);
}
export function offerLine(o: OfferView, t: Translate): string {
  const state = o.joinedAt ? t("placement.offerJoined") : o.acceptedAt ? t("placement.offerAcceptedState") : o.declinedAt ? t("placement.offerDeclinedState") : t("placement.offerWaiting");
  return `${o.companyName} · ${lpa(o.packageRupees, t)} · ${state}${o.dreamException ? ` · ${t("placement.dreamOffer")}` : ""}`;
}
