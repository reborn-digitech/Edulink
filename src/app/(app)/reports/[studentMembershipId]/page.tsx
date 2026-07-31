import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { AccessError, requireUser } from "@/lib/tenancy";
import { buildProgressReport } from "@/lib/reports";
import { formatDateKey } from "@/lib/dates";
import { formatMilli } from "@/lib/validation";
import { Avatar } from "@/components/ui/avatar";
import { ATTENDANCE_META, type AttendanceStatus } from "@/lib/constants";
import { PrintButton } from "./print-button";

export const metadata: Metadata = { title: "Progress report", robots: { index: false, follow: false } };

/**
 * One child's progress report, on one sheet.
 *
 * Built to be PRINTED, which drives the layout: no cards within cards, no
 * colour carrying meaning on its own, and every heading readable in black on
 * white. `.no-print` removes the nav and the controls, so what comes out of the
 * printer is the report and nothing else.
 *
 * The figures are not computed here — `buildProgressReport` asks the same
 * helpers the register and the gradebook use, so a printout can never disagree
 * with the screen a parent is holding it next to.
 */
export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentMembershipId: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await requireUser();
  const { studentMembershipId } = await params;
  const { from, to } = await searchParams;

  let report;
  try {
    report = await buildProgressReport(session, studentMembershipId, { fromKey: from, toKey: to });
  } catch (error) {
    // NOT_FOUND rather than a refusal, as everywhere else: telling somebody a
    // child exists but is not theirs is itself a disclosure.
    if (error instanceof AccessError) notFound();
    throw error;
  }

  const name = report.student.preferredName ?? report.student.name;
  const statuses = ["PRESENT", "LATE", "ABSENT", "EXCUSED"] as const satisfies readonly AttendanceStatus[];

  return (
    <div className="mx-auto max-w-3xl space-y-6 print:max-w-none">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link
          href={session.role === "PARENT" ? "/parent" : "/teacher/classes"}
          className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg"
        >
          <ArrowLeftIcon weight="bold" className="size-4" />
          Back
        </Link>
        <PrintButton />
      </div>

      <header className="flex flex-wrap items-center gap-4 border-b border-border pb-5">
        <Avatar avatarKey={report.student.avatarKey} name={report.student.name} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{report.student.name}</h1>
          <p className="text-sm text-fg-muted">
            {report.school.name}
            {report.student.gradeLevel ? ` · Grade ${report.student.gradeLevel}` : ""}
          </p>
        </div>
        <div className="text-sm text-fg-muted sm:text-right">
          <p className="font-medium text-fg">Progress report</p>
          <p>
            {formatDateKey(report.window.fromKey, { day: "numeric", month: "long" })} to{" "}
            {formatDateKey(report.window.toKey, { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </header>

      <section aria-labelledby="attendance-heading" className="space-y-2.5">
        <h2 id="attendance-heading" className="text-lg font-semibold">
          Attendance
        </h2>
        {report.attendance.total === 0 ? (
          <p className="text-sm text-fg-muted">
            No register was taken for {name} in this period.
          </p>
        ) : (
          <>
            <p className="text-[0.9375rem]">
              <strong className="text-2xl font-bold">{report.attendance.percent}%</strong> of{" "}
              {report.attendance.total} school {report.attendance.total === 1 ? "day" : "days"}.
              {report.attendance.bestStreak > 1 && (
                <> Longest run present: {report.attendance.bestStreak} days.</>
              )}
            </p>
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {statuses.map((status) => (
                <div key={status} className="rounded-[--radius-md] border border-border p-2.5">
                  <dt className="text-xs uppercase tracking-wide text-fg-muted">
                    {ATTENDANCE_META[status].label}
                  </dt>
                  <dd className="text-lg font-semibold">{report.attendance.counts[status]}</dd>
                </div>
              ))}
            </dl>
            <p className="text-xs text-fg-muted">
              A late arrival counts as attended — a child who was there is counted as there.
            </p>
          </>
        )}
      </section>

      <section aria-labelledby="work-heading" className="space-y-2.5">
        <h2 id="work-heading" className="text-lg font-semibold">
          Work
        </h2>
        {report.grades.marked.length === 0 ? (
          <p className="text-sm text-fg-muted">Nothing has been marked for {name} yet.</p>
        ) : (
          <>
            <p className="text-[0.9375rem]">
              <strong className="text-2xl font-bold">{report.grades.overallPercent}%</strong> overall,
              across {report.grades.marked.length} marked{" "}
              {report.grades.marked.length === 1 ? "piece" : "pieces"} of work.
            </p>
            <p className="text-xs text-fg-muted">
              Points earned out of points available — a five-point quiz does not count as much as a
              hundred-point exam.
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
                  <th scope="col" className="py-1.5 font-medium">Work</th>
                  <th scope="col" className="py-1.5 font-medium">Class</th>
                  <th scope="col" className="py-1.5 text-right font-medium">Score</th>
                </tr>
              </thead>
              <tbody>
                {report.grades.marked.map((row, index) => (
                  <tr key={`${row.title}-${index}`} className="border-b border-border/60 align-top">
                    <td className="py-1.5">
                      {row.title}
                      {row.comment && (
                        <span className="block text-xs italic text-fg-muted">“{row.comment}”</span>
                      )}
                    </td>
                    <td className="py-1.5 text-fg-muted">{row.className}</td>
                    <td className="py-1.5 text-right tabular-nums">
                      {formatMilli(row.scoreMilli)}
                      {row.pointsMilli ? ` / ${formatMilli(row.pointsMilli)}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>

      {report.badges.length > 0 && (
        <section aria-labelledby="badges-heading" className="space-y-2.5">
          <h2 id="badges-heading" className="text-lg font-semibold">
            Earned along the way
          </h2>
          {/*
            Said out loud, because otherwise this section contradicts the one
            above it: a badge is earned over its own recent window and is KEPT
            once earned, so a child who had a clean month and was then ill for a
            fortnight can honestly show 82% attendance and "Reached 95%" at the
            same time. Without this line that reads as an error in the document a
            parent studies hardest.
          */}
          <p className="text-xs text-fg-muted">
            Badges are earned over the weeks before they were awarded, and are kept once earned — so
            these may not match the figures above, and that is not a mistake.
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {report.badges.map((badge) => (
              <li key={badge.id} className="rounded-[--radius-md] border border-border p-2.5">
                <p className="text-sm font-medium">{badge.label}</p>
                <p className="text-xs text-fg-muted">{badge.description}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="border-t border-border pt-3 text-xs text-fg-muted">
        <p>
          {report.school.name} · generated{" "}
          {report.generatedAt.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
        <p className="mt-0.5">
          Covers {formatDateKey(report.window.fromKey, { day: "numeric", month: "long", year: "numeric" })} to{" "}
          {formatDateKey(report.window.toKey, { day: "numeric", month: "long", year: "numeric" })}. Ask
          the school if anything here looks wrong.
        </p>
      </footer>
    </div>
  );
}
