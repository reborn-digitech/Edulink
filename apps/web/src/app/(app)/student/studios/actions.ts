"use server";

import { studioSubmissionSaveSchema } from "@edulink/contracts";
import { requireApiUser } from "@/lib/tenancy";
import { field, runAction } from "@/lib/module-actions";
import { RuleRefusal } from "@/lib/rule-refusal";
import { AttachmentError, discard, storeAttachments } from "@/lib/uploads";
import { saveStudioSubmission } from "@/lib/studio";

/**
 * A student's studio submission from the web (R-56, the studio half, 10 Oct
 * 2026): the note and one file, stored first (uploads.ts) and discarded again
 * when the record refuses it, sent or kept as a draft. Only async functions
 * are exported.
 */
export async function studioSubmissionAction(form: FormData): Promise<void> {
  await runAction("/student/studios", async () => {
    const ctx = await requireApiUser();
    const picked = form.get("file");
    let stored: { fileId: string; name: string; mime: string; size: number } | null = null;
    try {
      const files = await storeAttachments(picked instanceof File ? [picked] : [], { max: 1 });
      stored = files[0] ?? null;
    } catch (error) {
      if (error instanceof AttachmentError) throw new RuleRefusal(error.key, 422, error.vars, "file");
      throw error;
    }
    const submit = field(form, "intent") === "submit";
    try {
      const r = await saveStudioSubmission(ctx, field(form, "studioId"), studioSubmissionSaveSchema.parse({ stage: field(form, "stage"), note: field(form, "note"), fileId: null, submit }), stored);
      return r.state === "DRAFT" ? "duties.studio.submissionSaved" : "duties.studio.submissionSent";
    } catch (error) {
      if (stored) await discard([stored.fileId]).catch(() => undefined);
      throw error;
    }
  });
}
