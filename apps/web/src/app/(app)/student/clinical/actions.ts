"use server";

import { logbookEntrySaveSchema } from "@edulink/contracts";
import { requireApiUser } from "@/lib/tenancy";
import { field, intField, runAction } from "@/lib/module-actions";
import { saveLogbookEntry, submitLogbookEntry } from "@/lib/clinical";

/**
 * A student's logbook from the web (R-56, the clinical half; 10 Oct 2026): a
 * new entry (the form mints the client id the server's idempotency reads), a
 * draft or returned one corrected, and the hand-in. lib/clinical.ts decides
 * who may and what the note may carry.
 */
const PAGE = "/student/clinical";

export async function logbookEntryAction(form: FormData): Promise<void> {
  await runAction(PAGE, async () => {
    const id = field(form, "id");
    await saveLogbookEntry(await requireApiUser(), logbookEntrySaveSchema.parse({ ...(id ? { id } : {}), clientId: field(form, "clientId"), postingId: field(form, "postingId"), on: field(form, "on"), kind: field(form, "kind"), count: intField(form, "count") || 1, note: field(form, "note") }));
    return "duties.clinical.entrySaved";
  });
}

export async function logbookSubmitAction(form: FormData): Promise<void> {
  await runAction(PAGE, async () => {
    await submitLogbookEntry(await requireApiUser(), field(form, "entryId"));
    return "duties.clinical.submitted";
  });
}
