import { officeDismissBodySchema, okSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { dismissReports } from "@/lib/safety";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/office/safety/dismiss — "nothing wrong": close the open reports against something without touching it. The note is for staff only. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = officeDismissBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await dismissReports(ctx, parsed.data);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/office/safety/dismiss");
  }
}
