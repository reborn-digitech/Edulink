import { facultyRecordSaveSchema, facultyRecordsSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { facultyRecords, saveFacultyRecord } from "@/lib/iqac";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/iqac/faculty-records — Every teacher's record: designation, appointment, qualification, experience, API score, PAN by its last four. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN", "PRINCIPAL");
    return ok(facultyRecordsSchema.parse(await facultyRecords(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/faculty-records");
  }
}

/** POST /api/v1/iqac/faculty-records — The office writes a teacher's record; a PAN is sealed and never logged. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const parsed = facultyRecordSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(facultyRecordsSchema.parse(await saveFacultyRecord(ctx, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/faculty-records");
  }
}
