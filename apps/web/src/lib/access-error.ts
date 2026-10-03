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
  constructor(readonly module: SchoolModuleCode) {
    super("modules.refuseOff", "MODULE_OFF", { module });
    this.name = "ModuleOffError";
  }
}
