import type { Metadata } from "next";
import Link from "next/link";
import {
  ChalkboardTeacherIcon,
  CaretRightIcon,
  ClockCounterClockwiseIcon,
  WarningIcon,
} from "@phosphor-icons/react/ssr";
import { requireRole, assertClassAccess } from "@/lib/tenancy";
import { classesIMayTake, registerDuty } from "@/lib/register-duty";
import { getRegister } from "@/lib/attendance";
import { closedOn } from "@/lib/holidays";
import { db } from "@/lib/db";
import { formatDateKey, todayKey, isDateKey } from "@/lib/dates";
import { Register } from "./register";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.takeRegister") };
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; date?: string }>;
}) {
  const t = await getT();
  const ctx = await requireRole("TEACHER", "ADMIN");
  const params = await searchParams;

  const school = await db.school.findUniqueOrThrow({
    where: { id: ctx.schoolId },
    select: { timezone: true },
  });

  const today = todayKey(school.timezone);
  // A hand-edited ?date= must not reach the database as garbage. (§5)
  const dateKey = params.date && isDateKey(params.date) ? params.date : today;

  // The school calendar's one job in this path. See the note on ClosedDayNotice.
  const calendar = await closedOn(ctx.schoolId, dateKey);

  // NOT "classes I teach" — "classes I am down to mark today". The two differ
  // for a teacher whose register duty was withdrawn, and for one covering
  // somebody else's class this week without teaching it at all.
  const classIds = await classesIMayTake(ctx, dateKey);

  if (classIds.length === 0) {
    return (
      <EmptyState
        icon={<ChalkboardTeacherIcon weight="duotone" className="size-8" />}
        title={t("teacher.noRegisterToday")}
        description={t("teacher.noRegisterBody")}
        action={
          ctx.role === "ADMIN" ? (
            <Button asChild>
              <Link href="/admin/classes/new">{t("teacher.createClass")}</Link>
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
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-fg">{t("teacher.takeRegister")}</h1>
            <p className="mt-1 text-sm text-fg-muted">
              {formatDateKey(dateKey, { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <PastRegistersLink label={t("attendanceHistory.link")} />
        </div>

        <ClosedDayNotice calendar={calendar} dateKey={dateKey} />

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
                      {t("teacher.done")}
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-warn-soft px-2.5 py-1 text-xs font-semibold text-warn">
                      {t("teacher.toDo")}
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
  // …and separately, that they are down to mark it today. The list above is
  // already filtered, so this is the belt to that braces: a hand-typed
  // ?classId= reaches here without passing through it.
  const duty = await registerDuty(ctx, selectedId, dateKey);
  if (!duty.may) {
    return (
      <EmptyState
        icon={<ChalkboardTeacherIcon weight="duotone" className="size-8" />}
        title={t("teacher.notYourRegister")}
        description={t("teacher.notYoursBody")}
      />
    );
  }

  const register = await getRegister(ctx.schoolId, selectedId, dateKey);
  if (!register) {
    return <EmptyState title={t("teacher.classNotFound")} description={t("teacher.mayBeArchived")} />;
  }

  return (
    <div className="space-y-4">
      {/* Past registers belong to the class teacher, not to whoever is
          covering this week — so a cover teacher is not shown a door that
          would only refuse them. */}
      {duty.reason !== "COVER" && (
        <div className="flex justify-end">
          <PastRegistersLink classId={selectedId} label={t("attendanceHistory.link")} />
        </div>
      )}
      <ClosedDayNotice calendar={calendar} dateKey={dateKey} />
      {duty.reason === "COVER" && (
        // Said out loud, because somebody marking a register they do not
        // normally mark should know why they can, and until when.
        <p className="rounded-[--radius-md] border border-accent/30 bg-accent-soft px-4 py-3 text-sm font-medium text-accent-strong">
          {t("teacher.coveringUntil", {
            date: formatDateKey(duty.coverUntil!, { day: "numeric", month: "long" }),
          })}
        </p>
      )}
      <Register
        classId={selectedId}
      className={register.class.name}
      dateKey={dateKey}
      dateLabel={formatDateKey(dateKey, { weekday: "long", day: "numeric", month: "long" })}
        initialRoster={register.roster}
        readOnly={dateKey > today}
      />
    </div>
  );
}

/** The one door to the month grid — on the register, never in the nav. */
function PastRegistersLink({ classId, label }: { classId?: string; label: string }) {
  return (
    <Button asChild variant="ghost" size="sm" icon={<ClockCounterClockwiseIcon weight="bold" />}>
      <Link href={classId ? `/attendance/history?classId=${classId}` : "/attendance/history"}>
        {label}
      </Link>
    </Button>
  );
}

/**
 * "The school is shut today."
 *
 * WARNS, DOES NOT BLOCK, and the distinction is the whole design. Thirty
 * children marked absent on Diwali is a denominator that genuinely lies, and it
 * happens because somebody opened the register out of habit. But schools do
 * teach on days the calendar calls a break — catch-up classes, exam sessions,
 * Saturday school — and a teacher standing in front of a real class must not be
 * told by the app that the class does not exist.
 *
 * So the strongest thing available is a sentence, before the fact, that is hard
 * to miss and easy to overrule.
 *
 * An EXAM or EVENT is shown too, without the warning colour: the school is open
 * and the register is expected, but a teacher still wants to know what today is.
 */
function ClosedDayNotice({
  calendar,
  dateKey,
}: {
  calendar: { closed: boolean; entries: { name: string; kind: string }[] };
  dateKey: string;
}) {
  if (calendar.entries.length === 0) return null;

  const names = calendar.entries.map((entry) => entry.name).join(" · ");
  const pretty = formatDateKey(dateKey, { weekday: "long", day: "numeric", month: "long" });

  if (!calendar.closed) {
    return (
      <p className="rounded-[--radius-md] border border-border bg-surface-muted px-3.5 py-2.5 text-sm text-fg-muted">
        <span className="font-semibold text-fg">{names}</span> — {pretty}. School is open, so the
        register is still taken as usual.
      </p>
    );
  }

  return (
    <div
      role="status"
      className="flex items-start gap-2.5 rounded-[--radius-md] border border-warn/40 bg-warn-soft/50 p-3.5"
    >
      <WarningIcon weight="fill" className="mt-0.5 size-5 shrink-0 text-warn" aria-hidden="true" />
      <p className="text-sm text-fg">
        <span className="font-semibold">The school is shut on {pretty}</span> — {names}. You can
        still take the register if a class really is running, but everyone you mark absent will be
        counted absent.
      </p>
    </div>
  );
}
