"use server";

import {
  admissionRoundDatesSchema,
  admissionRoundSaveSchema,
  collegeApplicationCreateSchema,
  collegeConcessionBodySchema,
  collegeFeeStructureBodySchema,
  collegeLibrarySettingsSchema,
  eResourceSaveSchema,
  hostelRulesBodySchema,
  routeCollegeBodySchema,
  scholarshipClaimCreateSchema,
  scholarshipClaimUpdateSchema,
  squadRoundSaveSchema,
} from "@edulink/contracts";
import { parseRupees } from "@edulink/i18n";
import { AttachmentError, storeAttachments } from "@/lib/uploads";
import { AccessError, requireApiUser } from "@/lib/tenancy";
import { answerForm } from "@/lib/form-action";
import type { FieldMap, FormState } from "@/lib/form-state";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import type { ActiveContext } from "@/lib/session";
import { admitStudent, approveSupernumerary, cancelAdmission, createApplication, importAllotments, offerSeat, recordAdmissionFee, recordRefund, recordUndertaking, saveRound, saveRoundDates, setDocument } from "@/lib/college-admissions";
import { billMess, createCollegeStructure, decideConcession, grantCollegeConcession, raiseDemands, raiseRouteFees, saveOfficeSettings } from "@/lib/college-fees";
import { addClaimDocument, createClaim, updateClaim } from "@/lib/scholarships";
import { clearLine } from "@/lib/no-dues";
import { leaveCollege } from "@/lib/college-records";
import { changeRoom, importCalendar, importIsbnList, isbnImportSentence, logSquadRound, saveCollegeLibrarySettings, saveEResource, saveHostelRules, saveRouteCollege } from "@/lib/college-campus";

/**
 * THE COLLEGE OFFICE'S FORMS (4 October 2026): the accounts desk, college
 * admissions, scholarships, no-dues, leaving, and the college settings of the
 * library, hostel and transport. Every form posts here with a `back` path and
 * returns there with ?ok= or ?error= in the reader's language; who may do
 * what is decided in the libraries, as for the /api/v1 doors.
 */

const BACK = /^\/(accounts|admin\/college-admissions|admin\/college-campus|library\/college|hostel\/squad|student\/scholarships)(\/[\w-]*)*$/;

function backOf(formData: FormData): string {
  const raw = String(formData.get("back") ?? "");
  const [path, query = ""] = raw.split("?");
  if (!path || !BACK.test(path)) return "/accounts";
  const keep = new URLSearchParams(query);
  keep.delete("ok");
  keep.delete("error");
  const q = keep.toString();
  return q ? `${path}?${q}` : path;
}


const str = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();
const int = (formData: FormData, name: string) => {
  const v = str(formData, name);
  return v === "" ? Number.NaN : Number(v);
};
const rupees = (formData: FormData, name: string) => parseRupees(str(formData, name)) ?? Number.NaN;

type Done = TranslationKey | { key: TranslationKey; vars: Record<string, string | number> } | null;
/** A form the schema refused, its error the cause (lib/form-state.ts reads which box it is about). */
class FormError extends Error {
  override name = "FormError";
  constructor(cause?: unknown) {
    super("form", cause === undefined ? undefined : { cause });
  }
}
function parsed<T>(result: { success: true; data: T } | { success: false; error?: unknown }): T {
  if (!result.success) throw new FormError(result.error);
  return result.data;
}

/**
 * Every form answers in place (A3-journeys-27, risks batch): through
 * <ActionForm>, a refusal keeps what was typed and sits under the box it is
 * about (lib/form-state.ts), a done is a toast and the page it came from is
 * refreshed. Nothing redirects with ?error= any more.
 */
async function run(previous: FormState, formData: FormData, work: (ctx: ActiveContext) => Promise<Done>, fields?: FieldMap): Promise<FormState> {
  return answerForm(previous, formData, async () => work(await requireApiUser()), { revalidate: [backOf(formData)], fields });
}

