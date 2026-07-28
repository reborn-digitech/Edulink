import type { Metadata } from "next";
import Link from "next/link";
import { ChalkboardTeacherIcon, CaretRightIcon } from "@phosphor-icons/react/ssr";
import { requireRole, assertClassAccess, teacherClassIds } from "@/lib/tenancy";
import { getRegister } from "@/lib/attendance";
import { db } from "@/lib/db";
import { formatDateKey, todayKey, isDateKey } from "@/lib/dates";
import { Register } from "./register";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Take the register" };

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; date?: string }>;
}) {
  const ctx = await requireRole("TEACHER", "ADMIN");
  const params = await searchParams;

  const school = await db.school.findUniqueOrThrow({
    where: { id: ctx.schoolId },
    select: { timezone: true },
  });

  const today = todayKey(school.timezone);
  // A hand-edited ?date= must not reach the database as garbage. (§5)
  const dateKey = params.date && isDateKey(params.date) ? params.date : today;

  const classIds =
    ctx.role === "ADMIN"
      ? (await db.class.findMany({
          where: { schoolId: ctx.schoolId, archivedAt: null },
          select: { id: true },
        })).map((c) => c.id)
      : await teacherClassIds(ctx.schoolId, ctx.membershipId);

  if (classIds.length === 0) {
    return (
      <EmptyState
        icon={<ChalkboardTeacherIcon weight="duotone" className="size-8" />}
        title="You do not have any classes yet"
        description="Once a class is assigned to you it will appear here, ready for the register."
        action={
          ctx.role === "ADMIN" ? (
            <Button asChild>
              <Link href="/admin/classes/new">Create a class</Link>
            </Button>
          ) : undefined
        }
      />
    );
  }

  // One class? Skip the picker entirely — a teacher with a single class should
  // never have to choose it every morning.
  const selectedId =
    params.classId && classIds.includes(params.classId)
      ? params.classId
      : classIds.length === 1
        ? classIds[0]!
        : null;

  if (!selectedId) {
    const classes = await db.class.findMany({
      where: { id: { in: classIds }, schoolId: ctx.schoolId },
      select: { id: true, name: true, subject: true, color: true, _count: { select: { enrollments: true } } },
      orderBy: { name: "asc" },
    });

    const taken = await db.attendanceSession.findMany({
      where: { schoolId: ctx.schoolId, dateKey, classId: { in: classIds } },
      select: { classId: true },
    });
    const takenSet = new Set(taken.map((t) => t.classId));

    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">Take the register</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {formatDateKey(dateKey, { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>

        <ul className="space-y-2">
          {classes.map((klass) => (
            <li key={klass.id}>
              <Card interactive className="overflow-hidden">
                <Link
                  href={`/teacher/attendance?classId=${klass.id}&date=${dateKey}`}
                  className="flex items-center gap-3 p-4"
                >
                  <span
                    aria-hidden="true"
                    className="h-10 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: klass.color ?? "var(--accent)" }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-fg">{klass.name}</span>
                    <span className="block text-xs text-fg-muted">
                      {klass._count.enrollments} student
                      {klass._count.enrollments === 1 ? "" : "s"}
                      {klass.subject ? ` · ${klass.subject}` : ""}
                    </span>
                  </span>
                  {takenSet.has(klass.id) ? (
                    <span className="shrink-0 rounded-full bg-ok-soft px-2.5 py-1 text-xs font-semibold text-ok">
                      Done
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-warn-soft px-2.5 py-1 text-xs font-semibold text-warn">
                      To do
                    </span>
                  )}
                  <CaretRightIcon className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Re-checks that this teacher may touch this class, scoped to their school.
  await assertClassAccess(ctx, selectedId);

  const register = await getRegister(ctx.schoolId, selectedId, dateKey);
  if (!register) {
    return <EmptyState title="That class could not be found" description="It may have been archived." />;
  }

  return (
    <Register
      classId={selectedId}
      className={register.class.name}
      dateKey={dateKey}
      dateLabel={formatDateKey(dateKey, { weekday: "long", day: "numeric", month: "long" })}
      initialRoster={register.roster}
      readOnly={dateKey > today}
    />
  );
}
