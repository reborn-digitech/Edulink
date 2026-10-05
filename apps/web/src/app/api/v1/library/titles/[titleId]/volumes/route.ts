import { libraryVolumeSaveSchema, periodicalViewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { addVolume, periodicalView } from "@/lib/library-periodicals";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ titleId: string }> };

/** GET /api/v1/library/titles/{titleId}/volumes — a periodical's subscription and the volumes received (G4-21). */
export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("LIBRARIAN", "ADMIN", "PRINCIPAL");
    const { titleId } = await params;
    return ok(periodicalViewSchema.parse(await periodicalView(ctx, titleId)));
  } catch (error) {
    return apiFailure(error, "api/v1/library/titles/[titleId]/volumes");
  }
}

/** POST /api/v1/library/titles/{titleId}/volumes — a volume (and issue) received; refused on a book (G4-21). */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("LIBRARIAN", "ADMIN");
    const { titleId } = await params;
    const parsed = libraryVolumeSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(periodicalViewSchema.parse(await addVolume(ctx, titleId, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/library/titles/[titleId]/volumes");
  }
}
