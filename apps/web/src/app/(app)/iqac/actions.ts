"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  actionTakenSaveSchema,
  activitySaveSchema,
  collegeFilingGenerateSchema,
  committeeMeetingSaveSchema,
  committeeSaveSchema,
  facultyRecordSaveSchema,
  grievanceActionSchema,
  grievanceFileSchema,
  iqacCycleCreateSchema,
  iqacInputsSaveSchema,
  iqacScoreSchema,
  researchItemSaveSchema,
  surveySaveSchema,
  IQAC_ENTERED_INPUTS,
} from "@edulink/contracts";
import { AccessError, requireApiUser } from "@/lib/tenancy";
import { RuleRefusal } from "@/lib/rule-refusal";
import { getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import type { ActiveContext } from "@/lib/session";
import { AttachmentError, discard, storeAttachments } from "@/lib/uploads";
import { db } from "@/lib/db";
import { makeSurveyLink,
  actOnGrievance,
  addActivity,
  addMeeting,
  addResearchItem,
  answerSurvey,
  closeCycle,
  closeSurvey,
  createSurvey,
  escalateMyGrievance,
  fileGrievance,
  openCycle,
  recomputeCycle,
  registerStoredFile,
  removeResearchItem,
  saveActionTaken,
  saveCommittee,
  saveEnteredInputs,
  saveFacultyRecord,
  scoreQualitative,
  transcribeResponse,
} from "@/lib/iqac";
import { generateFiling, markFiled, setDisclosure, signOffFiling, submitFiling } from "@/lib/iqac-filings";

/**
 * The IQAC module's forms (4 Oct 2026): every one posts here with `back`, the
 * page it came from, and returns there with ?ok= or ?error= in the reader's
 * language. Who may do what is decided in lib/iqac.ts and lib/iqac-filings.ts,
 * exactly as for the /api/v1 doors. A form's document is stored first and
 * registered as the college's (IqacFile), and thrown away again if the write
 * is refused.
 */

const BACK = /^\/(iqac|admin\/committees|admin\/faculty-records|faculty\/research|hod\/research|student\/voice|alumni\/survey|principal\/accreditation)(\/[\w.-]*)*$/;

function backOf(formData: FormData): string {
  const raw = String(formData.get("back") ?? "");
  const [path, query = ""] = raw.split("?");
  if (!path || !BACK.test(path)) return "/iqac";
  const keep = new URLSearchParams(query);
  keep.delete("ok");
  keep.delete("error");
  const q = keep.toString();
  return q ? `${path}?${q}` : path;
}

const withMessage = (back: string, key: "ok" | "error", text: string) => `${back}${back.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(text)}`;
const str = (f: FormData, name: string) => String(f.get(name) ?? "").trim();
const numOrNull = (f: FormData, name: string) => {
  const v = str(f, name);
  return v === "" ? null : Number(v);
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
    if (error instanceof AccessError || error instanceof RuleRefusal || error instanceof AttachmentError) redirect(withMessage(back, "error", t(error.key as TranslationKey, (error as { vars?: Record<string, string | number> }).vars)));
    if (error instanceof FormError) redirect(withMessage(back, "error", t("common.checkTheForm")));
    throw error;
  }
  revalidatePath(back.split("?")[0]!);
  if (!done) redirect(back);
  redirect(withMessage(back, "ok", typeof done === "string" ? t(done) : t(done.key, done.vars)));
}

/** The form's file (field `file`), stored and registered as the college's; null when none was chosen. */
async function withFile<T>(ctx: ActiveContext, formData: FormData, purpose: string, title: string, work: (fileId: string | null) => Promise<T>): Promise<T> {
  const file = formData.get("file");
  const stored = file instanceof File && file.size > 0 ? await storeAttachments([file], { max: 1 }) : [];
  const fileId = stored[0]?.fileId ?? null;
  try {
    if (fileId) await registerStoredFile(ctx, fileId, purpose, title || (file instanceof File ? file.name : purpose));
    return await work(fileId);
  } catch (error) {
    if (fileId) {
      await db.iqacFile.deleteMany({ where: { fileId } });
      await discard([fileId]);
    }
    throw error;
  }
}

/** Answers come as fields q_<CODE>. */
function answersOf(formData: FormData): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of formData.entries()) if (k.startsWith("q_") && typeof v === "string" && v !== "") out[k.slice(2)] = Number(v);
  return out;
}

/* Cycles and the predictor ------------------------------------------------- */

