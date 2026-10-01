import type { Metadata } from "next";
import Link from "next/link";
import {
  ChalkboardTeacherIcon,
  CaretRightIcon,
  ClockCounterClockwiseIcon,
  WarningIcon,
} from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { assertClassAccessForRegister, classesIMayTake, registerDuty } from "@/lib/register-duty";
import { getRegister } from "@/lib/attendance";
import { closedOn } from "@/lib/holidays";
import { db } from "@/lib/db";
import { addDaysToKey, formatDateKey, todayKey, isDateKey } from "@/lib/dates";
import { Register } from "./register";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { getT, getLocale } from "@/lib/i18n/server";
import type { Translate } from "@/lib/i18n/dictionary";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.takeRegister") };
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; date?: string; only?: string }>;
}) {
  const t = await getT();
  const locale = await getLocale();
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
      select: { id: true, name: true, subject: true, color: true, _count: { select: { enrollments: { where: { status: "ACTIVE" } } } } },
      orderBy: { name: "asc" },
    });

    const taken = await db.attendanceSession.findMany({
      where: { schoolId: ctx.schoolId, dateKey, classId: { in: classIds } },
      select: { classId: true },
    });
    const takenSet = new Set(taken.map((t) => t.classId));
    const onlyUnmarked = params.only === "unmarked";
    const shown = onlyUnmarked ? classes.filter((klass) => !takenSet.has(klass.id)) : classes;
    const unmarkedCount = classes.filter((klass) => !takenSet.has(klass.id)).length;

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <PageHeader title={t("teacher.takeRegister")} description={formatDateKey(dateKey, { weekday: "long", day: "numeric", month: "long" }, locale)} />
          <PastRegistersLink label={t("attendanceHistory.link")} />
        </div>

        {/* Yesterday's forgotten register was three clicks through the month
            grid; now it is one chip. "Not marked" hides the classes already
            done so the list is the to-do list. */}
        <DayChips today={today} dateKey={dateKey} only={onlyUnmarked ? "unmarked" : null} unmarkedCount={unmarkedCount} t={t} />

        <ClosedDayNotice
        calendar={calendar}
        locale={locale}
        dateKey={dateKey}
        sundayNote={calendar.teachingDay ? null : t("teacher.sundayRegister")}
        openDayNote={(date) => t("teacher.openDayNote", { date })}
        closedDayTitle={(date) => t("teacher.closedDayTitle", { date })}
        closedDayBody={t("teacher.closedDayBody")}
      />

        {shown.length === 0 ? (
          <EmptyState
            icon={<ChalkboardTeacherIcon weight="duotone" className="size-8" />}
            title={t("teacher.allMarkedTitle")}
            description={t("teacher.allMarkedBody")}
          />
        ) : (
        <ul className="space-y-2">
          {shown.map((klass) => (
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
                      {klass._count.enrollments === 1
                        ? t("teacher.studentsCountOne")
                        : t("teacher.studentsCount", { count: klass._count.enrollments })}
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
        )}
      </div>
    );
  }

  // That they are down to mark it today. The list above is already filtered,
  // so this is the belt to that braces: a hand-typed ?classId= reaches here
  // without passing through it.
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

  // …and the tenant boundary, drawn so that a cover row counts for the
  // teacher it names.
  await assertClassAccessForRegister(ctx, selectedId, duty);
  const register = await getRegister(ctx.schoolId, selectedId, dateKey);
  if (!register) {
    return <EmptyState title={t("teacher.classNotFound")} description={t("teacher.mayBeArchived")} />;
  }

  return (
    <div className="space-y-4">
      {/* Past registers belong to the class teacher, not to whoever is
          covering this week — so a cover teacher is not shown a door that
          would only refuse them. */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <DayChips today={today} dateKey={dateKey} classId={selectedId} t={t} />
        {duty.reason !== "COVER" && <PastRegistersLink classId={selectedId} label={t("attendanceHistory.link")} />}
      </div>
      <ClosedDayNotice
        calendar={calendar}
        locale={locale}
        dateKey={dateKey}
        sundayNote={calendar.teachingDay ? null : t("teacher.sundayRegister")}
        openDayNote={(date) => t("teacher.openDayNote", { date })}
        closedDayTitle={(date) => t("teacher.closedDayTitle", { date })}
        closedDayBody={t("teacher.closedDayBody")}
      />
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
      dateLabel={formatDateKey(dateKey, { weekday: "long", day: "numeric", month: "long" }, locale)}
        initialRoster={register.roster}
        readOnly={dateKey > today}
      />
    </div>
  );
}

/**
 * Yesterday and today as two chips, the current one solid. Any other date
 * (reached from the month grid) shows as a third chip so the person can see
 * they are not on today and get back with one press.
 */
function DayChips({
  today,
  dateKey,
  classId,
  only,
  unmarkedCount,
  t,
}: {
  today: string;
  dateKey: string;
  classId?: string;
  only?: string | null;
  unmarkedCount?: number;
  t: Translate;
}) {
  const yesterday = addDaysToKey(today, -1);
  const base = classId ? `/teacher/attendance?classId=${classId}&date=` : "/teacher/attendance?date=";
  const chips: { key: string; href: string; label: string; on: boolean; count?: number }[] = [
    { key: "yesterday", href: `${base}${yesterday}`, label: t("teacher.yesterday"), on: dateKey === yesterday && !only },
    { key: "today", href: classId ? `/teacher/attendance?classId=${classId}` : "/teacher/attendance", label: t("teacher.today"), on: dateKey === today && !only },
  ];
  if (dateKey !== today && dateKey !== yesterday) {
    chips.push({ key: "other", href: `${base}${dateKey}`, label: formatDateKey(dateKey, { day: "numeric", month: "short" }), on: !only });
  }
  if (unmarkedCount !== undefined && unmarkedCount > 0 && !classId) {
    chips.push({ key: "unmarked", href: `${base}${dateKey}&only=unmarked`, label: t("teacher.notMarkedOnly"), on: only === "unmarked", count: unmarkedCount });
  }
  return (
    <div role="group" aria-label={t("teacher.dayLabel")} className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <Link
          key={chip.key}
          href={chip.href}
          aria-current={chip.on ? "page" : undefined}
          className={
            chip.on
              ? "inline-flex min-h-11 items-center rounded-full bg-accent px-3 text-xs font-medium text-accent-fg"
              : "inline-flex min-h-11 items-center rounded-full border border-border bg-surface px-3 text-xs font-medium text-fg-muted hover:bg-surface-muted hover:text-fg"
          }
        >
          {chip.label}
          {chip.count !== undefined && <span className="ml-1 tabular-nums opacity-80">{chip.count}</span>}
        </Link>
      ))}
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
  locale,
  sundayNote,
  openDayNote,
  closedDayTitle,
  closedDayBody,
}: {
  calendar: { closed: boolean; entries: { name: string; kind: string }[] };
  dateKey: string;
  locale: string;
  /** Translated on the server and handed down: this notice is the one place
   * on the page that used to speak English whatever the teacher chose. */
  openDayNote: (date: string) => string;
  closedDayTitle: (date: string) => string;
  closedDayBody: string;
  /** Set on a day the school week does not include — the same warning as a
   * closed day, for the same reason: a register taken by habit on a Sunday
   * marks a whole class absent. */
  sundayNote: string | null;
}) {
  if (calendar.entries.length === 0) {
    if (!sundayNote) return null;
    return (
      <div
        role="status"
        data-testid="register-day-notice"
        data-kind="not-teaching"
        className="flex items-start gap-2.5 rounded-[--radius-md] border border-warn/40 bg-warn-soft/50 p-3.5"
      >
        <WarningIcon weight="fill" className="mt-0.5 size-5 shrink-0 text-warn" aria-hidden="true" />
        <p className="text-sm text-fg">{sundayNote}</p>
      </div>
    );
  }

  const names = calendar.entries.map((entry) => entry.name).join(" · ");
  const pretty = formatDateKey(dateKey, { weekday: "long", day: "numeric", month: "long" }, locale);

  if (!calendar.closed) {
    return (
      <p data-testid="register-day-notice" data-kind="open" className="rounded-[--radius-md] border border-border bg-surface-muted px-3.5 py-2.5 text-sm text-fg-muted">
        <span className="font-semibold text-fg">{names}</span> — {openDayNote(pretty)}
      </p>
    );
  }

  return (
    <div
      role="status"
      data-testid="register-day-notice"
      data-kind="closed"
      className="flex items-start gap-2.5 rounded-[--radius-md] border border-warn/40 bg-warn-soft/50 p-3.5"
    >
      <WarningIcon weight="fill" className="mt-0.5 size-5 shrink-0 text-warn" aria-hidden="true" />
      <p className="text-sm text-fg">
        <span className="font-semibold">{closedDayTitle(pretty)}</span> — {names}. {closedDayBody}
      </p>
    </div>
  );
}
