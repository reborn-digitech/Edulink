import { StatTile } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLocale, getT } from "@/lib/i18n/server";
import { formatMonthKey } from "@/lib/dates";
import type { OfficeUsage } from "@/lib/plans";
import { TableScroll } from "@/components/ui/table-scroll";

/**
 * One school's month against its plan, as four tiles — each cap beside its
 * count, over-cap in red — and the months before it as a small table. A
 * server component: the school page and nothing else renders it.
 */
export async function UsageCard({ usage }: { usage: OfficeUsage }) {
  const t = await getT();
  const locale = await getLocale();
  const c = usage.counts;
  const tile = (label: string, value: number | undefined, cap: number | null, over: boolean, unit = "") => (
    <StatTile
      label={label}
      value={value === undefined ? "—" : `${value.toLocaleString()}${unit}`}
      hint={cap === null ? t("root.planNoCap") : t("root.usageOfCap", { used: value === undefined ? "—" : value.toLocaleString(), cap: `${cap.toLocaleString()}${unit}` })}
      tone={over ? "danger" : "neutral"}
    />
  );
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm text-fg-muted">
        <span className="text-xs font-semibold text-fg">{formatMonthKey(usage.month, locale)}</span>
        {usage.plan ? <Badge size="sm" tone="accent">{usage.plan.name}</Badge> : <Badge size="sm">{t("root.planNone")}</Badge>}
        {c && (usage.over.pupils || usage.over.messages || usage.over.storageMb ? <Badge size="sm" tone="danger">{t("root.usageOverCap")}</Badge> : <Badge size="sm" tone="ok">{t("root.usageWithinCap")}</Badge>)}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tile(t("root.usagePupils"), c?.pupils, usage.caps.pupils, usage.over.pupils)}
        {tile(t("root.usageMessages"), c?.messages, usage.caps.messages, usage.over.messages)}
        {tile(t("root.usageStorage"), c?.storageMb, usage.caps.storageMb, usage.over.storageMb, " MB")}
        <StatTile label={t("root.usageActive")} value={c ? c.activeUsers.toLocaleString() : "—"} />
      </div>
      {!c && <p className="text-xs text-fg-muted">{t("root.usageRunNow")}</p>}
      {usage.history.length > 0 && (
        <TableScroll>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-fg-muted">{t("root.usageHistory")}</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-fg-muted">
                <th className="py-1 pr-3">{t("root.usageMonth")}</th>
                <th className="py-1 pr-3 text-right">{t("root.usagePupils")}</th>
                <th className="py-1 pr-3 text-right">{t("root.usageMessages")}</th>
                <th className="py-1 pr-3 text-right">{t("root.usageStorage")}</th>
                <th className="py-1 text-right">{t("root.usageActive")}</th>
              </tr>
            </thead>
            <tbody>
              {usage.history.map((h) => (
                <tr key={h.month} className="border-t border-border">
                  <td className="py-1 pr-3 text-xs">{formatMonthKey(h.month, locale)}</td>
                  <td className="py-1 pr-3 text-right tabular-nums">{h.pupils}</td>
                  <td className="py-1 pr-3 text-right tabular-nums">{h.messages}</td>
                  <td className="py-1 pr-3 text-right tabular-nums">{h.storageMb} MB</td>
                  <td className="py-1 text-right tabular-nums">{h.activeUsers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      )}
    </div>
  );
}
