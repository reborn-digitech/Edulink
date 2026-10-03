import { librarySettingsSaveSchema, librarySettingsSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { librarySettingsFor, saveLibrarySettings } from "@/lib/library";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/library/settings — The school's lending rules: limits and loan days by kind, renewals, the overdue fine, the fee head fines go to. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("LIBRARIAN", "ADMIN", "PRINCIPAL");
    return ok(librarySettingsSchema.parse(await librarySettingsFor(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/library/settings");
  }
}

/** POST /api/v1/library/settings — The office sets the lending rules. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const parsed = librarySettingsSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(librarySettingsSchema.parse(await saveLibrarySettings(ctx, b)));
  } catch (error) {
    return apiFailure(error, "api/v1/library/settings");
  }
}
