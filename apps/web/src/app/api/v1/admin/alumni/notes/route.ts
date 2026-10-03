import { alumniNoteSendSchema, alumniNoteSentSchema } from "@edulink/contracts";
import { sendAlumniNote } from "@/lib/alumni";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiRole } from "@/lib/tenancy";

/** POST /api/v1/admin/alumni/notes — a note to one batch of alumni, or to all (ten a day; audited alumni.note). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = alumniNoteSendSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(alumniNoteSentSchema.parse(await sendAlumniNote(ctx, parsed.data)), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/admin/alumni/notes");
  }
}
