import "server-only";
import { NextResponse } from "next/server";
import { apiErrorSchema } from "@edulink/contracts";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { getT } from "@/lib/i18n/server";
import { apiFailure } from "./api-v1";

/**
 * A rule of a module saying no to an allowed person: a stock that would go
 * below nothing, a run that is already locked, a tag another asset carries.
 * Not an AccessError — the person may be here, the request may not stand —
 * so it is answered 409 (the thing's state is in the way) or 422 (what was
 * sent cannot be), with the sentence in the reader's language and, for a
 * 422, the field it is about. The inventory and payroll libraries throw it;
 * their routes answer it through `moduleFailure`, their pages and actions
 * show its key.
 */
export class RuleRefusal extends Error {
  constructor(
    readonly key: TranslationKey,
    readonly status: 409 | 422 = 422,
    readonly vars?: Record<string, string | number>,
    readonly field?: string,
  ) {
    super(key);
    this.name = "RuleRefusal";
  }
}

/** The route's catch: a RuleRefusal as 409/422, anything else as apiFailure says. */
export async function moduleFailure(error: unknown, where: string): Promise<NextResponse> {
  if (error instanceof RuleRefusal) {
    const t = await getT();
    const message = t(error.key, error.vars);
    const body = apiErrorSchema.parse({ error: message, code: error.status === 409 ? "CONFLICT" : "BAD_REQUEST", ...(error.field ? { issues: { [error.field]: message } } : {}) });
    return NextResponse.json(body, { status: error.status, headers: { "Cache-Control": "no-store" } });
  }
  return apiFailure(error, where);
}
