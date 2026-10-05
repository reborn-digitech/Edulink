import { studentCouncilNoticeCreatedSchema, studentCouncilNoticeSaveSchema, studentCouncilViewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { councilView, postCouncilNotice } from "@/lib/council-notices";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/shared/bulletin/council — the student council, its members, and whether the reader may post for it or keep it. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("STUDENT", "ADMIN", "PRINCIPAL");
    return ok(studentCouncilViewSchema.parse(await councilView(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/shared/bulletin/council");
  }
}

/** POST /api/v1/shared/bulletin/council — a notice signed by the council: a member's waits for the office's review, the office's is live. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("STUDENT", "ADMIN", "PRINCIPAL");
    const parsed = studentCouncilNoticeSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(studentCouncilNoticeCreatedSchema.parse(await postCouncilNotice(ctx, parsed.data)), 201);
  } catch (error) {
    return moduleFailure(error, "api/v1/shared/bulletin/council");
  }
}
