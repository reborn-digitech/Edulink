"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  allocationSaveSchema,
  convocationBuildSchema,
  examDocumentIssueSchema,
  examFormDecideSchema,
  examMarkCorrectSchema,
  examMarksImportSchema,
  examRoomSaveSchema,
  examScheduleSaveSchema,
  examSessionSaveSchema,
  graceDecideSchema,
  graceProposeSchema,
  invigilationAssignSchema,
  invigilationSwapSchema,
  malpracticeDecideSchema,
  malpracticeReportSchema,
  moderationNoteSchema,
  myBacklogAddSchema,
  myRevaluationAskSchema,
  paperAssignSchema,
  paperModerateSchema,
  remunerationSaveSchema,
  revaluationDecideSchema,
} from "@edulink/contracts";
import { parseRupees } from "@edulink/i18n";
import { AccessError, requireApiUser } from "@/lib/tenancy";
import { RuleRefusal } from "@/lib/rule-refusal";
import { getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import type { ActiveContext } from "@/lib/session";
import { assignInvigilator, buildSeating, createSession, decideForm, decideMalpractice, generateForms, issueHallTickets, markDutyDone, reportMalpractice, saveRemuneration, saveRoom, saveSchedule, setSessionStatus, submitForm, swapInvigilator, updateSession } from "@/lib/exam-cell";
import { addModerationNote, correctMark, decideGrace, enterMarks, importMarks, proposeGrace, publishRun, runResults } from "@/lib/exam-cell-marks";
import { addBacklog, askRevaluation, assignPaper, buildConvocation, buildPrintingLists, decideRevaluation, issueDocument, moderatePaper, pushCredits, returnAllocation, saveAllocation, saveControllerSignature, submitPaper } from "@/lib/exam-cell-after";

/**
 * The exam cell's forms (module EXAMS, 4 Oct 2026): every one posts here with
 * a `back` path — the page it came from — and returns there with ?ok= or
 * ?error= carrying a sentence in the reader's language. Who may do what is
 * decided in src/lib/exam-cell*.ts, as it is for the /api/v1 doors, so the
 * page and the phone are held to the same rules.
 */

const BACK = /^\/(exam-cell|student\/exams|faculty\/exams|parent\/results)(\/[\w-]*)*$/;

function backOf(formData: FormData): string {
  const raw = String(formData.get("back") ?? "");
  const [path, query = ""] = raw.split("?");
  if (!path || !BACK.test(path)) return "/exam-cell";
  const keep = new URLSearchParams(query);
  keep.delete("ok");
  keep.delete("error");
  const q = keep.toString();
  return q ? `${path}?${q}` : path;
}

const withMessage = (back: string, key: "ok" | "error", text: string) => `${back}${back.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(text)}`;
const str = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();
const num = (formData: FormData, name: string) => {
  const v = str(formData, name);
  return v === "" ? NaN : Number(v);
};
const rupees = (formData: FormData, name: string) => {
  const v = str(formData, name);
  return v === "" ? 0 : (parseRupees(v) ?? NaN);
};
/** A datetime-local field (the college's clock, IST) as an ISO instant. */
const instant = (formData: FormData, name: string) => {
  const v = str(formData, name);
  if (!v) return null;
  const d = new Date(`${v}${v.length === 16 ? ":00" : ""}+05:30`);
  return Number.isNaN(d.getTime()) ? "bad" : d.toISOString();
};

type Done = TranslationKey | { key: TranslationKey; vars: Record<string, string | number> } | null;
class FormError extends Error {}

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

function parsed<T>(result: { success: true; data: T } | { success: false }): T {
  if (!result.success) throw new FormError();
  return result.data;
}

function sessionInput(formData: FormData) {
  const opens = instant(formData, "formOpensAt");
  const closes = instant(formData, "formClosesAt");
  if (opens === "bad" || closes === "bad") throw new FormError();
  const slabs = [1, 2, 3]
    .map((i) => ({ fromDateKey: str(formData, `slabFrom${i}`), paise: rupees(formData, `slabFee${i}`) }))
    .filter((s) => s.fromDateKey !== "");
  return parsed(
    examSessionSaveSchema.safeParse({
      name: str(formData, "name"),
      kind: str(formData, "kind") || "REGULAR",
      termId: str(formData, "termId"),
      formOpensAt: opens,
      formClosesAt: closes,
      feePerCoursePaise: rupees(formData, "feePerCourse"),
      feePerBacklogPaise: rupees(formData, "feePerBacklog"),
      photocopyFeePaise: rupees(formData, "photocopyFee"),
      revalFeePaise: rupees(formData, "revalFee"),
      lateFeeSlabs: slabs,
      feeHeadId: str(formData, "feeHeadId") || null,
    }),
  );
}

/* --------------------------------------------------------------- sessions */

export async function createSessionAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    const input = sessionInput(formData);
    await createSession(ctx, input);
    return { key: "examCell.sessionCreated", vars: { name: input.name } };
  });
}

