import { NextResponse } from "next/server";
import { AccessError, requireApiRole } from "@/lib/tenancy";
import { attendanceBatchSchema, fieldErrors } from "@/lib/validation";
import { saveAttendanceBatch, getRegister } from "@/lib/attendance";
import { assertClassAccessForRegister, assertMayTakeRegister, registerDuty } from "@/lib/register-duty";
import { db } from "@/lib/db";
import { todayKey } from "@/lib/dates";
import { getT } from "@/lib/i18n/server";

/**
 * Attendance endpoint.
 *
 * This is the target of the offline outbox, so it must be safe to call twice
 * with the same body — see saveAttendanceBatch for how that is guaranteed.
 *
 * It is a route handler rather than a server action specifically because the
 * service worker has to be able to replay it as a plain fetch with a JSON body
 * while no page is open. Server actions are not replayable that way.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN");

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
    }

    const parsed = attendanceBatchSchema.safeParse(body);
    if (!parsed.success) {
      const t = await getT();
      return NextResponse.json(
        { error: t("attendance.dataInvalid"), issues: fieldErrors(parsed.error, t) },
        { status: 422 },
      );
    }

    const { classId, dateKey, marks } = parsed.data;

    // TWO CHECKS, ASKING DIFFERENT QUESTIONS, and conflating them is what this
    // route used to do. `assertClassAccess` answers "is this class in my school
    // and mine at all?" — the tenant boundary. `assertMayTakeRegister` answers
    // "am I down to mark it today?" — the duty. A visiting music teacher
    // attached to six classes passes the first for all six and the second for
    // none of them, which is the right answer to both questions.
    const duty = await assertMayTakeRegister(ctx, classId, dateKey);
    await assertClassAccessForRegister(ctx, classId, duty, { write: true });

    // A register cannot be taken for a future date — that is always a bug or a
    // wrong device clock, and silently accepting it corrupts the history.
    const school = await db.school.findUniqueOrThrow({
      where: { id: ctx.schoolId },
      select: { timezone: true },
    });
    if (dateKey > todayKey(school.timezone)) {
      return NextResponse.json(
        { error: (await getT())("attendance.futureRegister") },
        { status: 422 },
      );
    }

    const result = await saveAttendanceBatch({
      schoolId: ctx.schoolId,
      classId,
      dateKey,
      marks,
      takenByMembershipId: ctx.membershipId,
      actorUserId: ctx.user.id,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AccessError) {
      const status =
        error.code === "UNAUTHENTICATED" ? 401 : error.code === "NOT_FOUND" ? 404 : 403;
      return NextResponse.json({ error: (await getT())(error.key, error.vars) }, { status });
    }
    console.error("[api/attendance] unexpected", error);
    return NextResponse.json({ error: (await getT())("attendance.saveFailed") }, { status: 500 });
  }
}

/** Roster + existing marks for a class/day, used to hydrate and to refresh. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN");
    const url = new URL(request.url);
    const classId = url.searchParams.get("classId");
    if (!classId) {
      return NextResponse.json({ error: "classId is required." }, { status: 400 });
    }

    const school = await db.school.findUniqueOrThrow({
      where: { id: ctx.schoolId },
      select: { timezone: true },
    });
    const dateKey = url.searchParams.get("date") ?? todayKey(school.timezone);
    // The same boundary as the POST: a cover teacher reads the register they
    // are down to mark.
    await assertClassAccessForRegister(ctx, classId, await registerDuty(ctx, classId, dateKey));

    const register = await getRegister(ctx.schoolId, classId, dateKey);
    if (!register) return NextResponse.json({ error: (await getT())("attendance.classNotFound") }, { status: 404 });

    return NextResponse.json(register, {
      // Private: this is one school's roster. A shared cache must never hold it.
      headers: { "Cache-Control": "private, max-age=0, must-revalidate" },
    });
  } catch (error) {
    if (error instanceof AccessError) {
      const status =
        error.code === "UNAUTHENTICATED" ? 401 : error.code === "NOT_FOUND" ? 404 : 403;
      return NextResponse.json({ error: (await getT())(error.key, error.vars) }, { status });
    }
    console.error("[api/attendance] unexpected", error);
    return NextResponse.json({ error: (await getT())("common.somethingWrong") }, { status: 500 });
  }
}
