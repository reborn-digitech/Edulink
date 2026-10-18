import { viduraEvalReadSchema, viduraEvalRequestSchema, viduraEvalsSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { panelEvals, panelStartEval } from "@/lib/eval-jobs-desk";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { evalFailure } from "../_shared";

/** GET /api/v1/operator/vidura/evals — the evaluation run in hand (or the last), the latest runs with their scores, the model servers (Vidura pass 3). */
export async function GET() {
  try {
    const ctx = await requireApiOperator();
    return ok(viduraEvalsSchema.parse(await panelEvals(ctx)));
  } catch (error) {
    return evalFailure(error, "api/v1/operator/vidura/evals");
  }
}

/** POST /api/v1/operator/vidura/evals — start a run of the sets named (at least one): 201; 409 while one runs or a generation run or a crawl holds the model. Audited. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiOperator();
    const parsed = viduraEvalRequestSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(viduraEvalReadSchema.parse({ job: await panelStartEval(ctx, parsed.data) }), 201);
  } catch (error) {
    return evalFailure(error, "api/v1/operator/vidura/evals");
  }
}
