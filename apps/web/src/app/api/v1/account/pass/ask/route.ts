import { passAskBodySchema, passAskedSchema } from "@edulink/contracts";
import { askGuardianForPass } from "@/lib/pass-orders";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requirePassRole } from "../guard";

/** POST /api/v1/account/pass/ask — a pupil under eighteen asks their guardians for the Student plan; each told in the app, once a day at most (17 Oct 2026). */
export async function POST(request: Request) {
  try {
    const ctx = await requirePassRole("STUDENT");
    const parsed = passAskBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(passAskedSchema.parse(await askGuardianForPass(ctx, parsed.data.plan)));
  } catch (error) {
    return apiFailure(error, "api/v1/account/pass/ask");
  }
}
