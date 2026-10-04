import { accountPostOptionsSchema } from "@edulink/contracts";
import { bulletinComposeOptions } from "@/lib/account";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/account/post-options — what the composer may offer: the classes, the grades, whether "whole school" is mine. createPost still decides what lands. A college's six staff roles post as a teacher does (4 Oct 2026). */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL", "TEACHER", "STUDENT", "FACULTY", "HOD", "EXAM_CONTROLLER", "IQAC", "TPO", "ACCOUNTS");
    return ok(accountPostOptionsSchema.parse(await bulletinComposeOptions(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/account/post-options");
  }
}