export async function updateSessionAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    await updateSession(ctx, str(formData, "sessionId"), sessionInput(formData));
    return "examCell.sessionSaved";
  });
}

export async function sessionStatusAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    const status = str(formData, "status");
    if (status !== "FORMS" && status !== "CONDUCT" && status !== "ASSESSMENT" && status !== "CLOSED") throw new FormError();
    await setSessionStatus(ctx, str(formData, "sessionId"), status);
    return "examCell.statusMoved";
  });
}

export async function generateFormsAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    const r = await generateForms(ctx, str(formData, "sessionId"));
    return { key: "examCell.formsGenerated", vars: { count: r.count ?? 0 } };
  });
}

export async function submitFormAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    await submitForm(ctx, str(formData, "formId"));
    return "examCell.formSubmitted";
  });
}

export async function decideFormAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    const approve = str(formData, "approve") === "1";
    const input = parsed(examFormDecideSchema.safeParse({ approve, waiveFee: str(formData, "waiveFee") === "1", reason: str(formData, "reason") || undefined }));
    await decideForm(ctx, str(formData, "formId"), input);
    return approve ? "examCell.formApproved" : "examCell.formRefused";
  });
}

/* -------------------------------------------------------------- logistics */

export async function saveScheduleAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    const at = instant(formData, "at");
    if (!at || at === "bad") throw new FormError();
    await saveSchedule(ctx, str(formData, "sessionId"), parsed(examScheduleSaveSchema.safeParse({ courseId: str(formData, "courseId"), at, durationMin: num(formData, "durationMin") || 180 })));
    return "examCell.scheduleSaved";
  });
}

export async function saveRoomAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    await saveRoom(ctx, str(formData, "sessionId"), parsed(examRoomSaveSchema.safeParse({ scheduleId: str(formData, "scheduleId"), name: str(formData, "name"), capacity: num(formData, "capacity") })));
    return "examCell.roomSaved";
  });
}

export async function buildSeatingAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    const r = await buildSeating(ctx, str(formData, "sessionId"), str(formData, "scheduleId") || undefined);
    return r.count ? { key: "examCell.seatingLeft", vars: { count: r.count } } : "examCell.seatingBuilt";
  });
}

export async function issueTicketsAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    const r = await issueHallTickets(ctx, str(formData, "sessionId"));
    return { key: "examCell.ticketsIssued", vars: { count: r.count ?? 0 } };
  });
}

export async function assignInvigilatorAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    await assignInvigilator(ctx, str(formData, "sessionId"), parsed(invigilationAssignSchema.safeParse({ examRoomId: str(formData, "examRoomId"), staffMembershipId: str(formData, "staffMembershipId") })));
    return "examCell.dutyAssigned";
  });
}

export async function swapInvigilatorAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    await swapInvigilator(ctx, str(formData, "invigilationId"), parsed(invigilationSwapSchema.safeParse({ staffMembershipId: str(formData, "staffMembershipId"), note: str(formData, "note") })));
    return "examCell.dutySwapped";
  });
}

export async function dutyDoneAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    await markDutyDone(ctx, str(formData, "invigilationId"));
    return "examCell.dutyDone";
  });
}

