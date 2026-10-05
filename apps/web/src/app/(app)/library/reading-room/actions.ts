"use server";

import { requireApiUser } from "@/lib/tenancy";
import { field, runAction } from "@/lib/module-actions";
import { scanReader } from "@/lib/reading-room";

/** The reading-room desk's one write (risks batch 5A, 5 Oct 2026): sign a reader in or out by card, student code or the row's membership. */
export async function readingRoomScanAction(form: FormData): Promise<void> {
  await runAction("/library/reading-room", async () => {
    const action = field(form, "action") === "OUT" ? "OUT" : "IN";
    const membershipId = field(form, "membershipId");
    const r = await scanReader(await requireApiUser(), { action, ...(membershipId ? { membershipId } : { code: field(form, "code") }) });
    if (action === "IN") return r.changed ? "readingRoom.signedIn" : "readingRoom.alreadyIn";
    return "readingRoom.signedOut";
  });
}
