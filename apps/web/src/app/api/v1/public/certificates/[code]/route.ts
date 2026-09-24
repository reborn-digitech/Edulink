import { NextResponse } from "next/server";
import { apiErrorSchema, certificateVerifySchema } from "@edulink/contracts";
import { verifyByCode } from "@/lib/certificates";
import { apiFailure, ok } from "@/lib/api-v1";
import { CODE_LOOKUPS, consumeByCaller } from "@/lib/rate-limit";
import { getT } from "@/lib/i18n/server";

/**
 * GET /api/v1/public/certificates/{code} — is the paper real; nothing about
 * the pupil. Signed out, so the caller is an address: a hundred and twenty
 * lookups a quarter-hour is an office checking a pile, not a script walking
 * the code space (thirty-two letters to the tenth power, but a door that is
 * open to anyone is a door that is counted).
 */
export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const gate = await consumeByCaller("certificate-check", CODE_LOOKUPS);
    if (!gate.allowed) {
      const t = await getT();
      return NextResponse.json(
        apiErrorSchema.parse({ error: t("common.tryAgainMoment"), code: "RATE_LIMITED", retryAfterSeconds: gate.retryAfterSeconds }),
        { status: 429, headers: { "Retry-After": String(gate.retryAfterSeconds), "Cache-Control": "no-store" } },
      );
    }
    const { code } = await params;
    return ok(certificateVerifySchema.parse(await verifyByCode(code)));
  } catch (error) {
    return apiFailure(error, "api/v1/public/certificates/[code]");
  }
}