export async function reportMalpracticeAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    await reportMalpractice(ctx, str(formData, "sessionId"), parsed(malpracticeReportSchema.safeParse({ scheduleId: str(formData, "scheduleId"), studentMembershipId: str(formData, "studentMembershipId"), note: str(formData, "note") })));
    return "examCell.malpracticeReported";
  });
}

export async function decideMalpracticeAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    await decideMalpractice(ctx, str(formData, "malpracticeId"), parsed(malpracticeDecideSchema.safeParse({ decision: str(formData, "decision"), note: str(formData, "note") })));
    return "examCell.malpracticeDecided";
  });
}

export async function saveRemunerationAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    await saveRemuneration(ctx, str(formData, "sessionId"), parsed(remunerationSaveSchema.safeParse({ staffMembershipId: str(formData, "staffMembershipId"), kind: str(formData, "kind"), count: num(formData, "count"), ratePaise: rupees(formData, "rate") })));
    return "examCell.remunerationSaved";
  });
}

/* ------------------------------------------------------------------ marks */

export async function enterMarksAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    const ids = formData.getAll("studentMembershipId").map(String);
    const entries = ids
      .map((id) => {
        const raw = str(formData, `marks_${id}`).toUpperCase();
        if (raw === "") return null;
        if (raw === "AB") return { studentMembershipId: id, marks: null, absent: true };
        return { studentMembershipId: id, marks: Number(raw), absent: false };
      })
      .filter((e): e is { studentMembershipId: string; marks: number | null; absent: boolean } => e !== null);
    if (entries.length === 0) throw new FormError();
    const r = await enterMarks(ctx, str(formData, "sessionId"), { courseId: str(formData, "courseId"), entries: entries.map((e) => ({ ...e, marks: e.marks !== null && Number.isNaN(e.marks) ? -1 : e.marks })) });
    return { key: "examCell.marksEntered", vars: { matched: r.matched, mismatched: r.mismatched, pending: r.pending } };
  });
}

export async function importMarksAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    const input = parsed(examMarksImportSchema.safeParse({ text: str(formData, "text") }));
    const r = await importMarks(ctx, str(formData, "sessionId"), input.text);
    return { key: "examCell.importDone", vars: { created: r.created, updated: r.updated, unchanged: r.unchanged, unmatched: r.unmatched.length } };
  });
}

export async function correctMarkAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    const raw = str(formData, "marks").toUpperCase();
    await correctMark(ctx, str(formData, "sessionId"), parsed(examMarkCorrectSchema.safeParse({ courseId: str(formData, "courseId"), studentMembershipId: str(formData, "studentMembershipId"), marks: raw === "AB" ? null : Number(raw), absent: raw === "AB", reason: str(formData, "reason") })));
    return "examCell.markCorrected";
  });
}

export async function proposeGraceAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    await proposeGrace(ctx, str(formData, "sessionId"), parsed(graceProposeSchema.safeParse({ courseId: str(formData, "courseId"), studentMembershipId: str(formData, "studentMembershipId"), marks: num(formData, "marks"), rule: str(formData, "rule") || "TO_PASS", reason: str(formData, "reason") })));
    return "examCell.graceProposed";
  });
}

export async function decideGraceAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    const approve = str(formData, "approve") === "1";
    await decideGrace(ctx, str(formData, "graceId"), parsed(graceDecideSchema.safeParse({ approve, note: str(formData, "note") || undefined })));
    return approve ? "examCell.graceApproved" : "examCell.graceRefused";
  });
}

export async function moderationNoteAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    await addModerationNote(ctx, str(formData, "sessionId"), parsed(moderationNoteSchema.safeParse({ courseId: str(formData, "courseId") || null, note: str(formData, "note") })));
    return "examCell.noteSaved";
  });
}

export async function runResultsAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    const r = await runResults(ctx, str(formData, "sessionId"), str(formData, "reason") || undefined);
    return { key: "examCell.runDone", vars: { count: r.count ?? 0 } };
  });
}

export async function publishRunAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    await publishRun(ctx, str(formData, "sessionId"), str(formData, "runId"));
    return "examCell.runPublished";
  });
}

