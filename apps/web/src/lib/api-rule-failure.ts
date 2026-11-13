import "server-only";
import type { NextResponse } from "next/server";
import { AccessError } from "@/lib/tenancy";
import { PlanRequiredError } from "@/lib/access-error";
import { apiFailure } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";

/**
 * The library's answer, for a door that checked its roles BEFORE it read the
 * body (A3-inventory-7, audit of 5 October 2026). The year, term, closure,
 * promotion and roll libraries throw AccessError for their rules as well as
 * for a wrong role — "the year has to end after it starts", "only the year
 * that is running can be closed", "a class moves once" — because the web's
 * action shows either as a sentence. Behind a door whose role is already
 * proved, a FORBIDDEN from the library is a rule saying no to an allowed
 * person: a 422 with that sentence, as a form would show it. NOT_FOUND stays
 * a 404 (another school's id) and anything else is apiFailure's.
 *
 * Only the call into the library goes through here; the role check runs
 * outside it, so a wrong role is still a 403.
 */
export async function underRules(where: string, run: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await run();
  } catch (error) {
    // TA-322: a plan this person lacks is apiFailure's 402 PLAN_REQUIRED (with the plan and the feature), not a rule's 422.
    if (error instanceof AccessError && error.code === "FORBIDDEN" && !(error instanceof PlanRequiredError)) return apiRefused({ errorKey: error.key, errorVars: error.vars });
    return apiFailure(error, where);
  }
}
