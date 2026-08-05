import { cn } from "@/lib/cn";
import { formatTimeRange, weekdayName, weekdayShortName } from "@/lib/school-day";
import { formatDateKey } from "@/lib/dates";
import type { WeekGrid, SlotView, PeriodRow, DayColumn } from "@/lib/timetable";

/**
 * A week, rendered twice.
 *
 * TWO LAYOUTS, NOT ONE RESPONSIVE ONE. A timetable is a grid on a desktop and a
 * list of days on a phone, and squeezing the grid into 375px produces six
 * columns of truncated ellipses that nobody can read. This is a PWA that most
 * people will open on a phone, so the phone layout is a real layout rather than
 * a horizontally-scrolled table — the table is what the wide screen gets.
 *
 * READ-ONLY. The builder wraps the same data in its own editable cell, so the
 * two can never disagree about what a lesson looks like.
 */

export type WeekGridProps = WeekGrid & {
  /** Shown in a cell that has no lesson. */
  emptyLabel?: string;
  /** Names the class on each lesson — for a teacher's or pupil's merged week. */
  showClass?: boolean;
  /** Names the teacher on each lesson — for a class's week. */
  showTeacher?: boolean;
  /**
   * Whose timetable this is, when it belongs to somebody.
   *
   * Present so the grid can say "you" instead of reading somebody their own
   * name. A teacher opening their own week and finding "Tom Fielding is away"
   * on it is the third person describing them to themselves — the same bug
   * that put a child's name on their own record page.
   */
  viewerMembershipId?: string | null;
};

function slotKey(weekday: number, periodId: string): string {
  return `${weekday}:${periodId}`;
}

export function indexSlots(slots: SlotView[]): Map<string, SlotView[]> {
  const index = new Map<string, SlotView[]>();
  for (const slot of slots) {
    const key = slotKey(slot.weekday, slot.periodId);
    const bucket = index.get(key) ?? [];
    bucket.push(slot);
    index.set(key, bucket);
  }
  return index;
}

/**
 * What a lesson says, in one place.
 *
 * The cover line is deliberately not "Mrs Rao" with the name quietly swapped:
 * it says who is away and who is taking it. A pupil who turns up expecting one
 * teacher and a teacher who is covering both need the whole sentence, and a
 * silent substitution is how a timetable becomes something people stop trusting.
 */
export function SlotBody({
  slot,
  showClass,
  showTeacher,
  viewerMembershipId,
}: {
  slot: SlotView;
  showClass?: boolean;
  showTeacher?: boolean;
  viewerMembershipId?: string | null;
}) {
  const viewerIsAssigned =
    viewerMembershipId != null && slot.teacherMembershipId === viewerMembershipId;
  const viewerIsCovering =
    viewerMembershipId != null && slot.coveringMembershipId === viewerMembershipId;

  return (
    <>
      <span className="block truncate text-sm font-semibold text-fg">{slot.subject}</span>
      {showClass && (
        <span className="block truncate text-xs text-fg-muted">{slot.className}</span>
      )}
      {showTeacher && slot.teacherName && !slot.coveringName && !slot.uncovered && (
        <span className="block truncate text-xs text-fg-muted">{slot.teacherName}</span>
      )}
      {slot.coveringName && (
        <span className="mt-0.5 block text-xs font-medium text-accent-strong">
          {viewerIsCovering ? "You are covering" : `${slot.coveringName} covering`}
          {slot.teacherName && !viewerIsAssigned ? (
            <span className="text-fg-muted"> for {slot.teacherName}</span>
          ) : null}
          {/* "…covering for you" rather than for your own name, on your own page. */}
          {viewerIsAssigned ? <span className="text-fg-muted"> for you</span> : null}
        </span>
      )}
      {slot.uncovered && (
        <span className="mt-0.5 block text-xs font-medium text-danger">
          {viewerIsAssigned
            ? "You are away"
            : slot.teacherName
              ? `${slot.teacherName} is away`
              : "Teacher away"}{" "}
          · no cover arranged
        </span>
      )}
      {!slot.teacherName && !slot.coveringName && (
        <span className="mt-0.5 block text-xs text-fg-muted">No teacher yet</span>
      )}
      {slot.room && <span className="block truncate text-xs text-fg-muted">{slot.room}</span>}
      {/* Only when the covering line did not already say it — otherwise the
          same fact is stated twice in three lines. */}
      {slot.borrowed && !viewerIsCovering && (
        <span className="mt-0.5 block text-xs text-fg-muted">You are covering this</span>
      )}
    </>
  );
}

function PeriodLabel({ period }: { period: PeriodRow }) {
  return (
    <>
      <span className="block text-sm font-medium text-fg">{period.name}</span>
      <span className="block text-xs tabular-nums text-fg-muted">
        {formatTimeRange(period.startMinute, period.endMinute)}
      </span>
    </>
  );
}

function DayHeading({ day }: { day: DayColumn }) {
  return (
    <>
      <span className={cn("block text-sm font-semibold", day.isToday ? "text-accent-strong" : "text-fg")}>
        {weekdayName(day.weekday)}
      </span>
      {day.dateKey && (
        <span className="block text-xs text-fg-muted">
          {formatDateKey(day.dateKey, { day: "numeric", month: "short" })}
          {day.isToday && " · today"}
        </span>
      )}
      {day.closed && (
        <span className="block truncate text-xs font-medium text-warning">
          {day.closedName ?? "School shut"}
        </span>
      )}
    </>
  );
}

