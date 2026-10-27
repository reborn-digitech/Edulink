import { eResourceSaveSchema, eResourceSchema, eResourcesSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { listEResources, saveEResource } from "@/lib/college-campus";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/library/eresources — The e-resources (N-LIST, DELNET, e-journals); the desk sees their open counts. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("LIBRARIAN", "ADMIN", "PRINCIPAL", "IQAC", "STUDENT", "TEACHER", "FACULTY", "HOD");
    return ok(eResourcesSchema.parse(await listEResources(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/library/eresources");
  }
}

/** POST /api/v1/library/eresources — Add or correct an e-resource link (https only). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("LIBRARIAN", "ADMIN");
    const parsed = eResourceSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(eResourceSchema.parse(await saveEResource(ctx, b)));
  } catch (error) {
    return apiFailure(error, "api/v1/library/eresources");
  }
}
