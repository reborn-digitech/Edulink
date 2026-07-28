import { NextResponse } from "next/server";
import { AccessError, assertClassAccess, requireApiRole } from "@/lib/tenancy";
import { attendanceBatchSchema, fieldErrors } from "@/lib/validation";
import { saveAttendanceBatch, getRegister } from "@/lib/attendance";
import { db } from "@/lib/db";
import { todayKey } from "@/lib/dates";

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
      return NextResponse.json(
        { error: "That attendance data is not valid.", issues: fieldErrors(parsed.error) },
        { status: 422 },
      );
    }

    const { classId, dateKey, marks } = parsed.data;

    // classId comes from the client; this re-queries it scoped to the session's
    // school AND (for teachers) to classes they actually teach. (§6 IDOR)
    await assertClassAccess(ctx, classId, { write: true });

    // A register cannot be taken for a future date — that is always a bug or a
    // wrong device clock, and silently accepting it corrupts the history.
    const school = await db.school.findUniqueOrThrow({
      where: { id: ctx.schoolId },
      select: { timezone: true },
    });
    if (dateKey > todayKey(school.timezone)) {
      return NextResponse.json(
        { error: "You cannot take a register for a future date." },
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
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error("[api/attendance] unexpected", error);
    return NextResponse.json({ error: "Something went wrong saving that." }, { status: 500 });
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

    await assertClassAccess(ctx, classId);

    const school = await db.school.findUniqueOrThrow({
      where: { id: ctx.schoolId },
      select: { timezone: true },
    });
    const dateKey = url.searchParams.get("date") ?? todayKey(school.timezone);

    const register = await getRegister(ctx.schoolId, classId, dateKey);
    if (!register) return NextResponse.json({ error: "Class not found." }, { status: 404 });

    return NextResponse.json(register, {
      // Private: this is one school's roster. A shared cache must never hold it.
      headers: { "Cache-Control": "private, max-age=0, must-revalidate" },
    });
  } catch (error) {
    if (error instanceof AccessError) {
      const status =
        error.code === "UNAUTHENTICATED" ? 401 : error.code === "NOT_FOUND" ? 404 : 403;
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error("[api/attendance] unexpected", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
