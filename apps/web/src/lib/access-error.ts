import type { TranslationKey } from "@/lib/i18n/dictionary";
import type { FeatureCode, PlanCode, SchoolModuleCode } from "@edulink/contracts";

/**
 * ⚠ THE MESSAGE IS A KEY, and the constructor's type is what enforces it.
 *
 * These refusals are minted 200+ places deep in the libs and read by whoever
 * asked, in whatever language they read. So a throw site names WHAT went wrong
 * as a `TranslationKey` and the action boundary owns the words — the compiler
 * refuses a new English sentence here the same way it refuses a missing
 * dictionary entry. `message` still carries the key, so logs and `toThrow`
 * assertions read it directly; `key` is the typed alias boundaries use.
 */
export class AccessError extends Error {
  /**
   * A REFUSAL THAT REACHES A PAGE'S RENDER IS THE APP'S 404 (A3-states-2, 5 Oct 2026).
   *
   * A route handler and a server action catch an AccessError and answer it in
   * words (apiFailure, the action boundaries); a page did not, so a stale or
   * mistyped id — `sessionOf`'s NOT_FOUND, another faculty member's lecture —
   * escaped the render and Next answered 500 with its bare "Application error"
   * on twelve college route templates. Next reads `digest` to tell its own
   * not-found interrupt from a crash (`notFound()` throws exactly this digest),
   * so every NOT_FOUND, FORBIDDEN or MODULE_OFF refusal now renders the
   * app's not-found page with the shell, in the reader's language, with a 404
   * — on every page at once rather than a try/catch per page. FORBIDDEN is a
   * 404 on purpose: "not here" and "not yours" must read the same (not-found.tsx).
   * UNAUTHENTICATED keeps no digest: a page gates with requireUser/requireRole,
   * which redirect, and page-gates.test.ts holds that. Code that catches the
   * error by class (`instanceof AccessError`) is unaffected.
   */
  readonly digest?: string;

  constructor(
    readonly key: TranslationKey,
    /** MODULE_OFF: a door whose module the school has not switched on — a 403 whose envelope code says so (ModuleOffError). */
    readonly code: "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "MODULE_OFF" = "FORBIDDEN",
    /** For the few refusals that carry a number or a name into the sentence. */
    readonly vars?: Record<string, string | number>,
  ) {
    super(key);
    this.name = "AccessError";
    if (code !== "UNAUTHENTICATED") this.digest = PAGE_NOT_FOUND_DIGEST;
  }
}

/** The digest `notFound()` from next/navigation throws (HTTP_ERROR_FALLBACK_ERROR_CODE;404); held by tests/page-not-found.test.ts against the framework's own. */
export const PAGE_NOT_FOUND_DIGEST = "NEXT_HTTP_ERROR_FALLBACK;404";

/**
 * A door, page or write whose module this school has not switched on. A 403
 * whose envelope says MODULE_OFF, so the phone can tell "not for you" from
 * "not switched on here"; the sentence names the module in the reader's
 * language (`apiFailure` resolves it — `vars.module` here is the code, for a
 * log line).
 */
export class ModuleOffError extends AccessError {
  constructor(
    readonly module: SchoolModuleCode,
    /** The sentence, when it is not "this school has not switched on {module}": a college's door at a school says so (NotACollegeError). */
    key: TranslationKey = "modules.refuseOff",
  ) {
    super(key, "MODULE_OFF", { module });
    this.name = "ModuleOffError";
  }
}

/**
 * A COLLEGE'S DOOR, PAGE OR WRITE AT ANY OTHER KIND OF TENANT (W-17, 4 Oct
 * 2026). One answer, the module gate's own: 403 MODULE_OFF, naming ACADEMICS
 * — the module every college has on and no school is offered — so the phone
 * and the sweep read "college-only" the way they read "switched off". Before,
 * a school was answered three ways (MODULE_OFF, 403 FORBIDDEN "This is for a
 * college.", 404 "this is for a college"), and a guardian, whose session has
 * no school, got 404 where the pupil got MODULE_OFF. The sentence stays the
 * one each desk already said. Thrown by `assertCollege` (modules.ts).
 */
export class NotACollegeError extends ModuleOffError {
  constructor(key: TranslationKey = "collegeOffice.refuseNotCollege") {
    super("ACADEMICS", key);
    this.name = "NotACollegeError";
  }
}

/**
 * A door, page or write of a PLATFORM FEATURE the operator has not switched on (15 Oct 2026;
 * src/lib/platform-features.ts). A NOT_FOUND refusal, so a page renders the app's 404 (the digest above)
 * and code that maps AccessError codes reads "not here"; `apiFailure` answers it 404 with the envelope
 * code FEATURE_OFF, so the phone can tell "not open yet" from a missing row. `vars.feature` is the code,
 * for a log line.
 */
export class FeatureOffError extends AccessError {
  constructor(
    readonly feature: FeatureCode,
    key: TranslationKey = "platformFeatures.refuseOff",
  ) {
    super(key, "NOT_FOUND", { feature });
    this.name = "FeatureOffError";
  }
}

/**
 * A door, page or write of a platform feature that is ON but needs a plan this person does not hold (16 Oct 2026;
 * src/lib/person-plans.ts, decision 0006): the STUDENT plan for a pupil's practice, the TEACHER plan for a
 * teacher's assistant, the EXPERT plan for offering time. `apiFailure` answers it 402 with the envelope code
 * PLAN_REQUIRED and `plan`; a page gate shows the plan card instead (feature-page.ts), and a server action says the
 * sentence, which names the plan. A FORBIDDEN AccessError otherwise, so a page that lets it escape renders the 404.
 */
const PLAN_REFUSAL: Record<PlanCode, TranslationKey> = { STUDENT: "plans.refuseStudent", TEACHER: "plans.refuseTeacher", EXPERT: "plans.refuseExpert" };
export class PlanRequiredError extends AccessError {
  constructor(
    readonly plan: PlanCode,
    readonly feature: FeatureCode,
  ) {
    super(PLAN_REFUSAL[plan], "FORBIDDEN", { plan, feature });
    this.name = "PlanRequiredError";
  }
}