/* ------------------------------- Admissions ------------------------------- */

export async function saveRoundAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx) => {
    const seats: Record<string, number> = {};
    for (const [k, v] of formData.entries()) if (k.startsWith("seat_") && String(v).trim() !== "") seats[k.slice(5)] = Number(v);
    await saveRound(ctx, parsed(admissionRoundSaveSchema.safeParse({ programmeId: str(formData, "programmeId") || null, intakeYear: int(formData, "intakeYear"), kind: str(formData, "kind"), name: str(formData, "name"), opensOn: str(formData, "opensOn"), closesOn: str(formData, "closesOn"), seats })));
    return "collegeOffice.roundSaved";
  });
}

/** A round's dates alone (TA-572): extend it, or close it by moving the closing day; the seats are not retyped. */
export async function saveRoundDatesAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx) => {
    await saveRoundDates(ctx, str(formData, "roundId"), parsed(admissionRoundDatesSchema.safeParse({ opensOn: str(formData, "opensOn"), closesOn: str(formData, "closesOn") })));
    return "collegeOffice.roundDatesSaved";
  });
}

export async function importAllotmentsAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx) => {
    const r = await importAllotments(ctx, str(formData, "roundId"), String(formData.get("text") ?? ""));
    return { key: "collegeOffice.importDone", vars: { added: r.added, already: r.already, refused: r.refused.length } };
  });
}

export async function createApplicationAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx) => {
    const extra = formData.getAll("extra").map(String).filter((x) => x === "gap" || x === "migration");
    const fromAllotment = str(formData, "capAllotmentId");
    const input = fromAllotment
      ? { roundId: str(formData, "roundId"), capAllotmentId: fromAllotment, ...(str(formData, "programmeId") ? { programmeId: str(formData, "programmeId") } : {}), extraDocuments: extra }
      : { roundId: str(formData, "roundId"), programmeId: str(formData, "programmeId"), applicantName: str(formData, "applicantName"), category: str(formData, "category"), quota: str(formData, "quota"), ...(str(formData, "meritRank") ? { meritRank: int(formData, "meritRank") } : {}), ...(str(formData, "birthdateKey") ? { birthdateKey: str(formData, "birthdateKey") } : {}), extraDocuments: extra };
    const a = await createApplication(ctx, parsed(collegeApplicationCreateSchema.safeParse(input)));
    return { key: "collegeOffice.applicationSaved", vars: { name: a.applicantName } };
  });
}

export async function documentAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx) => {
    const status = str(formData, "status");
    // The scanned certificate, when one is attached: stored, and its id kept on the checklist (files.ts lets the office read it).
    const file = formData.get("file");
    let fileId: string | undefined;
    if (file instanceof File && file.size > 0) {
      try {
        fileId = (await storeAttachments([file], { max: 1 }))[0]?.fileId;
      } catch (error) {
        if (error instanceof AttachmentError) throw new AccessError(error.key, "FORBIDDEN", error.vars);
        throw error;
      }
    }
    await setDocument(ctx, str(formData, "applicationId"), { doc: str(formData, "doc") as never, ...(status ? { status: status as "PENDING" | "VERIFIED" | "REJECTED" } : {}), ...(str(formData, "note") ? { note: str(formData, "note") } : {}) }, { fileId: fileId ?? null });
    return "collegeOffice.documentSaved";
  });
}

export async function undertakingAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx) => {
    await recordUndertaking(ctx, str(formData, "applicationId"), str(formData, "by") === "PARENT" ? "PARENT" : "STUDENT");
    return "collegeOffice.undertakingSaved";
  });
}

export async function offerAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx) => {
    const a = await offerSeat(ctx, str(formData, "applicationId"));
    return a.status === "FEE_DUE" ? "collegeOffice.offeredFeeDue" : "collegeOffice.offeredNoStructure";
  });
}

