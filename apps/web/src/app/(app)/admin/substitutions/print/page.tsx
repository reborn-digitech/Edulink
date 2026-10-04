import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { substitutionBoard } from "@/lib/substitutions";
import { formatDateKey, isDateKey, todayKey } from "@/lib/dates";
import { formatTimeRange } from "@/lib/school-day";
import { getLocale, getT } from "@/lib/i18n/server";
import { periodLabel } from "@/lib/coded-defaults";
import { PrintButton } from "./print-button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("substitutions.metaTitle"), robots: { index: false, follow: false } };
}

/**
 * The board as a sheet for the staff-room door: one plain table, period by
 * period, with who is away and who is standing in. `print:` classes strip
 * the app chrome and force black on white, the idiom of the report card.
 */
export default async function SubstitutionsPrintPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const t = await getT();
  const locale = await getLocale();
  const { date: requestedDate } = await searchParams;

  const school = await db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true, name: true } });
  const date = requestedDate && isDateKey(requestedDate) ? requestedDate : todayKey(school.timezone);
  const board = await substitutionBoard(ctx, date);
  const dayLabel = formatDateKey(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" }, locale);
  const reasonOf = (reason: "ABSENT" | "ON_LEAVE") => (reason === "ABSENT" ? t("substitutions.reasonAbsent") : t("substitutions.reasonOnLeave"));
  const head = "py-2 pr-3 text-left font-semibold";
  const cell = "py-2 pr-3 align-top text-fg print:text-black";

  return (
    <article className="mx-auto max-w-3xl print:max-w-none">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link href={`/admin/substitutions?date=${date}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg">
          <ArrowLeftIcon weight="bold" className="size-4" />
          {t("substitutions.title")}
        </Link>
        <PrintButton />
      </div>

      <div className="rounded-[--radius-lg] border border-border bg-surface p-6 print:rounded-none print:border-0 print:bg-white print:p-0 print:text-black sm:p-8">
        <header className="border-b border-border pb-4 print:border-black/20">
          <h1 className="text-xl font-bold tracking-tight text-fg print:text-black">{t("substitutions.forDay", { date: dayLabel })}</h1>
          <p className="mt-1 text-sm text-fg-muted print:text-black/70">
            {school.name} · {t("substitutions.coveredOf", { covered: board.covered, total: board.lessons.length })}
          </p>
        </header>

        {board.closed ? (
          <p className="mt-5 text-sm text-fg-muted print:text-black/70">{board.closedName ? t("substitutions.closedNamed", { name: board.closedName }) : t("substitutions.closedDay")}</p>
        ) : board.lessons.length === 0 ? (
          <p className="mt-5 text-sm text-fg-muted print:text-black/70">{t("substitutions.nobodyAway")}</p>
        ) : (
          <>
            <p className="mt-4 text-sm text-fg print:text-black">
              <span className="font-semibold">{t("substitutions.awayToday")}:</span>{" "}
              {board.absent.map((person) => `${person.name} (${reasonOf(person.reason)})`).join(", ")}
            </p>
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-fg-muted print:border-black/20 print:text-black/70">
                  <th scope="col" className={head}>{t("substitutions.period")}</th>
                  <th scope="col" className={head}>{t("substitutions.class")}</th>
                  <th scope="col" className={head}>{t("substitutions.subject")}</th>
                  <th scope="col" className={head}>{t("substitutions.absentTeacher")}</th>
                  <th scope="col" className={`${head} pr-0`}>{t("substitutions.substitute")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border print:divide-black/20">
                {board.lessons.map((lesson) => (
                  <tr key={lesson.slotId} className="break-inside-avoid">
                    <td className={cell}>
                      <span className="block font-medium">{lesson.periodName ? periodLabel(lesson.periodName, t) : t("substitutions.period")}</span>
                      {lesson.startMinute !== null && lesson.endMinute !== null && (
                        <span className="block text-xs tabular-nums text-fg-muted print:text-black/70">{formatTimeRange(lesson.startMinute, lesson.endMinute)}</span>
                      )}
                    </td>
                    <td className={cell}>
                      {lesson.className}
                      {lesson.room ? <span className="block text-xs text-fg-muted print:text-black/70">{lesson.room}</span> : null}
                    </td>
                    <td className={cell}>{lesson.subject}</td>
                    <td className={cell}>
                      {lesson.absentName}
                      <span className="block text-xs text-fg-muted print:text-black/70">{reasonOf(lesson.absentReason)}</span>
                    </td>
                    <td className={`${cell} pr-0`}>
                      {lesson.substitute ? (
                        <>
                          <span className="block font-semibold">{lesson.substitute.name}</span>
                          {lesson.substitute.note && <span className="block text-xs text-fg-muted print:text-black/70">{lesson.substitute.note}</span>}
                        </>
                      ) : (
                        <span className="font-semibold text-warn print:text-black">{t("substitutions.noSubstitute")}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </article>
  );
}
