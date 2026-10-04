import { attendanceReportQuerySchema, attendanceReportSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { attendanceReport } from "@/lib/academics-attendance";
import { apiInvalid, ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/academics/attendance — Attendance by offering, department or term, or the defaulters; the HOD opening the defaulters tells those not told this week. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("FACULTY", "HOD", "ADMIN", "PRINCIPAL");
    const parsed = attendanceReportQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(attendanceReportSchema.parse(await attendanceReport(ctx, q)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/attendance");
  }
}
