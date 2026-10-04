"use server";

import { condonationAskSchema, registrationSaveSchema } from "@edulink/contracts";
import { requireApiUser } from "@/lib/tenancy";
import { field, runAction } from "@/lib/module-actions";
import { saveRegistration } from "@/lib/academics-registration";
import { askCondonation } from "@/lib/academics-attendance";
import { discard, storeAttachments } from "@/lib/uploads";

/** A student's academics writes (4 October 2026): their registration and a condonation ask. Only async functions are exported. */
export async function registerAction(form: FormData): Promise<void> {
  await runAction("/student/registration", async () => {
    await saveRegistration(await requireApiUser(), registrationSaveSchema.parse({ termId: field(form, "termId"), offeringIds: form.getAll("offeringId").map(String) }));
    return "academics.registered";
  });
}

/** A condonation ask with its ground and, when picked, a document (stored here, removed again if the ask is refused). */
export async function askCondonationAction(form: FormData): Promise<void> {
  await runAction("/student/academics", async () => {
    const ctx = await requireApiUser();
    const input = condonationAskSchema.parse({ termId: field(form, "termId"), offeringId: field(form, "offeringId") || null, ground: field(form, "ground"), note: field(form, "note"), documentFileId: null });
    const files = form.getAll("document").filter((f): f is File => f instanceof File && f.size > 0);
    const stored = files.length ? await storeAttachments(files, { max: 1 }) : [];
    try {
      await askCondonation(ctx, input, { fileId: stored[0]?.fileId ?? null });
    } catch (e) {
      await discard(stored.map((s) => s.fileId));
      throw e;
    }
    return "academics.condonationAsked";
  });
}
