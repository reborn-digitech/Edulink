import { certificateRequestSchema } from "@edulink/contracts";
import { requireApiReader } from "@/lib/api-reads/family";
import { requireApiRoles } from "@/lib/api-roles";
import { getSession } from "@/lib/session";
import { cancelRequest } from "@/lib/certificate-requests";
import { apiFailure, ok } from "@/lib/api-v1";

/** The pupil, a guardian, or — for a paper asked for again — the former pupil (G-6). */
async function asker() {
  return (await getSession())?.role === "ALUMNUS" ? requireApiRoles("ALUMNUS") : requireApiReader();
}

/** POST /api/v1/family/certificate-requests/{requestId}/cancel — take it back. */
export async function POST(_request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  try {
    const ctx = await asker();
    const { requestId } = await params;
    return ok(certificateRequestSchema.parse(await cancelRequest(ctx, requestId)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/certificate-requests/[requestId]/cancel");
  }
}
