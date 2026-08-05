import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarCheckIcon,
  CaretRightIcon,
  ChalkboardTeacherIcon,
  WarningIcon,
} from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import {
  ATTENDANCE_CONCERN_PERCENT,
  classInsights,
  defaultWindow,
  schoolSummary,
} from "@/lib/insights";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { formatDateKey } from "@/lib/dates";
import { WindowPicker } from "./window-picker";
import { getLocale, getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.dashboard") };
}

/**
 * The school, seen whole.
 *
 * THE TOP OF THE PAGE IS WHAT CAN STILL BE FIXED TODAY — registers not taken,
 * leave waiting for a decision — and the rest is the term's shape. A dashboard
 * that opens with a large number nobody can act on is decoration; a principal
 * looks at this between two meetings and needs the actionable thing first.
 *
 * NOTHING HERE RANKS A CHILD. Classes carry figures, because comparing classes
 * is a management question and no eleven-year-old is compared with their friend
 * by it. Pupils appear only inside a class, alphabetically, with concerns
 * flagged rather than ordered — see the note at the top of insights.ts.
 */
export default async function PrincipalDashboard({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const locale = await getLocale();
  const ctx = await requireRole("PRINCIPAL", "ADMIN");
  const { days } = await searchParams;

  // Clamped rather than trusted: this lands in a date range and then a query.
  const span = [7, 30, 90, 180].includes(Number(days)) ? Number(days) : 30;
  const window = await defaultWindow(ctx.schoolId, span);

  const insights = await classInsights(ctx, window);
  const summary = await schoolSummary(ctx, insights);
  const concerns = insights.filter(
    (k) => k.attendance.percent !== null && k.attendance.percent < ATTENDANCE_CONCERN_PERCENT,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {formatDateKey(window.fromDateKey, { day: "numeric", month: "short" }, locale)} to{" "}
            {formatDateKey(window.toDateKey, { day: "numeric", month: "short" }, locale)}
          </p>
        </div>
        <WindowPicker days={span} />
      </div>

      {/* ---------------- what can still be fixed today ---------------- */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Registers not taken today"
          value={String(summary.registersMissingToday)}
          tone={summary.registersMissingToday > 0 ? "warn" : "ok"}
        />
        <StatTile
          label="Leave waiting"
          value={String(summary.pendingLeave)}
          tone={summary.pendingLeave > 0 ? "warn" : "ok"}
        />
        <StatTile
          label="Attendance"
          value={summary.attendancePercent === null ? "—" : `${summary.attendancePercent}%`}
          hint="Across every mark in the window"
          tone={
            summary.attendancePercent !== null &&
            summary.attendancePercent < ATTENDANCE_CONCERN_PERCENT
              ? "warn"
              : "ok"
          }
        />
        <StatTile label="Pupils" value={String(summary.pupils)} />
      </div>

      {summary.pendingLeave > 0 && (
        <Card>
          <Link href="/principal/leave" className="flex items-center gap-3 p-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-warn-soft text-warn">
              <CalendarCheckIcon weight="duotone" className="size-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-fg">
                {summary.pendingLeave} leave request{summary.pendingLeave === 1 ? "" : "s"} waiting
              </span>
              <span className="block text-xs text-fg-muted">
                Approving arranges cover for the registers they mark
              </span>
            </span>
            <CaretRightIcon className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
          </Link>
        </Card>
      )}

      {/* ---------------- classes needing a look ---------------- */}
      <Card>
        <CardHeader
          icon={<ChalkboardTeacherIcon weight="duotone" className="size-5" />}
          title={concerns.length > 0 ? "Classes worth a look" : "Classes"}
          description={
            concerns.length > 0
              ? `Attendance below ${ATTENDANCE_CONCERN_PERCENT}% over this window`
              : "Nothing below the attendance line in this window"
          }
          action={
            <Link
              href={`/principal/classes?days=${span}`}
              className="text-sm font-semibold text-accent-strong hover:underline"
            >
              All {insights.length}
            </Link>
          }
        />
        <CardBody>
          {insights.length === 0 ? (
            <EmptyState
              title="No classes yet"
              description="Once an admin creates classes they appear here."
            />
          ) : concerns.length === 0 ? (
            <p className="text-sm text-fg-muted">
              Every class is at or above {ATTENDANCE_CONCERN_PERCENT}%. Open the full list to see
              them all, with academic progress and report cards.
            </p>
          ) : (
            <ul className="space-y-2">
              {concerns.map((klass) => (
                <li key={klass.classId}>
                  <Link
                    href={`/principal/classes/${klass.classId}?days=${span}`}
                    className="flex flex-wrap items-center gap-3 rounded-[--radius-md] bg-surface-muted p-3.5 transition-colors hover:bg-surface"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-fg">
                        {klass.name}
                        {klass.section ? ` · ${klass.section}` : ""}
                      </span>
                      <span className="block text-xs text-fg-muted">
                        {klass.pupils} pupil{klass.pupils === 1 ? "" : "s"} · {klass.sessionsTaken}{" "}
                        register{klass.sessionsTaken === 1 ? "" : "s"} taken
                      </span>
                    </span>
                    <span className="text-lg font-bold tabular-nums text-warn">
                      {klass.attendance.percent}%
                    </span>
                    <CaretRightIcon className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

    </div>
  );
}