/* ---------------------------------------------------------- after results */

export async function decideRevaluationAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    const marks = str(formData, "marks");
    await decideRevaluation(ctx, str(formData, "revaluationId"), parsed(revaluationDecideSchema.safeParse({ outcome: str(formData, "outcome"), marks: marks ? Number(marks) : null, note: str(formData, "note") || undefined })));
    return "examCell.revalDecided";
  });
}

export async function issueDocumentAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    await issueDocument(ctx, parsed(examDocumentIssueSchema.safeParse({ kind: str(formData, "kind"), studentMembershipId: str(formData, "studentMembershipId") })));
    return "examCell.documentIssued";
  });
}

export async function pushCreditsAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    const r = await pushCredits(ctx);
    return { key: "examCell.creditsSent", vars: { count: r.count ?? 0 } };
  });
}

export async function convocationAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    const input = parsed(convocationBuildSchema.safeParse({ year: num(formData, "year"), finalize: str(formData, "finalize") === "1" }));
    const r = await buildConvocation(ctx, input);
    return { key: "examCell.convocationBuilt", vars: { count: r.count ?? 0 } };
  });
}

export async function signatureAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    const file = formData.get("image");
    if (!(file instanceof File) || file.size === 0 || file.type !== "image/png") throw new FormError();
    const url = `data:image/png;base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`;
    await saveControllerSignature(ctx, url);
    return "examCell.signatureSaved";
  });
}

/* ---------------------------------------------------------------- conduct */

export async function assignPaperAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    await assignPaper(ctx, str(formData, "sessionId"), parsed(paperAssignSchema.safeParse({ scheduleId: str(formData, "scheduleId"), setterMembershipId: str(formData, "setterMembershipId") })));
    return "examCell.paperAssigned";
  });
}

export async function moderatePaperAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    await moderatePaper(ctx, str(formData, "paperId"), parsed(paperModerateSchema.safeParse({ note: str(formData, "note") })).note);
    return "examCell.paperModerated";
  });
}

export async function printingAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    await buildPrintingLists(ctx, str(formData, "sessionId"), Math.max(0, Math.min(50, num(formData, "spare") || 0)));
    return "examCell.printingBuilt";
  });
}

export async function allocationAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    await saveAllocation(ctx, str(formData, "sessionId"), parsed(allocationSaveSchema.safeParse({ scheduleId: str(formData, "scheduleId"), assessorMembershipId: str(formData, "assessorMembershipId"), bundle: str(formData, "bundle"), count: num(formData, "count") })));
    return "examCell.bundleAllotted";
  });
}

export async function returnAllocationAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    await returnAllocation(ctx, str(formData, "allocationId"));
    return "examCell.bundleReturned";
  });
}

/** The setter's paper from the duties page: a PDF chosen there and the outcome map as "Q1 CO1 10" lines. */
export async function submitPaperAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) throw new FormError();
    const coMap = str(formData, "coMap")
      .split(/\r?\n/)
      .map((l) => l.trim().split(/[\s,]+/))
      .filter((p) => p.length >= 3)
      .map(([question, co, marks]) => ({ question: question!, co: co!, marks: Number(marks) }));
    await submitPaper(ctx, str(formData, "paperId"), { fileName: file.name.slice(0, 120), mime: "application/pdf", dataBase64: Buffer.from(await file.arrayBuffer()).toString("base64"), coMap });
    return "examCell.paperSubmitted";
  });
}

/* ------------------------------------------------------- the student's own */

export async function askRevaluationAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    await askRevaluation(ctx, parsed(myRevaluationAskSchema.safeParse({ sessionId: str(formData, "sessionId"), courseId: str(formData, "courseId"), kind: str(formData, "kind") })));
    return "examCell.revalAsked";
  });
}

export async function addBacklogAction(formData: FormData): Promise<void> {
  await run(formData, async (ctx) => {
    await addBacklog(ctx, parsed(myBacklogAddSchema.safeParse({ sessionId: str(formData, "sessionId"), courseId: str(formData, "courseId") })));
    return "examCell.backlogAdded";
  });
}
