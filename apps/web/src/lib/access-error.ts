import type { TranslationKey } from "@/lib/i18n/dictionary";
import type { SchoolModuleCode } from "@edulink/contracts";

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
  constructor(
    readonly key: TranslationKey,
    /** MODULE_OFF: a door whose module the school has not switched on — a 403 whose envelope code says so (ModuleOffError). */
    readonly code: "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "MODULE_OFF" = "FORBIDDEN",
    /** For the few refusals that carry a number or a name into the sentence. */
    readonly vars?: Record<string, string | number>,
  ) {
    super(key);
    this.name = "AccessError";
  }
}

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