export function WeekGridView({
  periods,
  days,
  slots,
  emptyLabel = "—",
  showClass = false,
  showTeacher = false,
  viewerMembershipId = null,
}: WeekGridProps) {
  const index = indexSlots(slots);
  const lessons = periods.filter((period) => period.kind === "LESSON");

  return (
    <>
      {/* ---------------- phone: one section per day ---------------- */}
      <div className="space-y-4 md:hidden">
        {days.map((day) => {
          const rows = periods.map((period) => ({
            period,
            entries: index.get(slotKey(day.weekday, period.id)) ?? [],
          }));
          /**
           * A DAY WITH NO LESSONS SHOWS NO BREAKS EITHER.
           *
           * Breaks earn their place on the grid by separating lessons. On a day
           * with none, listing "Break / Lunch" and nothing else is worse than an
           * empty state: it reads as a page that failed to load its content
           * rather than as a day with nothing on it. Found by walking a week
           * where only Tuesday was timetabled.
           */
          const hasLessons = rows.some(({ entries }) => entries.length > 0);
          const onThisDay = hasLessons
            ? rows.filter(({ period, entries }) => entries.length > 0 || period.kind === "BREAK")
            : [];

          return (
            <section key={day.weekday} aria-label={weekdayName(day.weekday)}>
              <h3
                className={cn(
                  "mb-2 flex items-baseline gap-2 border-b border-border pb-1",
                  day.isToday && "border-accent",
                )}
              >
                <DayHeading day={day} />
              </h3>
              {onThisDay.length === 0 ? (
                <p className="text-sm text-fg-muted">
                  {day.closed ? "School is shut." : "Nothing timetabled."}
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {onThisDay.map(({ period, entries }) => (
                    <li
                      key={period.id}
                      className={cn(
                        "flex gap-3 rounded-[--radius-sm] p-2.5",
                        period.kind === "BREAK" ? "bg-surface-muted/60" : "bg-surface-muted",
                      )}
                    >
                      <span className="w-24 shrink-0">
                        <PeriodLabel period={period} />
                      </span>
                      <span className="min-w-0 flex-1">
                        {period.kind === "BREAK" ? (
                          <span className="text-sm text-fg-muted">{period.name}</span>
                        ) : entries.length === 0 ? (
                          <span className="text-sm text-fg-muted">{emptyLabel}</span>
                        ) : (
                          entries.map((slot) => (
                            <span key={slot.id} className="block first:mt-0 [&+&]:mt-2">
                              <SlotBody
                                slot={slot}
                                showClass={showClass}
                                showTeacher={showTeacher}
                                viewerMembershipId={viewerMembershipId}
                              />
                            </span>
                          ))
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      {/* ---------------- desktop: the grid ---------------- */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[46rem] border-separate border-spacing-1">
          <caption className="sr-only">The weekly timetable</caption>
          <thead>
            <tr>
              <th scope="col" className="w-28 p-2 text-left align-bottom">
                <span className="text-xs font-medium uppercase tracking-wide text-fg-muted">
                  Period
                </span>
              </th>
              {days.map((day) => (
                <th
                  key={day.weekday}
                  scope="col"
                  className={cn(
                    "rounded-[--radius-sm] p-2 text-left align-bottom",
                    day.isToday && "bg-accent-soft",
                    day.closed && "opacity-60",
                  )}
                >
                  <abbr title={weekdayName(day.weekday)} className="no-underline lg:hidden">
                    {weekdayShortName(day.weekday)}
                  </abbr>
                  <span className="hidden lg:block">
                    <DayHeading day={day} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((period) => (
              <tr key={period.id}>
                <th scope="row" className="p-2 text-left align-top">
                  <PeriodLabel period={period} />
                </th>
                {days.map((day) => {
                  const entries = index.get(slotKey(day.weekday, period.id)) ?? [];
                  if (period.kind === "BREAK") {
                    return (
                      <td
                        key={day.weekday}
                        className="rounded-[--radius-sm] bg-surface-muted/60 p-2 align-top text-xs text-fg-muted"
                      >
                        {period.name}
                      </td>
                    );
                  }
                  return (
                    <td
                      key={day.weekday}
                      className={cn(
                        "rounded-[--radius-sm] p-2 align-top",
                        entries.length > 0 ? "bg-surface-muted" : "bg-surface-muted/40",
                        day.closed && "opacity-50",
                      )}
                    >
                      {entries.length === 0 ? (
                        <span className="text-xs text-fg-muted">{emptyLabel}</span>
                      ) : (
                        entries.map((slot) => (
                          <span key={slot.id} className="block [&+&]:mt-2">
                            <SlotBody
                                slot={slot}
                                showClass={showClass}
                                showTeacher={showTeacher}
                                viewerMembershipId={viewerMembershipId}
                              />
                          </span>
                        ))
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {lessons.length === 0 && (
          <p className="p-4 text-sm text-fg-muted">
            This school has no teaching periods set up yet.
          </p>
        )}
      </div>
    </>
  );
}
