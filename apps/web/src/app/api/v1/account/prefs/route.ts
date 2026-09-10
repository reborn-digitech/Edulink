import { accountPrefsSchema, okSchema } from "@edulink/contracts";
import { saveUserPrefs } from "@/lib/account";
import type { UserPrefs } from "@/lib/session";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefusal } from "@/lib/api-account";
import { requireApiSession } from "@/lib/api-reads/shared";

/**
 * POST /api/v1/account/prefs — the web's savePrefs, through the same
 * saveUserPrefs. Only the keys the phone sent reach the merge: a phone that
 * shows the notification section alone must not reset the colour scheme
 * somebody chose on a laptop by leaving it out.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiSession();
    const parsed = accountPrefsSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const next = Object.fromEntries(Object.entries(parsed.data).filter(([, value]) => value !== undefined)) as Partial<UserPrefs>;
    const result = await saveUserPrefs(ctx, next);
    if (!result.ok) return apiRefusal({ errorKey: result.errorKey }, result.field);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/account/prefs");
  }
}
