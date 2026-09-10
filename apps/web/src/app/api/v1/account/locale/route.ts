import { accountLocaleSavedSchema, accountLocaleSchema } from "@edulink/contracts";
import { setUserLocale } from "@/lib/account";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";

/**
 * POST /api/v1/account/locale — the language, on the account (`prefs.locale`,
 * the field Practice reads too). No cookie: that copy is for pages rendered
 * before a session resolves, and a bearer client has none of those.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiSession();
    const parsed = accountLocaleSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const locale = await setUserLocale(ctx.user.id, parsed.data.locale);
    return ok(accountLocaleSavedSchema.parse({ locale }));
  } catch (error) {
    return apiFailure(error, "api/v1/account/locale");
  }
}
