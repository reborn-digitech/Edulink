import type { Metadata } from "next";
import Link from "next/link";
import { CaretLeftIcon, CaretRightIcon, PrinterIcon, UserSwitchIcon, UsersThreeIcon, WarningIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { substitutionBoard } from "@/lib/substitutions";
import { addDaysToKey, formatDateKey, isDateKey, todayKey } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { getLocale, getT } from "@/lib/i18n/server";
import { Board, BoardLive } from "./board";
import { DayPicker } from "./day-picker";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("substitutions.metaTitle") };
}

/**
 * The substitution board, for the office and the head: one day's lessons
 * whose teacher is away, who is covering each and who could. The day is in
 * the URL so tomorrow's board can be worked the evening before and today's
 * can be bookmarked; the print page beside it is the sheet for the staff
 * room door.
 */
export default async function SubstitutionsPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const t = await getT();
  const locale = await getLocale();
  const { date: requestedDate } = await searchParams;

  const school = await db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } });
  const today = todayKey(school.timezone);
  const date = requestedDate && isDateKey(requestedDate) ? requestedDate : today;
  const board = await substitutionBoard(ctx, date);

  const dayHref = (d: string) => `/admin/substitutions?date=${d}`;
  const dayLabel = formatDateKey(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" }, locale);
  const summary = board.closed
    ? dayLabel
    : [dayLabel, t("substitutions.lessonsToCover", { count: board.lessons.length }), t("substitutions.coveredOf", { covered: board.covered, total: board.lessons.length })].join(" · ");

  return (
    <div className="space-y-6">
      <PageHeader title={t("substitutions.title")} description={t("substitutions.intro")} />

      <Card>
        <CardHeader
          icon={<UserSwitchIcon weight="duotone" className="size-5" />}
          title={t("substitutions.forDay", { date: dayLabel })}
          description={summary}
          action={
            !board.closed && board.lessons.length > 0 ? (
              <Button asChild variant="secondary" size="sm" icon={<PrinterIcon weight="bold" />}>
                <Link href={`/admin/substitutions/print?date=${date}`}>{t("substitutions.printBoard")}</Link>
              </Button>
            ) : undefined
          }
        />
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-end gap-2">
            <DayPicker dateKey={date} />
            <div className="flex flex-wrap items-center gap-2 pb-1">
              <Button asChild variant="secondary" size="sm" icon={<CaretLeftIcon weight="bold" />}>
                <Link href={dayHref(addDaysToKey(date, -1))}>{t("substitutions.previousDay")}</Link>
              </Button>
              <Button asChild variant="secondary" size="sm" iconRight={<CaretRightIcon weight="bold" />}>
                <Link href={dayHref(addDaysToKey(date, 1))}>{t("substitutions.nextDay")}</Link>
              </Button>
              {date !== today && (
                <Button asChild variant="ghost" size="sm">
                  <Link href={dayHref(today)}>{t("substitutions.today")}</Link>
                </Button>
              )}
            </div>
          </div>

          <BoardLive dateKey={date} />

          {board.closed ? (
            <p className="flex items-center gap-2 rounded-[var(--radius-md)] border border-warn/40 bg-warn-soft px-3 py-2 text-sm text-warn">
              <WarningIcon weight="fill" className="size-4 shrink-0" aria-hidden="true" />
              {board.closedName ? t("substitutions.closedNamed", { name: board.closedName }) : t("substitutions.closedDay")}
            </p>
          ) : board.absent.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-6" icon={<UsersThreeIcon weight="duotone" className="size-6" />} title={t("substitutions.nobodyAway")} description={t("substitutions.nobodyAwayBody")} />
          ) : (
            <>
              {/* ---- who is away ---- */}
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium text-fg">{t("substitutions.awayToday")}:</span>
                {board.absent.map((person) => (
                  <span key={person.membershipId} className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-fg">
                    {person.name}
                    <Badge tone={person.reason === "ABSENT" ? "danger" : "neutral"} size="sm">
                      {person.reason === "ABSENT" ? t("substitutions.reasonAbsent") : t("substitutions.reasonOnLeave")}
                    </Badge>
                    <span className="tabular-nums text-fg-muted">{t("substitutions.coveredOf", { covered: person.covered, total: person.lessons })}</span>
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge tone={board.uncovered === 0 ? "ok" : "warn"} size="md">
                  {t("substitutions.coveredOf", { covered: board.covered, total: board.lessons.length })}
                </Badge>
                {board.uncovered > 0 && (
                  <span className="text-fg-muted">
                    {t("substitutions.uncovered")}: {board.uncovered}
                  </span>
                )}
              </div>

              {board.lessons.length === 0 ? (
                <p className="py-4 text-center text-sm text-fg-muted">{t("substitutions.nobodyAwayBody")}</p>
              ) : (
                <Board key={date} board={board} />
              )}
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
