import { getT } from "@/lib/i18n/server";
import { AccessError, requireApiRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { toCsv } from "@/lib/csv";
import { audit } from "@/lib/audit";

/**
 * One class's register for one month, as the inspection-shaped grid: a row per
 * pupil, a column per register actually taken, P/L/A/E in the cells. Audited —
 * this file carries children's names and their absences.
 */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const url = new URL(request.url);
    const classId = url.searchParams.get("classId") ?? "";
    const month = url.searchParams.get("month") ?? "";
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return new Response("month must be YYYY-MM", { status: 400 });
    }

    const klass = await db.class.findFirst({
      where: { id: classId, schoolId: ctx.schoolId },
      select: { id: true, name: true },
    });
    if (!klass) return new Response("class not found", { status: 404 });

    const sessions = await db.attendanceSession.findMany({
      where: { schoolId: ctx.schoolId, classId, dateKey: { startsWith: `${month}-` } },
      orderBy: { dateKey: "asc" },
      select: {
        dateKey: true,
        records: { select: { studentMembershipId: true, status: true } },
      },
    });

    const roll = await db.enrollment.findMany({
      where: { schoolId: ctx.schoolId, classId, status: "ACTIVE" },
      select: {
        studentMembershipId: true,
        student: {
          select: { studentCode: true, user: { select: { name: true, preferredName: true } } },
        },
      },
      orderBy: { student: { user: { name: "asc" } } },
    });

    const letter: Record<string, string> = { PRESENT: "P", LATE: "L", ABSENT: "A", EXCUSED: "E" };
    const byDay = new Map(
      sessions.map((s) => [
        s.dateKey,
        new Map(s.records.map((r) => [r.studentMembershipId, letter[r.status] ?? "?"])),
      ]),
    );
    const days = sessions.map((s) => s.dateKey);

    const rows = roll.map((r) => {
      const row: Record<string, unknown> = {
        student_code: r.student.studentCode ?? "",
        name: r.student.user.name,
      };
      let present = 0;
      for (const day of days) {
        const mark = byDay.get(day)?.get(r.studentMembershipId) ?? "";
        row[day] = mark;
        if (mark === "P" || mark === "L") present += 1;
      }
      row.days_present = present;
      row.days_marked = days.filter((d) => byDay.get(d)?.has(r.studentMembershipId)).length;
      return row;
    });

    const csv = toCsv(rows, ["student_code", "name", ...days, "days_present", "days_marked"]);

    await audit({
      schoolId: ctx.schoolId,
      actorUserId: ctx.user.id,
      action: "compliance.export",
      targetType: "Class",
      targetId: classId,
      meta: { kind: "register", month, rows: rows.length },
    });

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="edulink-register-${klass.name.replace(/[^\w-]+/g, "_")}-${month}.csv"`,
        "Cache-Control": "no-store, private",
      },
    });
  } catch (error) {
    if (error instanceof AccessError) {
      const status = error.code === "UNAUTHENTICATED" ? 401 : 403;
      return new Response((await getT())(error.key, error.vars), { status });
    }
    console.error("[register export]", error);
    return new Response((await getT())("common.somethingWrong"), { status: 500 });
  }
}
