import { libraryFineSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { settleFine } from "@/lib/library";
import { apiFailure, ok } from "@/lib/api-v1";

type Params = { params: Promise<{ fineId: string }> };

/** POST /api/v1/library/fines/{fineId}/settle — The office records a counter due as settled at its own counter. */
export async function POST(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const p = await params;
    return ok(libraryFineSchema.parse(await settleFine(ctx, p.fineId)));
  } catch (error) {
    return apiFailure(error, "api/v1/library/fines/[fineId]/settle");
  }
}
