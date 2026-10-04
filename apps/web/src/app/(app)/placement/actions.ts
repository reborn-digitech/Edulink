"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  alumniGiftSaveSchema,
  alumniMeetSaveSchema,
  alumniMentorSlotSaveSchema,
  alumniReferralSaveSchema,
  alumniCompanyLinkSaveSchema,
  companySaveSchema,
  driveSaveSchema,
  driveUpdateSchema,
  internshipDiarySchema,
  internshipEvaluateSchema,
  internshipProposeSchema,
  offerSaveSchema,
  placementProfileSaveSchema,
  placementSettingsSchema,
  projectReviewSchema,
  projectSaveSchema,
  recruiterFeedbackSchema,
  requirementSaveSchema,
  roundResultsSaveSchema,
  type DriveStatus,
} from "@edulink/contracts";
import { AccessError, requireApiUser } from "@/lib/tenancy";
import { RuleRefusal } from "@/lib/rule-refusal";
import { getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import type { ActiveContext } from "@/lib/session";
import { storeAttachments } from "@/lib/uploads";
import {
  acceptRequirement,
  addCompany,
  answerOffer,
  applyToDrive,
  cellActor,
  cellActorForOffer,
  inviteEligible,
  openDrive,
  recordJoined,
  recordOffer,
  recordRoundResults,
  remindApplicants,
  saveMyProfile,
  savePlacementSettings,
  setDreamFlag,
  updateDrive,
  verifyCompany,
  withdrawApplication,
} from "@/lib/placement";
import { publishSeason } from "@/lib/placement-analytics";
import { guardianConsentToApplication } from "@/lib/placement-student";
import { addDiaryEntry, attachInternshipFile, decideInternship, evaluateInternship, proposeInternship } from "@/lib/placement-internships";
import { createProject, reviewProject } from "@/lib/placement-projects";
import { addColleague, answerInvitation, postRequirement, recruiterActor, recruiterActorForOffer, recruiterFeedback, registerCompany, removeColleague } from "@/lib/placement-recruiter";
import { createMeet, linkMyCompany, offerMentorSlot, recordGift, referOpening, registerForMeet } from "@/lib/placement-alumni";
import { closeBooking } from "@/lib/gig-sessions";

/**
 * The placement module's web forms (4 October 2026): the cell's, the
 * student's, the recruiter's, the supervisors' and the alumni's. Every one
 * posts here with a `back` path and returns there with ?ok= or ?error= in the
 * reader's language. Who may do what is decided in src/lib/placement*.ts, as
 * for the /api/v1 doors, so the page and the phone keep the same rules.
 */

const BACK = /^\/(placement|student\/placement|recruiter|faculty\/supervision|hod\/projects|parent\/placement|alumni\/college|admin\/alumni\/college)(\/[\w-]*)*$/;

function backOf(formData: FormData): string {
  const raw = String(formData.get("back") ?? "");
  const [path, query = ""] = raw.split("?");
  if (!path || !BACK.test(path)) return "/placement";
  const keep = new URLSearchParams(query);
  keep.delete("ok");
  keep.delete("error");
  const q = keep.toString();
  return q ? `${path}?${q}` : path;
}

function withMessage(back: string, key: "ok" | "error", text: string): string {
  return `${back}${back.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(text)}`;
}

const str = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();
const num = (formData: FormData, name: string): number | null => {
  const v = str(formData, name);
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const all = (formData: FormData, name: string) => formData.getAll(name).map((v) => String(v).trim()).filter(Boolean);
const lines = (formData: FormData, name: string) => str(formData, name).split(/\r?\n|,/).map((x) => x.trim()).filter(Boolean);
/** Lakh rupees a year as typed (6.5), as rupees. */
const lakh = (formData: FormData, name: string) => {
  const v = num(formData, name);
  return v === null ? NaN : Math.round(v * 100_000);
};

type Done = TranslationKey | { key: TranslationKey; vars: Record<string, string | number> } | null;
class FormError extends Error {}
function parsed<T>(result: { success: true; data: T } | { success: false }): T {
  if (!result.success) throw new FormError();
  return result.data;
}

async function run(formData: FormData, work: (ctx: ActiveContext) => Promise<Done>): Promise<void> {
  const back = backOf(formData);
  const t = await getT();
  let done: Done;
  try {
    const ctx = await requireApiUser();
    done = await work(ctx);
  } catch (error) {
    if (error instanceof AccessError) redirect(withMessage(back, "error", t(error.key, error.vars)));
    if (error instanceof RuleRefusal) redirect(withMessage(back, "error", t(error.key, error.vars)));
    if (error instanceof FormError) redirect(withMessage(back, "error", t("common.checkTheForm")));
    throw error;
  }
  revalidatePath(back.split("?")[0]!);
  if (!done) redirect(back);
  redirect(withMessage(back, "ok", typeof done === "string" ? t(done) : t(done.key, done.vars)));
}

async function oneFile(formData: FormData, name: string): Promise<string | null> {
  const file = formData.get(name);
  if (!(file instanceof File) || file.size === 0) return null;
  const stored = await storeAttachments([file], { max: 1 });
  return stored[0]?.fileId ?? null;
}

/* ------------------------------------------------------------------ the cell */

export async function saveSettingsAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    await savePlacementSettings(ctx, parsed(placementSettingsSchema.safeParse({ seasonBatchYear: num(formData, "seasonBatchYear"), dreamRatio: num(formData, "dreamRatio"), allowGenderRule: formData.get("allowGenderRule") === "on" })));
    return "placement.settingsSaved";
  });
}