export async function openCycleAction(formData: FormData) {
  await run(formData, async (ctx) => {
    await openCycle(ctx, parsed(iqacCycleCreateSchema.safeParse({ windowFrom: str(formData, "windowFrom"), windowTo: str(formData, "windowTo") })));
    return "iqac.openedCycle";
  });
}
export async function recomputeAction(formData: FormData) {
  await run(formData, async (ctx) => {
    await recomputeCycle(ctx, str(formData, "cycleId"));
    return "iqac.recomputed";
  });
}
export async function closeCycleAction(formData: FormData) {
  await run(formData, async (ctx) => {
    await closeCycle(ctx, str(formData, "cycleId"));
    return "iqac.closedCycle";
  });
}
export async function scoreMetricAction(formData: FormData) {
  await run(formData, async (ctx) => {
    const row = str(formData, "evidenceRow");
    const [type, id] = row ? row.split(":") : [];
    return withFile(ctx, formData, "EVIDENCE", str(formData, "metricCode"), async (fileId) => {
      const input = parsed(iqacScoreSchema.safeParse({ score: Number(str(formData, "score")), note: str(formData, "note"), fileIds: fileId ? [fileId] : [], evidence: type && id ? [{ type, id }] : [] }));
      await scoreQualitative(ctx, str(formData, "cycleId"), str(formData, "metricCode"), input);
      return "iqac.scored" as const;
    });
  });
}
export async function saveInputsAction(formData: FormData) {
  await run(formData, async (ctx) => {
    const values = IQAC_ENTERED_INPUTS.filter((k) => formData.has(`in_${k}`)).map((k) => ({ key: k, value: numOrNull(formData, `in_${k}`) }));
    return withFile(ctx, formData, "EVIDENCE", "inputs", async (fileId) => {
      await saveEnteredInputs(ctx, str(formData, "cycleId"), parsed(iqacInputsSaveSchema.safeParse({ values, fileIds: fileId ? [fileId] : [] })));
      return "iqac.enteredSaved" as const;
    });
  });
}

/* Filings ------------------------------------------------------------------- */

export async function generateFilingAction(formData: FormData) {
  await run(formData, async (ctx) => {
    // `departmentId`: an NBA SAR's engineering department (5 Oct 2026); every other kind ignores it.
    await generateFiling(ctx, parsed(collegeFilingGenerateSchema.safeParse({ kind: str(formData, "kind"), year: Number(str(formData, "year")), cycleId: str(formData, "cycleId") || null, departmentId: str(formData, "departmentId") || null, again: str(formData, "again") === "1" })));
    return "iqac.generated";
  });
}
export async function submitFilingAction(formData: FormData) {
  await run(formData, async (ctx) => {
    await submitFiling(ctx, str(formData, "filingId"));
    return "iqac.submitted";
  });
}
export async function filedAction(formData: FormData) {
  await run(formData, async (ctx) =>
    withFile(ctx, formData, "ACKNOWLEDGEMENT", "acknowledgement", async (fileId) => {
      await markFiled(ctx, str(formData, "filingId"), fileId);
      return "iqac.filedOk" as const;
    }),
  );
}
export async function signoffAction(formData: FormData) {
  await run(formData, async (ctx) => {
    const decision = str(formData, "decision") === "RETURN" ? "RETURN" : "SIGN";
    await signOffFiling(ctx, str(formData, "filingId"), { decision, note: str(formData, "note") });
    return decision === "SIGN" ? "iqac.signedOk" : "iqac.returnedOk";
  });
}
export async function disclosureAction(formData: FormData) {
  await run(formData, async (ctx) => {
    const publish = str(formData, "publish") === "1";
    await setDisclosure(ctx, publish);
    return publish ? "iqac.publishedOk" : "iqac.unpublishedOk";
  });
}

/* Surveys -------------------------------------------------------------------- */

export async function createSurveyAction(formData: FormData) {
  await run(formData, async (ctx) => {
    await createSurvey(ctx, parsed(surveySaveSchema.safeParse({ kind: str(formData, "kind"), title: str(formData, "title"), opensOn: str(formData, "opensOn"), closesOn: str(formData, "closesOn"), offeringId: str(formData, "offeringId") || null })));
    return "iqac.created";
  });
}
export async function closeSurveyAction(formData: FormData) {
  await run(formData, async (ctx) => {
    await closeSurvey(ctx, str(formData, "surveyId"));
    return "iqac.closed";
  });
}
export async function atrAction(formData: FormData) {
  await run(formData, async (ctx) =>
    withFile(ctx, formData, "ATR", "atr", async (fileId) => {
      await saveActionTaken(ctx, str(formData, "surveyId"), parsed(actionTakenSaveSchema.safeParse({ text: str(formData, "text"), fileId, publish: formData.get("publish") === "on" })));
      return "iqac.atrSaved" as const;
    }),
  );
}
/** G-5: one signed link for one respondent of an employer's or a parent's survey, shown back to the desk to send. */
export async function surveyLinkAction(formData: FormData) {
  await run(formData, async (ctx) => {
    const link = await makeSurveyLink(ctx, str(formData, "surveyId"));
    const origin = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") || "";
    return { key: "iqac.linkMade" as const, vars: { url: `${origin}${link.path}` } };
  });
}

export async function transcribeAction(formData: FormData) {
  await run(formData, async (ctx) => {
    await transcribeResponse(ctx, str(formData, "surveyId"), { answers: answersOf(formData), source: str(formData, "source") });
    return "iqac.transcribed";
  });
}
export async function answerSurveyAction(formData: FormData) {
  await run(formData, async (ctx) => {
    await answerSurvey(ctx, str(formData, "surveyId"), answersOf(formData));
    return "iqac.answered";
  });
}

