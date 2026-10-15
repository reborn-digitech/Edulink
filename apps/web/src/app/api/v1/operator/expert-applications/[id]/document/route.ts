import { requireApiOperator, AccessError } from "@/lib/tenancy";
import { apiFailure } from "@/lib/api-v1";
import { readExpertApplicationDocument } from "@/lib/expert-applications";

/**
 * GET /api/v1/operator/expert-applications/{id}/document — the qualification or identity document an expert
 * sent with their application (15 Oct 2026), to the operator alone. The file id is read off the application's
 * own row, so this door opens that file and no other; no such application, no document or bytes gone are the
 * same 404. Served as the file route serves a private file: never cached, never sniffed, sandboxed.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireApiOperator();
    const { id } = await params;
    const stored = await readExpertApplicationDocument(ctx, id);
    if (!stored) throw new AccessError("expertApply.noSuchApplication", "NOT_FOUND");
    return new Response(new Uint8Array(stored.bytes), {
      headers: {
        "Content-Type": stored.mime,
        "Cache-Control": "private, no-store, max-age=0, must-revalidate",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
        "Content-Security-Policy": "default-src 'none'; img-src 'self'; sandbox",
      },
    });
  } catch (error) {
    return apiFailure(error, "api/v1/operator/expert-applications/[id]/document");
  }
}
