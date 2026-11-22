import { schoolTermsAnswerSchema, termsBodySchema, termsChangeAnswerSchema, type TermsBody } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { readSchoolTerms, setSchoolTerms } from "@/lib/school-terms";
import { operatorRefused } from "@/lib/api-reads/operator-school";
import { termsDoorLines } from "@/lib/terms-lines";
import { termsFmt } from "@/lib/terms-fmt";
import { switchSentence } from "@/lib/terms-sentences";

/** The one premium switch a body turns, alone: no other part, terms or note with it (the phone sends one at a time). */
function oneSwitch(body: TermsBody): { role: "students" | "teachers"; on: boolean } | null {
  if (body.subscription !== undefined || body.note !== undefined || !body.premium || body.premium.terms !== undefined) return null;
  const premium = body.premium;
  const roles = (["students", "teachers"] as const).filter((role) => premium[role] !== undefined);
  return roles.length === 1 ? { role: roles[0]!, on: premium[roles[0]!]! } : null;
}

/** GET /api/v1/operator/schools/{schoolId}/terms — the school's subscription and premium terms, worked out on read, with its standing, the year's bill and C2's lines beside its premium switches. */
export async function GET(_request: Request, { params }: { params: Promise<{ schoolId: string }> }) {
  try {
    const ctx = await requireApiOperator();
    const { schoolId } = await params;
    const result = await readSchoolTerms(ctx, schoolId);
    if ("ok" in result) return operatorRefused(result);
    return ok(schoolTermsAnswerSchema.parse({ ...result, lines: await termsDoorLines(ctx, result, await termsFmt()) }));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/schools/[schoolId]/terms");
  }
}

/**
 * PUT /api/v1/operator/schools/{schoolId}/terms — change the school's own terms, premium switches or note against the terms as
 * read; `preview` writes nothing. Its terms carry C2's lines as they stand after the change (or would); a preview of one
 * premium switch answers, as `sentence`, what the switch will do, worded for the question asked before it (C7 point 7c).
 */
export async function PUT(request: Request, { params }: { params: Promise<{ schoolId: string }> }) {
  try {
    const ctx = await requireApiOperator();
    const { schoolId } = await params;
    const parsed = termsBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const single = parsed.data.preview ? oneSwitch(parsed.data) : null;
    // The terms as they stand before the switch, for its sentence; a preview writes nothing, so the order costs nothing.
    const before = single ? await readSchoolTerms(ctx, schoolId) : null;
    const result = await setSchoolTerms(ctx, schoolId, parsed.data);
    if ("ok" in result) return operatorRefused(result);
    const f = await termsFmt();
    // Only where the switch moves, as the console words it (the review of bace327b, S1).
    const sentence = single && before && !("ok" in before) && result.changed ? switchSentence(f, { ...single, before, after: result.terms, told: result.told, ask: true }) : undefined;
    return ok(termsChangeAnswerSchema.parse({ ...result, terms: { ...result.terms, lines: await termsDoorLines(ctx, result.terms, f) }, ...(sentence ? { sentence } : {}) }));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/schools/[schoolId]/terms");
  }
}