/* Registers ------------------------------------------------------------------- */

export async function addResearchAction(formData: FormData) {
  await run(formData, async (ctx) =>
    withFile(ctx, formData, "RESEARCH", str(formData, "title"), async (fileId) => {
      const amount = numOrNull(formData, "amountLakhs");
      await addResearchItem(ctx, parsed(researchItemSaveSchema.safeParse({ kind: str(formData, "kind"), title: str(formData, "title"), indexing: str(formData, "indexing") || "NONE", year: Number(str(formData, "year")), amountLakhs: amount, facultyMembershipId: str(formData, "facultyMembershipId") || null, fileId })));
      return "iqac.researchAdded" as const;
    }),
  );
}
export async function removeResearchAction(formData: FormData) {
  await run(formData, async (ctx) => {
    await removeResearchItem(ctx, str(formData, "itemId"));
    return "iqac.removed";
  });
}
export async function addActivityAction(formData: FormData) {
  await run(formData, async (ctx) =>
    withFile(ctx, formData, "ACTIVITY", str(formData, "title"), async (fileId) => {
      const staff = formData.getAll("staff").map(String).filter(Boolean);
      await addActivity(ctx, parsed(activitySaveSchema.safeParse({ kind: str(formData, "kind"), title: str(formData, "title"), at: str(formData, "at"), participants: Number(str(formData, "participants") || "0"), participantMembershipIds: staff, theme: str(formData, "theme") || null, fileId })));
      return "iqac.activityAdded" as const;
    }),
  );
}

/* Committees ------------------------------------------------------------------ */

export async function saveCommitteeAction(formData: FormData) {
  await run(formData, async (ctx) => {
    const members = str(formData, "members")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const [name, ...role] = l.split(",");
        return { name: name!.trim(), role: role.join(",").trim(), membershipId: null };
      });
    await saveCommittee(ctx, parsed(committeeSaveSchema.safeParse({ kind: str(formData, "kind"), name: str(formData, "name"), members })));
    return "iqac.savedCommittee";
  });
}
export async function addMeetingAction(formData: FormData) {
  await run(formData, async (ctx) =>
    withFile(ctx, formData, "MINUTES", `minutes ${str(formData, "at")}`, async (fileId) => {
      await addMeeting(ctx, str(formData, "committeeId"), parsed(committeeMeetingSaveSchema.safeParse({ at: str(formData, "at"), minutesFileId: fileId, actionTaken: str(formData, "actionTaken") })));
      return "iqac.meetingAdded" as const;
    }),
  );
}

/* Grievances ------------------------------------------------------------------- */

export async function fileGrievanceAction(formData: FormData) {
  await run(formData, async (ctx) =>
    withFile(ctx, formData, "GRIEVANCE", str(formData, "kind"), async (fileId) => {
      await fileGrievance(ctx, parsed(grievanceFileSchema.safeParse({ kind: str(formData, "kind"), text: str(formData, "text"), fileId, anonymousToStaff: formData.get("anonymousToStaff") === "on" })));
      return "iqac.filedSimple" as const;
    }),
  );
}
export async function escalateGrievanceAction(formData: FormData) {
  await run(formData, async (ctx) => {
    const note = str(formData, "note");
    if (note.length < 2) throw new FormError();
    await escalateMyGrievance(ctx, str(formData, "grievanceId"), note);
    return "iqac.escalated";
  });
}
export async function actGrievanceAction(formData: FormData) {
  await run(formData, async (ctx) => {
    await actOnGrievance(ctx, str(formData, "grievanceId"), parsed(grievanceActionSchema.safeParse({ action: str(formData, "action"), note: str(formData, "note") })));
    return "iqac.acted";
  });
}

/* Faculty records -------------------------------------------------------------- */

export async function saveFacultyRecordAction(formData: FormData) {
  await run(formData, async (ctx) => {
    const pan = str(formData, "pan").toUpperCase();
    await saveFacultyRecord(
      ctx,
      parsed(
        facultyRecordSaveSchema.safeParse({
          membershipId: str(formData, "membershipId"),
          designation: str(formData, "designation"),
          appointment: str(formData, "appointment"),
          highestQualification: str(formData, "highestQualification"),
          netSetQualified: formData.get("netSetQualified") === "on",
          experienceBeforeYears: Number(str(formData, "experienceBeforeYears") || "0"),
          joinedOn: str(formData, "joinedOn") || null,
          departmentId: str(formData, "departmentId") || null,
          apaarFacultyId: str(formData, "apaarFacultyId") || null,
          ...(pan ? { pan } : {}),
          apiScoreInputs: { teaching: Number(str(formData, "apiTeaching") || "0"), research: Number(str(formData, "apiResearch") || "0"), service: Number(str(formData, "apiService") || "0") },
        }),
      ),
    );
    return "iqac.recordSaved";
  });
}
