import { modelServersSchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { deskStartServer } from "@/lib/quiz-jobs-desk";
import { ok } from "@/lib/api-v1";
import { jobFailure, serverParam } from "../../../_shared";

/** POST /api/v1/appadmin/quiz-jobs/servers/{server}/start — one model server started through scripts/model-serve.sh. */
export async function POST(_request: Request, { params }: { params: Promise<{ server: string }> }) {
  try {
    const ctx = await requireApiAppAdmin();
    const server = serverParam((await params).server);
    return ok(modelServersSchema.parse({ servers: await deskStartServer(ctx, server) }));
  } catch (error) {
    return jobFailure(error, "api/v1/appadmin/quiz-jobs/servers/[server]/start");
  }
}