export async function addCompanyAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    const c = await addCompany(ctx, parsed(companySaveSchema.safeParse({ name: str(formData, "name"), identifier: str(formData, "identifier"), sectors: all(formData, "sectors"), pointOfContact: str(formData, "pointOfContact") })));
    return { key: "placement.companyAdded", vars: { name: c.name } };
  });
}

export async function verifyCompanyAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    const c = await verifyCompany(ctx, str(formData, "companyId"));
    return { key: "placement.companyVerified", vars: { name: c.name } };
  });
}

export async function acceptRequirementAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    await acceptRequirement(ctx, str(formData, "requirementId"));
    return "placement.requirementAccepted";
  });
}

function ruleFrom(formData: FormData) {
  return {
    cgpaMin: num(formData, "cgpaMin"),
    noLiveBacklogs: formData.get("noLiveBacklogs") === "on",
    programmeIds: all(formData, "programmeIds"),
    batchYear: num(formData, "batchYear"),
    genders: all(formData, "genders"),
  };
}

function roundsFrom(formData: FormData) {
  return all(formData, "roundKinds").map((kind, i) => ({ n: i + 1, kind, note: "", at: null }));
}

export async function openDriveAction(formData: FormData): Promise<void> {
  let id = "";
  const t = await getT();
  try {
    const ctx = await requireApiUser();
    const at = str(formData, "firstAt");
    const input = parsed(
      driveSaveSchema.safeParse({
        companyId: str(formData, "companyId"),
        requirementId: null,
        kind: str(formData, "kind") || "ON_CAMPUS",
        title: str(formData, "title"),
        jd: str(formData, "jd"),
        packageMinRupees: lakh(formData, "packageMin"),
        packageMaxRupees: lakh(formData, "packageMax"),
        bond: str(formData, "bond"),
        rounds: roundsFrom(formData),
        schedule: at ? [{ label: str(formData, "firstLabel") || t("placement.scheduleVisit"), at: new Date(at).toISOString() }] : [],
        venues: str(formData, "venues"),
        rule: ruleFrom(formData),
        poolSchoolIds: all(formData, "poolSchoolIds"),
      }),
    );
    id = (await openDrive(ctx, input)).id;
  } catch (error) {
    const back = "/placement/drives/new";
    if (error instanceof AccessError || error instanceof RuleRefusal) redirect(withMessage(back, "error", t(error.key, error.vars)));
    if (error instanceof FormError) redirect(withMessage(back, "error", t("common.checkTheForm")));
    throw error;
  }
  revalidatePath("/placement");
  redirect(withMessage(`/placement/drives/${id}`, "ok", t("placement.driveOpened")));
}

