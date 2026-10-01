import { familyHealthQuerySchema, familyHealthSaveSchema, healthCardSchema } from "@edulink/contracts";
import { requireApiParent, requireApiReader, selectChild } from "@/lib/api-reads/family";
import { healthCardFor, saveHealthCard } from "@/lib/health";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/family/health?childId= — the child's health and emergency card as the guardian sees it; a pupil's own, read-only, from the age the school sets (self-read.ts decides, in healthCardFor). */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiReader();
    const parsed = familyHealthQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const selectedId = ctx.role === "STUDENT" ? ctx.membershipId! : (await selectChild(ctx, parsed.data.childId)).selectedId;
    return ok(healthCardSchema.parse(await healthCardFor(ctx, selectedId)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/health");
  }
}

/** POST /api/v1/family/health — a guardian writes the whole card for one child. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiParent();
    const parsed = familyHealthSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const { childId, ...card } = parsed.data;
    const { selectedId } = await selectChild(ctx, childId);
    return ok(healthCardSchema.parse(await saveHealthCard(ctx, selectedId, card)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/health");
  }
}
