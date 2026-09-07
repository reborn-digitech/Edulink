import { examSlotCreateBodySchema, okSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { addSlot } from "@/lib/exams";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/admin/exams/{seriesId}/slots — add a paper to a series. A closed day is refused unless the office insists. */
export async function POST(request: Request, { params }: { params: Promise<{ seriesId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { seriesId } = await params;
    const parsed = examSlotCreateBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await addSlot(ctx, seriesId, parsed.data);
    return ok(okSchema.parse({ ok: true }), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/admin/exams/[seriesId]/slots");
  }
}
