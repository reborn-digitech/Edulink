import { accountPostOptionsSchema } from "@edulink/contracts";
import { bulletinComposeOptions } from "@/lib/account";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/account/post-options — what the composer may offer: the classes, the grades, whether "whole school" is mine. createPost still decides what lands. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL", "TEACHER", "STUDENT");
    return ok(accountPostOptionsSchema.parse(await bulletinComposeOptions(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/account/post-options");
  }
}
