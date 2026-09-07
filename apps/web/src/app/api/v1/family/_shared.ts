import { NextResponse } from "next/server";
import { apiErrorSchema } from "@edulink/contracts";
import { getT } from "@/lib/i18n/server";
import type { FieldIssues } from "@/lib/api-reads/family";

/**
 * A form refusal that came from the library rather than from zod — a date of
 * birth the pupil may no longer set, a questionnaire with a question missing —
 * in the same 422 envelope `apiInvalid` writes, field by field.
 */
export async function fieldFailure(issues: FieldIssues): Promise<NextResponse> {
  const t = await getT();
  const out: Record<string, string> = {};
  for (const [field, key] of Object.entries(issues)) out[field] = t(key);
  return NextResponse.json(apiErrorSchema.parse({ error: t("common.checkTheForm"), code: "BAD_REQUEST", issues: out }), {
    status: 422,
    headers: { "Cache-Control": "no-store" },
  });
}

/** The query string as a plain object, for a zod query schema. */
export function query(request: Request): Record<string, string> {
  return Object.fromEntries(new URL(request.url).searchParams);
}
