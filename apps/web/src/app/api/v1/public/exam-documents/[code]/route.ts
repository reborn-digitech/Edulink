import { NextResponse } from "next/server";
import { apiErrorSchema, examDocumentCheckSchema } from "@edulink/contracts";
import { checkExamDocument } from "@/lib/exam-cell-after";
import { apiFailure, ok } from "@/lib/api-v1";
import { CODE_LOOKUPS, consumeByCaller } from "@/lib/rate-limit";
import { getT } from "@/lib/i18n/server";

/**
 * GET /api/v1/public/exam-documents/{code}?school= — is a grade card,
 * transcript, degree certificate or hall ticket real; nothing about the
 * student. Signed out, counted like the certificate check (the same bucket):
 * the printed address carries the college's id, which is the fence the
 * lookup runs inside.
 */
export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const gate = await consumeByCaller("certificate-check", CODE_LOOKUPS);
    if (!gate.allowed) {
      const t = await getT();
      return NextResponse.json(apiErrorSchema.parse({ error: t("common.tryAgainMoment"), code: "RATE_LIMITED", retryAfterSeconds: gate.retryAfterSeconds }), { status: 429, headers: { "Retry-After": String(gate.retryAfterSeconds), "Cache-Control": "no-store" } });
    }
    const { code } = await params;
    const school = new URL(request.url).searchParams.get("school") ?? "";
    return ok(examDocumentCheckSchema.parse(await checkExamDocument(school, code)));
  } catch (error) {
    return apiFailure(error, "api/v1/public/exam-documents/[code]");
  }
}
