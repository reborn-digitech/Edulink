import { eResourceOpenSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { openEResource } from "@/lib/college-campus";
import { apiFailure, ok } from "@/lib/api-v1";

type Params = { params: Promise<{ resourceId: string }> };

/** POST /api/v1/library/eresources/{resourceId}/open — Open an e-resource through the app: counted, and its link returned. */
export async function POST(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("LIBRARIAN", "ADMIN", "PRINCIPAL", "IQAC", "STUDENT", "FACULTY", "HOD");
    const { resourceId } = await params;
    return ok(eResourceOpenSchema.parse(await openEResource(ctx, resourceId)));
  } catch (error) {
    return apiFailure(error, "api/v1/library/eresources/[resourceId]/open");
  }
}
