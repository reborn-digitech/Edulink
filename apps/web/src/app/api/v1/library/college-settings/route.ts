import { collegeLibrarySettingsSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { collegeLibrarySettings, saveCollegeLibrarySettings } from "@/lib/college-campus";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/library/college-settings — A college's borrowing terms for faculty and students, and the book bank's extra books. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("LIBRARIAN", "ADMIN", "PRINCIPAL", "IQAC");
    return ok(collegeLibrarySettingsSchema.parse(await collegeLibrarySettings(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/library/college-settings");
  }
}

/** POST /api/v1/library/college-settings — Set the college's borrowing terms. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const parsed = collegeLibrarySettingsSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(collegeLibrarySettingsSchema.parse(await saveCollegeLibrarySettings(ctx, b)));
  } catch (error) {
    return apiFailure(error, "api/v1/library/college-settings");
  }
}
