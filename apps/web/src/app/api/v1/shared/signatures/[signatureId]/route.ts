import { getSession } from "@/lib/session";
import { AccessError } from "@/lib/tenancy";
import { paperImage } from "@/lib/signatures";
import { apiFailure } from "@/lib/api-v1";

/** GET /api/v1/shared/signatures/{signatureId} — a paper's copy of a signature or the seal, as a PNG, for a reader the paper lets in. */
export async function GET(_request: Request, { params }: { params: Promise<{ signatureId: string }> }) {
  try {
    const session = await getSession();
    if (!session) throw new AccessError("access.notSignedIn", "UNAUTHENTICATED");
    // Somebody with no standing at any school (an expert, the operator) is refused before any paper is looked for.
    if (!session.role || !["STUDENT", "PARENT", "TEACHER", "ADMIN", "PRINCIPAL"].includes(session.role)) throw new AccessError("access.wrongRoleForThisAction");
    const { signatureId } = await params;
    const png = await paperImage(session, signatureId);
    if (!png) throw new AccessError("signatures.notFound", "NOT_FOUND");
    return new Response(new Uint8Array(png), { headers: { "content-type": "image/png", "cache-control": "private, max-age=3600" } });
  } catch (error) {
    return apiFailure(error, "api/v1/shared/signatures/[signatureId]");
  }
}
