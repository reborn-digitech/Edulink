import { requireApiRole, AccessError } from "@/lib/tenancy";
import { ownImage } from "@/lib/signatures";
import { apiFailure } from "@/lib/api-v1";

/** GET /api/v1/office/signatures/image?of=mine|seal — the reader's own signature, or the school's seal, as a PNG. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL", "TEACHER");
    const of = new URL(request.url).searchParams.get("of") === "seal" ? "seal" : "mine";
    const png = await ownImage(ctx, of);
    if (!png) throw new AccessError("signatures.notFound", "NOT_FOUND");
    return new Response(new Uint8Array(png), { headers: { "content-type": "image/png", "cache-control": "private, max-age=3600" } });
  } catch (error) {
    return apiFailure(error, "api/v1/office/signatures/image");
  }
}
