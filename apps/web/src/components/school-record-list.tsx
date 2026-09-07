import Link from "next/link";
import { GraduationCapIcon, PrinterIcon } from "@phosphor-icons/react/ssr";
import type { SchoolRecordView } from "@/lib/school-record";
import type { Translate, TranslationKey } from "@/lib/i18n/dictionary";

const REASON_KEY: Record<string, TranslationKey> = {
  TRANSFERRED: "ui.reasonTransferred",
  GRADUATED: "ui.reasonGraduated",
  LEFT: "ui.reasonLeft",
};

function when(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

/**
 * Schools this child has been at before, as certified by those schools.
 *
 * ONE COMPONENT FOR FOUR READERS — the pupil, their guardian, the school that
 * wrote the certificate, and the school that has the child now — because they
 * should all see the same document. A version of this that showed the issuing
 * school more than it showed the family would be a record about a child that the
 * child cannot check.
 *
 * WHAT IS DELIBERATELY ABSENT is any figure that could be mistaken for a
 * judgement. There is an attendance percentage because a receiving school needs
 * it to help a child settle, and there is a count of report cards issued so a
 * family knows how many documents to ask for. There is no overall mark, no
 * grade, no rank, and nothing comparing this child to another — the same rule
 * the dashboards and the badges follow.
 */
/* `t` is a prop — a plain function rendered by server components has no hook
   provider above it (the week-grid precedent). */
export function SchoolRecordList({
  records,
  emptyNote,
  t,
}: {
  t: Translate;
  records: SchoolRecordView[];
  emptyNote?: string;
}) {
  if (records.length === 0) {
    return emptyNote ? <p className="text-sm text-fg-muted">{emptyNote}</p> : null;
  }

  return (
    <ul className="space-y-3">
      {records.map((record) => (
        <li
          key={record.id}
          className="rounded-[--radius-md] border border-border p-4 print:border-black/20"
        >
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-muted text-fg-muted print:hidden">
              <GraduationCapIcon weight="duotone" className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-fg">{record.schoolName}</span>
              <span className="block text-xs text-fg-muted">
                {when(record.joinedAt)} – {when(record.leftAt)}
                {record.gradeLevel ? ` · ${t("ui.leftInGrade", { grade: record.gradeLevel })}` : ""}
              </span>
            </span>
            <span className="shrink-0 text-xs font-medium text-fg-muted">
              {REASON_KEY[record.reason] ? t(REASON_KEY[record.reason]!) : record.reason}
            </span>
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="rounded-[--radius-sm] bg-surface-muted p-2.5 print:bg-transparent print:p-0">
              <dt className="text-xs text-fg-muted">{t("record.attendance")}</dt>
              <dd className="text-lg font-semibold tabular-nums text-fg">
                {/* Never 0% for a child nobody ever marked. A pupil who joined
                    in the last week of term has no attendance, which is a
                    different thing from never turning up. */}
                {record.attendancePercent === null ? "—" : `${record.attendancePercent}%`}
              </dd>
              <dd className="text-xs text-fg-muted">
                {record.attendanceMarked === 0
                  ? t("ui.noRegisterTaken")
                  : `${record.attendancePresent} of ${record.attendanceMarked} days`}
              </dd>
            </div>
            <div className="rounded-[--radius-sm] bg-surface-muted p-2.5 print:bg-transparent print:p-0">
              <dt className="text-xs text-fg-muted">{t("ui.reportCardsIssued")}</dt>
              <dd className="text-lg font-semibold tabular-nums text-fg">
                {record.reportCardCount}
              </dd>
              <dd className="text-xs text-fg-muted">
                {record.reportCardCount === 0 ? t("ui.noneShort") : t("ui.askFamilyCopies")}
              </dd>
            </div>
            {record.destination && (
              <div className="rounded-[--radius-sm] bg-surface-muted p-2.5 print:bg-transparent print:p-0">
                <dt className="text-xs text-fg-muted">{t("ui.wentOnTo")}</dt>
                <dd className="text-sm font-medium text-fg">{record.destination}</dd>
              </div>
            )}
          </dl>

          {record.note && (
            <p className="mt-2.5 text-sm leading-relaxed text-fg-muted">{record.note}</p>
          )}
          <Link
            href={`/certificate/${record.id}`}
            className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-medium text-accent-strong hover:underline"
          >
            <PrinterIcon weight="bold" className="size-4" aria-hidden="true" />
            {t("tc.openDocument")}
          </Link>
        </li>
      ))}
    </ul>
  );
}
