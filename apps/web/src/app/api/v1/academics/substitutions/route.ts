import { academicsChangedResultSchema, lectureSubstituteSaveSchema, lectureSubstitutionsQuerySchema, lectureSubstitutionsSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { lectureSubstitutions, setLectureSubstitute } from "@/lib/academics";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/academics/substitutions — The day's lectures whose faculty member is away, who stands in and who could. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN", "PRINCIPAL", "HOD");
    const parsed = lectureSubstitutionsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(lectureSubstitutionsSchema.parse(await lectureSubstitutions(ctx, q.date)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/substitutions");
  }
}

/** POST /api/v1/academics/substitutions — Name who stands in for a lecture, or clear it (idempotent; the substitute is told). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN", "HOD");
    const parsed = lectureSubstituteSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(academicsChangedResultSchema.parse(await setLectureSubstitute(ctx, q)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/substitutions");
  }
}