export async function admissionFeeAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx) => {
    await recordAdmissionFee(ctx, str(formData, "applicationId"), { amountPaise: rupees(formData, "amount"), method: str(formData, "method") as "CASH" | "CHEQUE" | "BANK" | "UPI", reference: str(formData, "reference") });
    return "collegeOffice.feeRecorded";
  });
}

export async function admitAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx) => {
    const r = await admitStudent(ctx, str(formData, "applicationId"), { ...(str(formData, "prn") ? { prn: str(formData, "prn") } : {}), ...(str(formData, "apaarId") ? { apaarId: str(formData, "apaarId") } : {}), ...(str(formData, "abcId") ? { abcId: str(formData, "abcId") } : {}) });
    return { key: "collegeOffice.admitted", vars: { code: r.studentCode } };
  });
}

export async function supernumeraryAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx) => {
    await approveSupernumerary(ctx, str(formData, "applicationId"), { reason: str(formData, "reason") });
    return "collegeOffice.supernumeraryDone";
  });
}

export async function cancelAdmissionAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx) => {
    await cancelAdmission(ctx, str(formData, "applicationId"), { reason: str(formData, "reason"), lastDateKey: str(formData, "lastDateKey") });
    return "collegeOffice.cancelled";
  });
}

export async function refundAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx) => {
    await recordRefund(ctx, str(formData, "applicationId"), str(formData, "reference"));
    return "collegeOffice.refundRecorded";
  });
}

/* ------------------------------ Fees, accounts ---------------------------- */

export async function structureAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx) => {
    const heads = formData.getAll("headId").map(String);
    const terms = [1, 2]
      .map((n) => ({ label: str(formData, `term${n}Label`), dueDateKey: str(formData, `term${n}Due`), lines: heads.map((headId) => ({ headId, amountPaise: rupees(formData, `term${n}_${headId}`) })).filter((l) => Number.isFinite(l.amountPaise) && l.amountPaise > 0) }))
      .filter((x) => x.label && x.lines.length > 0);
    const slabs = [1, 2].map((n) => ({ afterDays: int(formData, `slab${n}Days`), paise: rupees(formData, `slab${n}Amount`) })).filter((x) => Number.isFinite(x.afterDays) && Number.isFinite(x.paise) && x.afterDays > 0);
    await createCollegeStructure(ctx, parsed(collegeFeeStructureBodySchema.safeParse({ programmeId: str(formData, "programmeId"), yearOfStudy: int(formData, "yearOfStudy"), category: str(formData, "category"), approvalRef: str(formData, "approvalRef"), name: str(formData, "name"), terms, lateFeeSlabs: slabs })));
    return "collegeOffice.structureSaved";
  });
}

export async function raiseDemandsAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx) => {
    const r = await raiseDemands(ctx, {});
    return { key: "collegeOffice.demandsRaised", vars: { assigned: r.assigned, unchanged: r.unchanged, missing: r.noStructure.length } };
  });
}

export async function concessionAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx) => {
    const kind = str(formData, "kind") === "PERCENT" ? "PERCENT" : "AMOUNT";
    const value = kind === "PERCENT" ? Math.round(Number(str(formData, "value")) * 100) : rupees(formData, "value");
    const r = await grantCollegeConcession(ctx, parsed(collegeConcessionBodySchema.safeParse({ studentMembershipId: str(formData, "studentMembershipId"), headId: str(formData, "headId") || null, kind, value, reason: str(formData, "reason"), authority: str(formData, "authority") })));
    return r.approvalStatus === "PENDING" ? "collegeOffice.concessionPending" : "collegeOffice.concessionApplied";
  });
}

export async function decideConcessionAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx) => {
    const approve = str(formData, "approve") === "1";
    await decideConcession(ctx, str(formData, "concessionId"), { approve });
    return approve ? "collegeOffice.concessionApproved" : "collegeOffice.concessionRefused";
  });
}

export async function officeSettingsAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx) => {
    const limit = rupees(formData, "limit");
    if (!Number.isFinite(limit) || limit < 0) throw new FormError();
    await saveOfficeSettings(ctx, { concessionLimitPaise: limit });
    return "collegeOffice.settingsSaved";
  });
}

