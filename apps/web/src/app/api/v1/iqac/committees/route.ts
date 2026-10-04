import { committeeSaveSchema, committeesSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { listCommittees, saveCommittee } from "@/lib/iqac";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/iqac/committees — The committees with their members and meetings. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN", "PRINCIPAL");
    return ok(committeesSchema.parse(await listCommittees(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/committees");
  }
}

/** POST /api/v1/iqac/committees — The office adds a committee. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const parsed = committeeSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(committeesSchema.parse(await saveCommittee(ctx, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/committees");
  }
}
