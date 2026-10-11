import { modelServersSchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { deskServers } from "@/lib/quiz-jobs-desk";
import { ok } from "@/lib/api-v1";
import { jobFailure } from "../_shared";

/** GET /api/v1/appadmin/quiz-jobs/servers — the two model servers, Running, Starting or Stopped, with the model and the port. */
export async function GET() {
  try {
    const ctx = await requireApiAppAdmin();
    return ok(modelServersSchema.parse({ servers: await deskServers(ctx) }));
  } catch (error) {
    return jobFailure(error, "api/v1/appadmin/quiz-jobs/servers");
  }
}
