"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireApiUser } from "@/lib/tenancy";
import { field, runAction } from "@/lib/module-actions";
import { RuleRefusal } from "@/lib/rule-refusal";
import { AccessError } from "@/lib/access-error";
import { postWorkToInternal, publishOfferingWork, saveOfferingWorkGrades, setOfferingWork } from "@/lib/college-homework";
import { AttachmentError, discard, storeAttachments } from "@/lib/uploads";
import { db } from "@/lib/db";
import { zonedStartOfDay } from "@/lib/dates";
import { getT } from "@/lib/i18n/server";
import type { GradeSaveState } from "../../teacher/assignments/actions";

/**
 * The college teacher's homework writes (R-48, the risks batch of 5 October
 * 2026): set a piece of work on an offering, publish a draft, save the marks
 * and post them into an internal component. Who may is the library's to say
 * (college-homework.ts). Only async functions are exported.
 */
const offeringPage = (offeringId: string) => `/faculty/work/offerings/${encodeURIComponent(offeringId)}`;
const workPage = (assignmentId: string) => `/faculty/work/${encodeURIComponent(assignmentId)}`;

/** "YYYY-MM-DDTHH:mm" in the college's own zone, as DateTimeField posts it, to an instant; "" is no date. */
async function dueInstant(raw: string, schoolId: string): Promise<string | undefined> {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/.exec(raw);
  if (!m) {
    if (raw) throw new RuleRefusal("common.checkTheForm", 422, undefined, "dueAt");
    return undefined;
  }
  const zone = (await db.school.findUnique({ where: { id: schoolId }, select: { timezone: true } }))?.timezone ?? "Asia/Kolkata";
  return new Date(zonedStartOfDay(m[1]!, zone).getTime() + (Number(m[2]) * 60 + Number(m[3])) * 60_000).toISOString();
}

export async function setWorkAction(form: FormData): Promise<void> {
  const offeringId = field(form, "offeringId");
  const file = form.get("files");
  await runAction(offeringPage(offeringId), async () => {
    const ctx = await requireApiUser();
    const points = field(form, "points");
    const parsed = z
      .object({ title: z.string().trim().min(2).max(200), body: z.string().trim().max(20_000), category: z.string().trim().max(60), points: z.number().min(0).max(10_000).optional() })
      .parse({ title: field(form, "title"), body: field(form, "body"), category: field(form, "category"), points: points === "" ? undefined : Number(points) });
    const dueAt = await dueInstant(field(form, "dueAt"), ctx.schoolId!);
    // The handout is stored only once the form has passed, and taken away again if the work is refused.
    const attachments = file instanceof File && file.size > 0 ? await storeAttachments([file]).catch((error: unknown) => {
      if (error instanceof AttachmentError) throw new RuleRefusal("collegeWork.fileRefused", 422, undefined, "files");
      throw error;
    }) : [];
    try {
      await setOfferingWork(ctx, offeringId, { ...parsed, category: parsed.category || undefined, dueAt, publish: field(form, "publish") === "true", confirmPastDue: field(form, "confirmPastDue") === "true", attachments });
    } catch (error) {
      await discard(attachments.map((a) => a.fileId));
      throw error;
    }
    return field(form, "publish") === "true" ? "collegeWork.published" : "collegeWork.drafted";
  }, ["/faculty/work"]);
}

export async function publishWorkAction(form: FormData): Promise<void> {
  const assignmentId = field(form, "assignmentId");
  await runAction(workPage(assignmentId), async () => {
    await publishOfferingWork(await requireApiUser(), assignmentId);
    return "collegeWork.published";
  }, ["/faculty/work"]);
}

export async function postInternalAction(form: FormData): Promise<void> {
  const assignmentId = field(form, "assignmentId");
  await runAction(workPage(assignmentId), async () => {
    await postWorkToInternal(await requireApiUser(), assignmentId, field(form, "componentId"));
    return "collegeWork.posted";
  });
}

const batchSchema = z.object({
  assignmentId: z.string().min(1),
  grades: z.array(z.object({ studentMembershipId: z.string().min(1), score: z.number().min(0).max(10_000).nullable(), comment: z.string().trim().max(4_000).optional() })).min(1).max(500),
});

/** The marking screen's batch save (the school's Gradebook, handed this action on /faculty/work). */
export async function saveFacultyGrades(input: unknown): Promise<GradeSaveState> {
  const t = await getT();
  const parsed = batchSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: t("teacher.marksNotNumbers") };
  try {
    const result = await saveOfferingWorkGrades(await requireApiUser(), parsed.data.assignmentId, parsed.data.grades);
    revalidatePath(workPage(parsed.data.assignmentId));
    revalidatePath("/faculty/work");
    return { ok: true, saved: result.saved, cleared: result.cleared, rejected: result.rejected };
  } catch (error) {
    if (error instanceof AccessError || error instanceof RuleRefusal) return { ok: false, error: t(error.key, error.vars) };
    console.error("[saveFacultyGrades]", error);
    return { ok: false, error: t("teacher.couldNotSaveMarks") };
  }
}
