import { officeCsvBodySchema, officeIntakePreviewSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { parseIntakeCsv } from "@/lib/csv";
import { todayKey } from "@/lib/dates";
import { db } from "@/lib/db";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/**
 * POST /api/v1/office/intake/preview — what an admission list would admit,
 * before anybody is. The parser the intake form previews with (and the admit
 * re-runs), against the school's own "today" so a birthday tomorrow is in the
 * future; a class named that the school does not run is flagged, as on the
 * web. Writes nothing.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = officeCsvBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const [school, classes] = await Promise.all([
      db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } }),
      db.class.findMany({ where: { schoolId: ctx.schoolId, archivedAt: null }, select: { name: true } }),
    ]);
    const known = new Set(classes.map((k) => k.name.trim().toLowerCase()));
    const { valid, problems, recognised } = parseIntakeCsv(parsed.data.csv.trim(), todayKey(school.timezone));
    return ok(
      officeIntakePreviewSchema.parse({
        valid: valid.map((r) => ({
          line: r.line,
          name: r.name,
          birthdateKey: r.birthdateKey,
          className: r.className,
          guardianEmail: r.guardianEmail,
          transfer: Boolean(r.studentCode),
          unknownClass: Boolean(r.className && !known.has(r.className.toLowerCase())),
        })),
        problems,
        recognised,
      }),
    );
  } catch (error) {
    return apiFailure(error, "api/v1/office/intake/preview");
  }
}