export async function moveDriveAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    const status = str(formData, "status") as DriveStatus;
    await updateDrive(ctx, str(formData, "driveId"), parsed(driveUpdateSchema.safeParse({ status })));
    return { key: "placement.driveMoved", vars: { status } };
  });
}

export async function saveRuleAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    await updateDrive(ctx, str(formData, "driveId"), parsed(driveUpdateSchema.safeParse({ rule: ruleFrom(formData) })));
    return "placement.ruleSaved";
  });
}

export async function inviteAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    const r = await inviteEligible(ctx, str(formData, "driveId"));
    return { key: "placement.invited", vars: { told: r.told, eligible: r.eligible } };
  });
}

export async function remindAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    const r = await remindApplicants(ctx, str(formData, "driveId"));
    return { key: "placement.reminded", vars: { told: r.told } };
  });
}

/** A round's outcomes from the table: one select per candidate named `outcome_<membershipId>`, blank for "not this round". */
export async function resultsAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    const driveId = str(formData, "driveId");
    const results = [...formData.keys()]
      .filter((k) => k.startsWith("outcome_"))
      .map((k) => ({ studentMembershipId: k.slice("outcome_".length), outcome: str(formData, k), feedback: str(formData, `feedback_${k.slice("outcome_".length)}`) || null, feedbackShared: formData.get(`share_${k.slice("outcome_".length)}`) === "on" }))
      .filter((r) => r.outcome);
    const input = parsed(roundResultsSaveSchema.safeParse({ round: num(formData, "round"), results }));
    const actor = ctx.role === "RECRUITER" ? await recruiterActor(ctx, driveId) : await cellActor(ctx, driveId);
    const r = await recordRoundResults(actor, input);
    return { key: "placement.resultsSaved", vars: { count: r.saved } };
  });
}

export async function offerAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    const driveId = str(formData, "driveId");
    // The door's own schema first (campaign S-19): a negative or absurd package skews the NIRF
    // median and the dream rule, and the letter is stored only for an offer that will be made.
    const input = parsed(offerSaveSchema.safeParse({ studentMembershipId: str(formData, "studentMembershipId"), packageRupees: lakh(formData, "package"), letterFileId: null }));
    const actor = ctx.role === "RECRUITER" ? await recruiterActor(ctx, driveId) : await cellActor(ctx, driveId);
    const storedFileId = await oneFile(formData, "letter");
    const o = await recordOffer(actor, input, { storedFileId });
    return { key: "placement.offerRecorded", vars: { name: o.studentName } };
  });
}

export async function joinedAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    const offerId = str(formData, "offerId");
    const actor = ctx.role === "RECRUITER" ? await recruiterActorForOffer(ctx, offerId) : await cellActorForOffer(ctx, offerId);
    await recordJoined(actor, offerId, str(formData, "joinedOn"));
    return "placement.joinedRecorded";
  });
}

export async function dreamAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    const on = str(formData, "on") === "1";
    await setDreamFlag(ctx, str(formData, "studentMembershipId"), on);
    return on ? "placement.dreamGranted" : "placement.dreamWithdrawn";
  });
}

export async function publishSeasonAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    const s = await publishSeason(ctx, num(formData, "batchYear") ?? NaN);
    return { key: "placement.seasonPublished", vars: { batch: s.batchYear } };
  });
}

/* ------------------------------------------------------------- internships */

export async function decideInternshipAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    const approve = str(formData, "approve") === "1";
    await decideInternship(ctx, str(formData, "internshipId"), { approve, facultyMembershipId: str(formData, "facultyMembershipId") || null, reason: str(formData, "reason") });
    return approve ? "placement.internshipApproved" : "placement.internshipRefused";
  });
}

