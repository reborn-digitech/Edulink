import { officeSyllabusQuerySchema, officeSyllabusSaveSchema, officeSyllabusSavedSchema, officeSyllabusSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { officeSyllabus, saveOfficeSyllabus } from "@/lib/syllabus";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/office/syllabus?gradeLevel=&subject= — the lists, and one in full. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = officeSyllabusQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(officeSyllabusSchema.parse(await officeSyllabus(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/syllabus");
  }
}

/** POST /api/v1/office/syllabus — replace one list in order. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = officeSyllabusSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(officeSyllabusSavedSchema.parse(await saveOfficeSyllabus(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/syllabus");
  }
}
