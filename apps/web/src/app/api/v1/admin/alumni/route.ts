import { alumniAdminSchema } from "@edulink/contracts";
import { alumniForOffice } from "@/lib/alumni";
import { apiFailure, ok } from "@/lib/api-v1";
import { requireApiRole } from "@/lib/tenancy";

/** GET /api/v1/admin/alumni — the school's alumni by batch, their flags, and the notes sent. The office and the head. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const q = new URL(request.url).searchParams.get("q")?.slice(0, 80) ?? "";
    const view = await alumniForOffice(ctx, q);
    return ok(alumniAdminSchema.parse({ ...view, notes: view.notes.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() })) }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/alumni");
  }
}
