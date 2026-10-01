import { coverAnsweredSchema, coverDeclineSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { declineCover } from "@/lib/substitutions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/teaching/covers/{id}/decline {reason} — the covering teacher cannot take it; the office and the head are told. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN", "PRINCIPAL");
    const { id } = await params;
    const parsed = coverDeclineSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(coverAnsweredSchema.parse(await declineCover(ctx, id, parsed.data.reason)));
  } catch (error) {
    return apiFailure(error, "api/v1/teaching/covers/decline");
  }
}
