import { quizGenJobReadSchema, quizGenRequestSchema, quizJobsStateSchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { deskJobs, deskStartJob } from "@/lib/quiz-jobs-desk";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { jobFailure } from "./_shared";

/** GET /api/v1/appadmin/quiz-jobs — the generation run in hand (or the last), the latest runs, the model servers. */
export async function GET() {
  try {
    const ctx = await requireApiAppAdmin();
    return ok(quizJobsStateSchema.parse(await deskJobs(ctx)));
  } catch (error) {
    return jobFailure(error, "api/v1/appadmin/quiz-jobs");
  }
}

/** POST /api/v1/appadmin/quiz-jobs — start a generation run (one at a time): 201 with the run; 409 while another is active. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiAppAdmin();
    const parsed = quizGenRequestSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(quizGenJobReadSchema.parse({ job: await deskStartJob(ctx, parsed.data) }), 201);
  } catch (error) {
    return jobFailure(error, "api/v1/appadmin/quiz-jobs");
  }
}