export async function evaluateInternshipAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    const input = parsed(
      internshipEvaluateSchema.safeParse({
        ...(str(formData, "industryGrade") ? { industryGrade: str(formData, "industryGrade") } : {}),
        ...(str(formData, "facultyVisitOn") ? { facultyVisitOn: str(formData, "facultyVisitOn") } : {}),
        ...(num(formData, "vivaMarks") !== null ? { vivaMarks: num(formData, "vivaMarks") } : {}),
        ...(num(formData, "credits") !== null ? { credits: num(formData, "credits") } : {}),
      }),
    );
    const v = await evaluateInternship(ctx, str(formData, "internshipId"), input);
    return v.status === "CREDITED" ? { key: "placement.internshipCredited", vars: { credits: v.credits ?? 0 } } : "placement.internshipEvaluated";
  });
}

/* ---------------------------------------------------------------- projects */

export async function createProjectAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    await createProject(ctx, parsed(projectSaveSchema.safeParse({ title: str(formData, "title"), guideMembershipId: str(formData, "guideMembershipId"), studentMembershipIds: all(formData, "studentMembershipIds") })));
    return "placement.projectCreated";
  });
}

export async function reviewProjectAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    await reviewProject(ctx, str(formData, "projectId"), parsed(projectReviewSchema.safeParse({ on: str(formData, "on"), note: str(formData, "note"), marks: num(formData, "marks"), final: formData.get("final") === "on" })));
    return "placement.projectReviewed";
  });
}

/* ------------------------------------------------------------------ student */

export async function saveProfileAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    const projects = lines(formData, "projects").map((title) => ({ title, note: "" }));
    await saveMyProfile(ctx, parsed(placementProfileSaveSchema.safeParse({ skills: lines(formData, "skills"), certifications: lines(formData, "certifications"), projects, optedOut: formData.get("optedOut") === "on", higherStudies: formData.get("higherStudies") === "on", entrepreneur: formData.get("entrepreneur") === "on" })));
    return "placement.profileSaved";
  });
}

export async function applyAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    if (formData.get("consent") !== "on") throw new RuleRefusal("placement.refuseNeedConsent", 422);
    await applyToDrive(ctx, str(formData, "driveId"));
    return "placement.applied";
  });
}

export async function withdrawAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    await withdrawApplication(ctx, str(formData, "driveId"));
    return "placement.withdrawn";
  });
}

export async function answerOfferAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    const accept = str(formData, "accept") === "1";
    await answerOffer(ctx, str(formData, "offerId"), accept);
    return accept ? "placement.offerAccepted" : "placement.offerDeclined";
  });
}

export async function proposeInternshipAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    await proposeInternship(ctx, parsed(internshipProposeSchema.safeParse({ companyName: str(formData, "companyName"), kind: str(formData, "kind"), from: str(formData, "from"), to: str(formData, "to"), hours: num(formData, "hours"), windowSemester: num(formData, "windowSemester"), supervisorName: str(formData, "supervisorName") })));
    return "placement.internshipProposed";
  });
}

export async function diaryAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    await addDiaryEntry(ctx, str(formData, "internshipId"), parsed(internshipDiarySchema.safeParse({ on: str(formData, "on"), hours: num(formData, "hours"), text: str(formData, "text") })));
    return "placement.diarySaved";
  });
}

export async function internshipFileAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    const kind = str(formData, "kind") === "DECLARATION" ? "DECLARATION" : "REPORT";
    const storedFileId = await oneFile(formData, "file");
    if (!storedFileId) throw new FormError();
    await attachInternshipFile(ctx, str(formData, "internshipId"), { kind, fileId: null }, { storedFileId });
    return kind === "REPORT" ? "placement.reportSaved" : "placement.declarationSaved";
  });
}

/* ---------------------------------------------------------------- recruiter */

export async function registerCompanyAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    await registerCompany(ctx, parsed(companySaveSchema.safeParse({ name: str(formData, "name"), identifier: str(formData, "identifier"), sectors: all(formData, "sectors"), pointOfContact: str(formData, "pointOfContact") })));
    return "placement.companyRegistered";
  });
}

