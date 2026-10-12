import { collegeSyllabiSchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { deskCollegeSyllabi } from "@/lib/quiz-college";
import { ok } from "@/lib/api-v1";
import { jobFailure } from "../_shared";

/** GET /api/v1/appadmin/quiz-jobs/college-syllabi — the streams with a syllabus corpus, their programmes, documents and units (college-content, 12 Oct 2026). */
export async function GET() {
  try {
    const ctx = await requireApiAppAdmin();
    return ok(collegeSyllabiSchema.parse(await deskCollegeSyllabi(ctx)));
  } catch (error) {
    return jobFailure(error, "api/v1/appadmin/quiz-jobs/college-syllabi");
  }
}
