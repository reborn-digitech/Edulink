import { coverAnsweredSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { acknowledgeCover } from "@/lib/substitutions";
import { apiFailure, ok } from "@/lib/api-v1";

/** POST /api/v1/teaching/covers/{id}/acknowledge — the covering teacher has seen the cover and will take it; twice is a no-op. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN", "PRINCIPAL");
    const { id } = await params;
    return ok(coverAnsweredSchema.parse(await acknowledgeCover(ctx, id)));
  } catch (error) {
    return apiFailure(error, "api/v1/teaching/covers/acknowledge");
  }
}
