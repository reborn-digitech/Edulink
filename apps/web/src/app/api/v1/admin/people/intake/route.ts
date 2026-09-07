import { intakeBodySchema, intakeResultSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";
import { runIntake } from "@/app/(app)/admin/intake/actions";

/**
 * POST /api/v1/admin/people/intake — admit pupils from a pasted CSV. The
 * server re-parses the text, the same as the form: the caller sees what
 * will happen, the server decides what does. First sign-in codes are in
 * the answer and nowhere else.
 */
export async function POST(request: Request) {
  try {
    await requireApiRole("ADMIN");
    const parsed = intakeBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const state = await runIntake(parsed.data);
    if (!state.ok || !state.result) return apiRefused({ errorKey: state.errorKey, errorVars: state.errorVars, error: state.error });
    return ok(intakeResultSchema.parse({ ...state.result, problems: state.problems }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/people/intake");
  }
}
