import { officeCsvBodySchema, officeInvitePreviewSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { parseInviteCsv } from "@/lib/csv";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/**
 * POST /api/v1/office/invites/preview — what a pasted list would invite,
 * before anything is sent. The same parser the invite form previews with and
 * the send re-runs, so the phone shows what will happen. Writes nothing.
 */
export async function POST(request: Request) {
  try {
    await requireApiRole("ADMIN");
    const parsed = officeCsvBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const { valid, problems } = parseInviteCsv(parsed.data.csv.trim());
    return ok(officeInvitePreviewSchema.parse({ valid: valid.map((r) => ({ line: r.line, name: r.name, email: r.email, subjects: r.subjects })), problems }));
  } catch (error) {
    return apiFailure(error, "api/v1/office/invites/preview");
  }
}
