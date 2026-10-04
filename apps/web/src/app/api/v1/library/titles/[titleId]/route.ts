import { libraryMineQuerySchema, libraryTitleSaveSchema, libraryTitleViewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { titleView, updateTitle } from "@/lib/library";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ titleId: string }> };

/** GET /api/v1/library/titles/{titleId} — One title: its copies and queue for the desk, the reader's own place in the queue. */
export async function GET(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("STUDENT", "PARENT", "TEACHER", "ADMIN", "PRINCIPAL", "LIBRARIAN", "FACULTY", "HOD");
    const p = await params;
    const parsed = libraryMineQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(libraryTitleViewSchema.parse(await titleView(ctx, p.titleId, q.childId)));
  } catch (error) {
    return apiFailure(error, "api/v1/library/titles/[titleId]");
  }
}

/** POST /api/v1/library/titles/{titleId} — The desk corrects a title. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("LIBRARIAN", "ADMIN");
    const p = await params;
    const parsed = libraryTitleSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(libraryTitleViewSchema.parse(await updateTitle(ctx, p.titleId, b)));
  } catch (error) {
    return apiFailure(error, "api/v1/library/titles/[titleId]");
  }
}
