import { academicYearCreateBodySchema, academicYearCreatedSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { academicYearName, createAcademicYear } from "@/lib/academic-year";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";
import { underRules } from "@/lib/api-rule-failure";

/**
 * POST /api/v1/admin/calendar/years — make an academic year (the web's
 * startAcademicYear). The office and the head, as on the web. The name is a
 * year's own ("2026–27", or "2026" where a school runs the calendar year),
 * starting with the year it begins in; anything else is refused, because the
 * name is part of every certificate's serial. Dates are read as UTC midnight,
 * as the action reads them. The school's first year becomes the running one.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = academicYearCreateBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const startDate = new Date(`${parsed.data.startDateKey}T00:00:00.000Z`);
    const endDate = new Date(`${parsed.data.endDateKey}T00:00:00.000Z`);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return apiRefused({ errorKey: "access.thatIsNotARealDate" });
    const name = academicYearName(parsed.data.name, startDate);
    if (!name) return apiRefused({ errorKey: "access.nameTheYearByItsYears" });
    return await underRules("api/v1/admin/calendar/years", async () => ok(academicYearCreatedSchema.parse({ id: await createAcademicYear(ctx, { name, startDate, endDate }) }), 201));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/calendar/years");
  }
}
