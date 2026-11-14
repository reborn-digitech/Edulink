import type { Metadata } from "next";
import { ChartBarIcon, TrophyIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import { getT } from "@/lib/i18n/server";
import { libraryReports } from "@/lib/library";
import { formatDateKey } from "@/lib/dates";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { DeskFrame, deskContext } from "@/components/library/desk";
import { money } from "@/components/library/parts";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("library.tabReports"), robots: { index: false, follow: false } };
}

/** The library's year at a glance: loans per month, the most borrowed books, and what is overdue by class. */
export default async function LibraryReportsPage() {
  const { ctx, t, locale, on } = await deskContext();
  if (!on) return <DeskFrame t={t} on={false} current="reports" title={t("library.tabReports")}>{null}</DeskFrame>;
  const r = await libraryReports(ctx);
  const peak = Math.max(1, ...r.issuesByMonth.map((m) => m.count));
  return (
    <DeskFrame t={t} on current="reports" title={t("library.tabReports")} description={t("library.reportsIntro")}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label={t("library.statTitles")} value={r.totals.titles} />
        <StatTile label={t("library.statCopies")} value={r.totals.copies} />
        <StatTile label={t("library.statOnLoan")} value={r.totals.onLoan} />
        <StatTile label={t("library.statOverdue")} value={r.totals.overdue} tone={r.totals.overdue ? "danger" : "neutral"} />
        <StatTile label={t("library.statMembers")} value={r.totals.members} />
        <StatTile label={t("library.statDue")} value={money(r.totals.duePaise, locale)} />
      </div>
      <Card>
        <CardHeader icon={<ChartBarIcon weight="duotone" className="size-5" />} title={t("library.issuesByMonth")} />
        <CardBody>
          <ul className="space-y-1.5">
            {r.issuesByMonth.map((m) => (
              <li key={m.month} className="grid grid-cols-[5.5rem_1fr_2.5rem] items-center gap-2 text-sm">
                <span className="text-fg-muted">{formatDateKey(`${m.month}-01`, { month: "short", year: "numeric" }, locale)}</span>
                <span className="h-2.5 rounded-full bg-surface-muted" aria-hidden>
                  <span className="block h-2.5 rounded-full bg-accent" style={{ width: `${Math.round((m.count / peak) * 100)}%` }} />
                </span>
                <span className="text-right tabular-nums text-fg">{m.count}</span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader icon={<TrophyIcon weight="duotone" className="size-5" />} title={t("library.mostBorrowed")} />
          <CardBody>
            {r.mostBorrowed.length === 0 ? (
              <p className="text-sm text-fg-muted">{t("library.noLoansYear")}</p>
            ) : (
              <ol className="list-decimal space-y-1 pl-5 text-sm text-fg">
                {r.mostBorrowed.map((b) => (
                  <li key={b.titleId}>
                    {b.title} <span className="text-fg-muted">· {b.count === 1 ? t("library.timesLentOne", { count: 1 }) : t("library.timesLent", { count: b.count })}</span>
                  </li>
                ))}
              </ol>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader icon={<UsersThreeIcon weight="duotone" className="size-5" />} title={t("library.overdueByClass")} />
          <CardBody>
            {r.overdueByClass.length === 0 ? (
              <p className="text-sm text-fg-muted">{t("library.nothingOverdue")}</p>
            ) : (
              <ul className="space-y-1 text-sm text-fg">
                {r.overdueByClass.map((c) => (
                  <li key={c.className ?? "staff"} className="flex justify-between gap-3">
                    <span>{c.className ?? t("library.staffMembers")}</span>
                    <span className="tabular-nums">{c.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </DeskFrame>
  );
}
