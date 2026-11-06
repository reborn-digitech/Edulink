import Link from "next/link";
import { CalendarXIcon, ChalkboardTeacherIcon, ClipboardTextIcon, ConfettiIcon, ExamIcon, ReceiptIcon, TrophyIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import { formatPaise } from "@edulink/i18n";
import type { Agenda, AgendaKind, AgendaRow } from "@/lib/agenda";
import { addDaysToKey, formatDateKey, formatInZone } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { getLocale, getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { EnrolButton } from "./enrol-button";

/**
 * The fortnight as a dated list: one group per day that has something,
 * each row a link to the page that owns it. The pupil's and the guardian's
 * pages both draw this; the rows already carry the right href for the role.
 */
export const AGENDA_KIND_KEY: Record<AgendaKind, TranslationKey> = {
  EXAM: "agenda.kindExam",
  WORK: "agenda.kindWork",
  SESSION: "agenda.kindSession",
  MEETING: "agenda.kindMeeting",
  CLOSURE: "agenda.kindClosure",
  EVENT: "agenda.kindEvent",
  FEE: "agenda.kindFee",
  COMPETITION: "agenda.kindCompetition",
};

const KIND_TONE: Record<AgendaKind, "neutral" | "accent" | "ok" | "warn" | "danger" | "info" | "outline"> = {
  EXAM: "danger",
  WORK: "warn",
  SESSION: "accent",
  MEETING: "info",
  CLOSURE: "neutral",
  EVENT: "ok",
  FEE: "warn",
  COMPETITION: "accent",
};

function KindIcon({ kind }: { kind: AgendaKind }) {
  const className = "size-5 shrink-0 text-fg-muted";
  switch (kind) {
    case "EXAM":
      return <ExamIcon weight="duotone" className={className} />;
    case "WORK":
      return <ClipboardTextIcon weight="duotone" className={className} />;
    case "SESSION":
      return <ChalkboardTeacherIcon weight="duotone" className={className} />;
    case "MEETING":
      return <UsersThreeIcon weight="duotone" className={className} />;
    case "CLOSURE":
      return <CalendarXIcon weight="duotone" className={className} />;
    case "EVENT":
      return <ConfettiIcon weight="duotone" className={className} />;
    case "FEE":
      return <ReceiptIcon weight="duotone" className={className} />;
    case "COMPETITION":
      return <TrophyIcon weight="duotone" className={className} />;
  }
}

/** Rows grouped by their day, in order. Exported for the page tests. */
export function groupByDay(rows: AgendaRow[]): { dateKey: string; rows: AgendaRow[] }[] {
  const out: { dateKey: string; rows: AgendaRow[] }[] = [];
  for (const row of rows) {
    const last = out[out.length - 1];
    if (last && last.dateKey === row.dateKey) last.rows.push(row);
    else out.push({ dateKey: row.dateKey, rows: [row] });
  }
  return out;
}

/** `role`: whose agenda, for the competition rows' Enrol button (decision 0007): the pupil enrols themself, the guardian the agenda's child. */
export async function AgendaList({ agenda, role }: { agenda: Agenda; role: "STUDENT" | "PARENT" }) {
  const t = await getT();
  const locale = await getLocale();
  const tomorrow = addDaysToKey(agenda.fromKey, 1);
  const dayLabel = (key: string) => (key === agenda.fromKey ? t("agenda.today") : key === tomorrow ? t("agenda.tomorrow") : formatDateKey(key, { weekday: "long", day: "numeric", month: "short" }, locale));

  if (agenda.rows.length === 0) {
    return <EmptyState icon={<ConfettiIcon weight="duotone" className="size-8" />} title={t("agenda.empty", { days: agenda.days })} />;
  }
  return (
    <div className="space-y-4" data-testid="agenda">
      {groupByDay(agenda.rows).map((day) => (
        <section key={day.dateKey} className="space-y-2" data-date={day.dateKey}>
          <h2 className="text-sm font-semibold text-fg">
            {dayLabel(day.dateKey)}
            {day.dateKey === agenda.fromKey || day.dateKey === tomorrow ? <span className="ml-2 font-normal text-fg-muted">{formatDateKey(day.dateKey, { weekday: "short", day: "numeric", month: "short" }, locale)}</span> : null}
          </h2>
          <ul className="divide-y divide-border rounded-[var(--radius-lg)] border border-border bg-surface shadow-sm">
            {day.rows.map((row) => (
              <li key={row.id} data-kind={row.kind}>
                <Link href={row.href} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-muted/60">
                  <KindIcon kind={row.kind} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-fg">{row.title}</span>
                    <span className="block truncate text-xs text-fg-muted">
                      {[
                        row.at ? formatInZone(new Date(row.at), agenda.timeZone, { timeStyle: "short" }, locale) : null,
                        row.endDateKey ? t("agenda.through", { date: formatDateKey(row.endDateKey, { day: "numeric", month: "short" }, locale) }) : null,
                        row.detail,
                        row.amountPaise !== null ? formatPaise(row.amountPaise, locale) : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  {row.kind === "COMPETITION" && row.competition && (
                    <EnrolButton competitionId={row.competition.competitionId} state={row.competition.enrol} studentMembershipId={agenda.student.studentMembershipId} role={role} />
                  )}
                  <Badge tone={KIND_TONE[row.kind]} size="sm">
                    {t(AGENDA_KIND_KEY[row.kind])}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
