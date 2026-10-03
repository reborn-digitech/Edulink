import { libraryNoticesResultSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { sendOverdueNotices } from "@/lib/library";
import { apiFailure, ok } from "@/lib/api-v1";

/** POST /api/v1/library/overdue/notices — Tell each overdue borrower and a pupil's guardians, once a day. */
export async function POST() {
  try {
    const ctx = await requireApiRoles("LIBRARIAN", "ADMIN");
    return ok(libraryNoticesResultSchema.parse(await sendOverdueNotices(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/library/overdue/notices");
  }
}
