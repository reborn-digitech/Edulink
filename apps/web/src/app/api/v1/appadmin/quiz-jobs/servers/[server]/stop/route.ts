import { modelServersSchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { deskStopServer } from "@/lib/quiz-jobs-desk";
import { ok } from "@/lib/api-v1";
import { jobFailure, serverParam } from "../../../_shared";

/** POST /api/v1/appadmin/quiz-jobs/servers/{server}/stop — one model server stopped through scripts/model-serve.sh; 409 while a run is active. */
export async function POST(_request: Request, { params }: { params: Promise<{ server: string }> }) {
  try {
    const ctx = await requireApiAppAdmin();
    const server = serverParam((await params).server);
    return ok(modelServersSchema.parse({ servers: await deskStopServer(ctx, server) }));
  } catch (error) {
    return jobFailure(error, "api/v1/appadmin/quiz-jobs/servers/[server]/stop");
  }
}