export async function messBillAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx) => {
    const r = await billMess(ctx, { month: str(formData, "month") });
    return { key: "collegeOffice.messBilled", vars: { billed: r.billed, already: r.already } };
  });
}

export async function routeFeesAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx) => {
    const r = await raiseRouteFees(ctx, { termLabel: str(formData, "termLabel"), dueDateKey: str(formData, "dueDateKey") });
    return { key: "collegeOffice.routeFeesRaised", vars: { raised: r.raised, already: r.already } };
  });
}

/* ------------------------------ Scholarships ------------------------------ */

/**
 * The scholarship forms answer in place (A3-journeys-27): a refusal keeps
 * what was typed and is said under the box it is about. Which box each of
 * the library's refusals and the schema's figures is:
 */
const CLAIM_FIELDS: FieldMap = { "collegeOffice.refuseSchemeNotOpen": "scheme", "collegeOffice.refuseDates": "appliedOn", expectedPaise: "expected" };
const CLAIM_STEP_FIELDS: FieldMap = { "collegeOffice.refuseDates": "on", "collegeOffice.refuseDisbursedAmount": "amount", amountPaise: "amount" };

export async function createClaimAction(previous: FormState, formData: FormData): Promise<FormState> {
  return answerForm(
    previous,
    formData,
    async () => {
      const ctx = await requireApiUser();
      const expected = str(formData, "expected");
      await createClaim(ctx, parsed(scholarshipClaimCreateSchema.safeParse({ studentMembershipId: str(formData, "studentMembershipId"), scheme: str(formData, "scheme"), ...(str(formData, "portalApplicationId") ? { portalApplicationId: str(formData, "portalApplicationId") } : {}), ...(str(formData, "appliedOn") ? { appliedOn: str(formData, "appliedOn") } : {}), ...(expected ? { expectedPaise: rupees(formData, "expected") } : {}) })));
      return "collegeOffice.claimSaved";
    },
    { revalidate: [backOf(formData)], fields: CLAIM_FIELDS },
  );
}

export async function updateClaimAction(previous: FormState, formData: FormData): Promise<FormState> {
  return answerForm(
    previous,
    formData,
    async () => {
      const ctx = await requireApiUser();
      const action = str(formData, "action");
      const body =
        action === "SANCTION"
          ? { action, amountPaise: rupees(formData, "amount"), on: str(formData, "on") }
          : action === "DISBURSE"
            ? { action, amountPaise: rupees(formData, "amount"), on: str(formData, "on"), reference: str(formData, "reference") }
            : action === "PORTAL_ID"
              ? { action, portalApplicationId: str(formData, "portalApplicationId") }
              : { action, reason: str(formData, "reason") };
      await updateClaim(ctx, str(formData, "claimId"), parsed(scholarshipClaimUpdateSchema.safeParse(body)));
      return "collegeOffice.claimUpdated";
    },
    { revalidate: [backOf(formData)], fields: CLAIM_STEP_FIELDS },
  );
}

/* ------------------------------ No-dues, leaving -------------------------- */

export async function clearLineAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx) => {
    await clearLine(ctx, str(formData, "studentMembershipId"), { event: str(formData, "event") as "EXAM_FORM" | "HOSTEL_EXIT" | "LEAVING", desk: str(formData, "desk") as "ACCOUNTS" | "LIBRARY" | "HOSTEL" | "LAB", ...(str(formData, "note") ? { note: str(formData, "note") } : {}) });
    return "collegeOffice.lineCleared";
  });
}

export async function leaveAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx) => {
    const reason = str(formData, "reason");
    const r = await leaveCollege(ctx, str(formData, "studentMembershipId"), { leftOn: str(formData, "leftOn"), reason: reason === "GRADUATED" || reason === "TRANSFERRED" ? reason : "LEFT", ...(str(formData, "cautionReturnRef") ? { cautionReturnRef: str(formData, "cautionReturnRef") } : {}) });
    return { key: "collegeOffice.leftDone", vars: { amount: (r.cautionReturnPaise / 100).toFixed(2) } };
  });
}