export async function addColleagueAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    await addColleague(ctx, str(formData, "email"));
    return "placement.colleagueInvited";
  });
}

/** A guardian's consent to a minor's drive application, from /parent/placement (campaign S-6). */
export async function guardianConsentAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    await guardianConsentToApplication(ctx, str(formData, "applicationId"), str(formData, "childId"));
    return "placement.consentGiven";
  });
}

export async function answerInvitationAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    const accept = str(formData, "accept") === "1";
    await answerInvitation(ctx, str(formData, "companyId"), accept);
    return accept ? "placement.invitationAccepted" : "placement.invitationDeclined";
  });
}

export async function removeColleagueAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    await removeColleague(ctx, str(formData, "email"));
    return "placement.colleagueRemoved";
  });
}

export async function postRequirementAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    const r = await postRequirement(
      ctx,
      parsed(
        requirementSaveSchema.safeParse({
          role: str(formData, "role"),
          packageRupees: lakh(formData, "package"),
          bond: str(formData, "bond"),
          locations: str(formData, "locations"),
          eligibilityAsked: ruleFrom(formData),
          rounds: all(formData, "roundKinds").map((kind) => ({ kind, note: "" })),
          datesProposed: str(formData, "datesProposed"),
          targetSchoolIds: all(formData, "targetSchoolIds"),
        }),
      ),
    );
    return { key: "placement.requirementSent", vars: { count: r.targetSchools.length } };
  });
}

export async function recruiterFeedbackAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    await recruiterFeedback(ctx, str(formData, "driveId"), parsed(recruiterFeedbackSchema.safeParse({ rating: num(formData, "rating"), feedback: str(formData, "feedback") })));
    return "placement.feedbackSaved";
  });
}

/* ------------------------------------------------------------------- alumni */

export async function mentorSlotAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    const at = str(formData, "startsAt");
    await offerMentorSlot(ctx, parsed(alumniMentorSlotSaveSchema.safeParse({ title: str(formData, "title"), startsAt: at ? new Date(at).toISOString() : "", minutes: num(formData, "minutes") ?? 30, meetingUrl: str(formData, "meetingUrl") })));
    return "placement.slotOffered";
  });
}

export async function closeMentorBookingAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    const outcome = str(formData, "outcome") === "MISSED" ? "MISSED" : "DELIVERED";
    const r = await closeBooking(ctx, str(formData, "bookingId"), outcome);
    if (!r.ok) throw new RuleRefusal(r.errorKey, 409, r.vars);
    return "placement.bookingClosed";
  });
}

export async function referralAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    await referOpening(ctx, parsed(alumniReferralSaveSchema.safeParse({ driveId: str(formData, "driveId") || null, companyName: str(formData, "companyName"), note: str(formData, "note") })));
    return "placement.referralSent";
  });
}

export async function companyLinkAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    const r = await linkMyCompany(ctx, parsed(alumniCompanyLinkSaveSchema.safeParse({ identifier: str(formData, "identifier") || null, role: str(formData, "role") })));
    return r.linked ? "placement.companyLinked" : "placement.companyUnlinked";
  });
}

export async function meetAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    const going = str(formData, "going") === "1";
    await registerForMeet(ctx, str(formData, "meetId"), going);
    return going ? "placement.meetRegistered" : "placement.meetCancelled";
  });
}

export async function giftAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    const amount = num(formData, "amount");
    await recordGift(ctx, parsed(alumniGiftSaveSchema.safeParse({ alumnusMembershipId: str(formData, "alumnusMembershipId"), kind: str(formData, "kind"), amountRupees: amount === null ? null : Math.round(amount), receiptRef: str(formData, "receiptRef"), note: str(formData, "note"), on: str(formData, "on") })));
    return "placement.giftRecorded";
  });
}

export async function createMeetAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    await createMeet(ctx, parsed(alumniMeetSaveSchema.safeParse({ title: str(formData, "title"), on: str(formData, "on"), venue: str(formData, "venue"), note: str(formData, "note"), batchYear: num(formData, "batchYear") })));
    return "placement.meetCreated";
  });
}
