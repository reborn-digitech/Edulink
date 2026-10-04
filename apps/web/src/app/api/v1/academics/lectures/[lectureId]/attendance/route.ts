import { lectureMarkResultSchema, lectureMarkSaveSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { markLecture } from "@/lib/academics-attendance";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ lectureId: string }> };

/** POST /api/v1/academics/lectures/{lectureId}/attendance — Mark a lecture; the same clientId twice writes once (the phone's outbox). */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("FACULTY", "HOD");
    const p = await params;
    const parsed = lectureMarkSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(lectureMarkResultSchema.parse(await markLecture(ctx, p.lectureId, q)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/lectures/[lectureId]/attendance");
  }
}