/* ------------------------- Library, hostel, transport --------------------- */

export async function collegeLibrarySettingsAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx) => {
    await saveCollegeLibrarySettings(ctx, parsed(collegeLibrarySettingsSchema.safeParse({ facultyLimit: int(formData, "facultyLimit"), facultyLoanDays: int(formData, "facultyLoanDays"), collegeStudentLimit: int(formData, "collegeStudentLimit"), collegeStudentLoanDays: int(formData, "collegeStudentLoanDays"), bookBankExtra: int(formData, "bookBankExtra") })));
    return "collegeOffice.settingsSaved";
  });
}

export async function eResourceAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx) => {
    await saveEResource(ctx, parsed(eResourceSaveSchema.safeParse({ name: str(formData, "name"), url: str(formData, "url"), kind: str(formData, "kind") })));
    return "collegeOffice.eResourceSaved";
  });
}

export async function isbnImportAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx) => {
    const text = String(formData.get("text") ?? "");
    if (!text.trim()) throw new AccessError("campusForms.isbnEmpty");
    // The school's catalogue form and this one say the same (qb-C, QB-11): one title or many, the failing ISBNs named.
    return isbnImportSentence(await importIsbnList(ctx, text));
  });
}

export async function hostelRulesAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx) => {
    const [h, m] = str(formData, "curfew").split(":").map(Number);
    await saveHostelRules(ctx, str(formData, "hostelId"), parsed(hostelRulesBodySchema.safeParse({ curfewMinute: (h ?? 0) * 60 + (m ?? 0), nightOutAllowed: formData.get("nightOutAllowed") === "on", messMonthlyPaise: rupees(formData, "mess") })));
    return "collegeOffice.settingsSaved";
  });
}

export async function squadRoundAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx) => {
    const at = str(formData, "at");
    await logSquadRound(ctx, parsed(squadRoundSaveSchema.safeParse({ hostelId: str(formData, "hostelId"), at: at ? new Date(at).toISOString() : "", members: str(formData, "members"), note: str(formData, "note"), flagged: formData.get("flagged") === "on" })));
    return "collegeOffice.squadLogged";
  });
}

export async function roomChangeAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx) => {
    await changeRoom(ctx, { allotmentId: str(formData, "allotmentId"), roomId: str(formData, "roomId"), bed: int(formData, "bed") });
    return "collegeOffice.roomChanged";
  });
}

export async function routeCollegeAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx) => {
    await saveRouteCollege(ctx, str(formData, "routeId"), parsed(routeCollegeBodySchema.safeParse({ kind: str(formData, "kind"), feePerTermPaise: rupees(formData, "fee") || 0 })));
    return "collegeOffice.settingsSaved";
  });
}

export async function calendarImportAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx) => {
    const r = await importCalendar(ctx, String(formData.get("text") ?? ""));
    return { key: "collegeOffice.calendarImported", vars: { added: r.added, already: r.already, refused: r.refused.length } };
  });
}

/* ------------------------------ The student's own ------------------------- */

export async function claimDocumentAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async (ctx) => {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) throw new FormError();
    let stored;
    try {
      stored = (await storeAttachments([file], { max: 1 }))[0];
    } catch (error) {
      if (error instanceof AttachmentError) throw new AccessError(error.key, "FORBIDDEN", error.vars);
      throw error;
    }
    if (!stored) throw new FormError();
    const key = str(formData, "key");
    await addClaimDocument(ctx, str(formData, "claimId"), { key: ["income", "caste", "domicile", "fee_receipt", "bank_passbook", "marksheet", "other"].includes(key) ? key : "other", fileId: stored.fileId, name: stored.name.slice(0, 120) }, { storedHere: true });
    return "collegeOffice.documentSaved";
  });
}
