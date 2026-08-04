import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ArrowSquareOutIcon, WarningIcon } from "@phosphor-icons/react/ssr";
import { requireRole, AccessError } from "@/lib/tenancy";
import {
  ATTENDANCE_CONCERN_PERCENT,
  defaultWindow,
  pupilInsights,
  type PupilInsight,
} from "@/lib/insights";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { formatDateKey } from "@/lib/dates";
import { WindowPicker } from "../../window-picker";

export const metadata: Metadata = { title: "Class insights" };

/**
 * One class, pupil by pupil.
 *
 * ALPHABETICAL, ALWAYS, and there is no sort control. Ordering thirty children
 * by their attendance or their marks is a ranking of children, which this app
 * has said in several places it will not build. What a principal actually needs
 * — "who is not getting what they need?" — is answered by FLAGGING the ones
 * below the line, which is a shorter list and a more useful one.
 *
 * Their report cards hang off each row, because "how is this child doing?" is
 * answered by the document their family was sent, not by a number in a table.
 */
export default async function PrincipalClassPage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ days?: string }>;
}) {
  const ctx = await requireRole("PRINCIPAL", "ADMIN");
  const { classId } = await params;
  const { days } = await searchParams;

  const span = [7, 30, 90, 180].includes(Number(days)) ? Number(days) : 30;
  const window = await defaultWindow(ctx.schoolId, span);

  let data;
  try {
    data = await pupilInsights(ctx, classId, window);
  } catch (error) {
    // A class from another school is a 404, not a 500 — the same catch the
    // report-card builder needed, and for the same reason.
    if (error instanceof AccessError) notFound();
    throw error;
  }

  const concerns = data.pupils.filter(
    (p) => p.attendancePercent !== null && p.attendancePercent < ATTENDANCE_CONCERN_PERCENT,
  );
  const unmarked = data.pupils.filter((p) => !p.hasMarks);

  return (
    <div className="space-y-5">
      <Link
        href={`/principal?days=${span}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon weight="bold" className="size-4" />
        Dashboard
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            {data.klass.name}
            {data.klass.section ? ` · ${data.klass.section}` : ""}
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            {data.pupils.length} pupil{data.pupils.length === 1 ? "" : "s"} ·{" "}
            {formatDateKey(window.fromDateKey, { day: "numeric", month: "short" })} to{" "}
            {formatDateKey(window.toDateKey, { day: "numeric", month: "short" })}
          </p>
        </div>
        <WindowPicker days={span} />
      </div>

      {/* ---------------- what needs a look ---------------- */}
      {(concerns.length > 0 || unmarked.length > 0) && (
        <Card>
          <CardHeader
            icon={<WarningIcon weight="duotone" className="size-5" />}
            title="Worth a look"
            description="Flagged against a threshold, not ranked"
          />
          <CardBody className="space-y-3">
            {concerns.length > 0 && (
              <div>
                <p className="text-xs font-medium text-fg">
                  Attendance below {ATTENDANCE_CONCERN_PERCENT}%
                </p>
                <p className="mt-1 text-sm text-fg-muted">
                  {concerns.map((p) => `${p.name} (${p.attendancePercent}%)`).join(", ")}
                </p>
              </div>
            )}
            {unmarked.length > 0 && (
              <div>
                <p className="text-xs font-medium text-fg">No marks recorded yet</p>
                <p className="mt-1 text-sm text-fg-muted">
                  {unmarked.map((p) => p.name).join(", ")}
                </p>
                {/* Almost always a fact about the marking, not about the child. */}
                <p className="mt-1 text-xs text-fg-subtle">
                  Usually means work has not been marked yet, rather than anything about them.
                </p>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* ---------------- everybody ---------------- */}
      <Card>
        <CardHeader title="Everybody" description="In alphabetical order" />
        <CardBody>
          {data.pupils.length === 0 ? (
            <EmptyState
              title="Nobody on this roll"
              description="An admin adds pupils to a class from the class staffing page."
            />
          ) : (
            <ul className="space-y-1.5">
              {data.pupils.map((pupil) => (
                <PupilRow key={pupil.membershipId} pupil={pupil} />
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function PupilRow({ pupil }: { pupil: PupilInsight }) {
  const concern =
    pupil.attendancePercent !== null && pupil.attendancePercent < ATTENDANCE_CONCERN_PERCENT;

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-[--radius-sm] bg-surface-muted p-3">
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-fg">{pupil.name}</span>
        <span className="block text-xs text-fg-muted">
          {pupil.attendanceMarks === 0
            ? "No register marks in this window"
            : `${pupil.attendanceMarks} register mark${pupil.attendanceMarks === 1 ? "" : "s"}`}
        </span>
      </span>

      <span className="text-right">
        <span className="block text-[0.6875rem] text-fg-muted">Attendance</span>
        <span
          className={
            concern
              ? "block text-sm font-semibold tabular-nums text-warn"
              : "block text-sm font-semibold tabular-nums text-fg"
          }
        >
          {pupil.attendancePercent === null ? "—" : `${pupil.attendancePercent}%`}
        </span>
      </span>

      <span className="text-right">
        <span className="block text-[0.6875rem] text-fg-muted">Progress</span>
        <span className="block text-sm font-semibold tabular-nums text-fg">
          {pupil.overallPercent === null ? "—" : `${pupil.overallPercent}%`}
        </span>
      </span>

      {pupil.latestCard ? (
        <Link
          href={`/report-cards/${pupil.latestCard.id}`}
          className="flex shrink-0 items-center gap-1 text-xs font-semibold text-accent-strong hover:underline"
        >
          {pupil.latestCard.title}
          {pupil.latestCard.status === "DRAFT" && (
            <Badge tone="warn" size="sm">
              draft
            </Badge>
          )}
          <ArrowSquareOutIcon className="size-3.5" />
        </Link>
      ) : (
        <span className="shrink-0 text-xs text-fg-subtle">No report card</span>
      )}
    </li>
  );
}
