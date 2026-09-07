import { describe, expect, it } from "vitest";
import { actionError } from "@/lib/action-error";
import type { Translate } from "@/lib/i18n/dictionary";

/**
 * One function resolves every failed server action into one string; the
 * order of its three sources is the contract every toast relies on.
 */
const t = ((key: string, vars?: Record<string, string | number>) =>
  vars ? `${key}:${Object.values(vars).join(",")}` : `t(${key})`) as unknown as Translate;

describe("actionError", () => {
  it("prefers the action's own key, with its variables", () => {
    expect(actionError(t, { errorKey: "reviews.roundGone", error: "raw" }, "common.clearAll")).toBe("t(reviews.roundGone)");
    expect(actionError(t, { errorKey: "reviews.clashesN", errorVars: { count: 3 } })).toBe("reviews.clashesN:3");
  });

  it("falls back to the raw tenancy message, then to the caller's fallback", () => {
    expect(actionError(t, { error: "Access denied" }, "common.clearAll")).toBe("Access denied");
    expect(actionError(t, {}, "common.clearAll")).toBe("t(common.clearAll)");
  });

  it("returns undefined with nothing to say and no fallback, so a toast prints nothing", () => {
    expect(actionError(t, {})).toBeUndefined();
  });
});
