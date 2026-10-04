import Link from "next/link";
import { ChartBarIcon } from "@phosphor-icons/react/ssr";
import { listUsage } from "@/lib/plans";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getLocale, getT } from "@/lib/i18n/server";
import { formatMonthKey } from "@/lib/dates";
import type { ActiveContext } from "@/lib/session";
import { TableScroll } from "@/components/ui/table-scroll";

/**
 * This month's usage across every live school, on the operator's front
 * page: over-cap schools first, each row a link to its school. Reads the
 * nightly rows only — nothing is computed on the way in.
 */
export async function UsageSummary({ session }: { session: ActiveContext }) {
  const t = await getT();
  const locale = await getLocale();
  const usage = await listUsage(session);
  const cell = (value: number | undefined, cap: number | null, over: boolean, unit = "") => (
    <td className={`py-1.5 pr-3 text-right tabular-nums ${over ? "font-semibold text-danger" : ""}`}>
      {value === undefined ? "—" : `${value.toLocaleString()}${unit}`}
      {cap !== null && <span className="text-xs text-fg-subtle"> / {cap.toLocaleString()}{unit}</span>}
    </td>
  );
  return (
    <Card>
      <CardHeader
        icon={<ChartBarIcon weight="duotone" className="size-5" />}
        title={[t("root.usage"), formatMonthKey(usage.month, locale)].join(" · ")}
        description={[
          usage.sampled === 1 ? t("root.usageSampledOne") : t("root.usageSampledMany", { count: usage.sampled }),
          usage.overCap === 1 ? t("root.usageOverCountOne") : t("root.usageOverCountMany", { count: usage.overCap }),
        ].join(" · ")}
        action={
          <Button asChild size="sm" variant="ghost">
            <Link href="/root/plans">{t("root.plans")}</Link>
          </Button>
        }
      />
      <CardBody>
        {usage.items.length === 0 ? (
          <p className="text-sm text-fg-muted">{t("root.usageNoSchools")}</p>
        ) : (
          <TableScroll>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-fg-muted">
                  <th className="py-1 pr-3">{t("root.schools")}</th>
                  <th className="py-1 pr-3">{t("root.planTitle")}</th>
                  <th className="py-1 pr-3 text-right">{t("root.usagePupils")}</th>
                  <th className="py-1 pr-3 text-right">{t("root.usageMessages")}</th>
                  <th className="py-1 pr-3 text-right">{t("root.usageStorage")}</th>
                  <th className="py-1 text-right">{t("root.usageActive")}</th>
                </tr>
              </thead>
              <tbody>
                {usage.items.map((row) => (
                  <tr key={row.schoolId} className="border-t border-border">
                    <td className="py-1.5 pr-3">
                      <Link href={`/root/${row.schoolId}`} className="font-medium text-fg hover:underline">
                        {row.schoolName}
                      </Link>
                      {row.overCap && (
                        <Badge size="sm" tone="danger" className="ml-2">
                          {t("root.usageOverCap")}
                        </Badge>
                      )}
                    </td>
                    <td className="py-1.5 pr-3 text-xs text-fg-muted">{row.plan ? row.plan.name : t("root.planNone")}</td>
                    {cell(row.counts?.pupils, row.caps.pupils, row.over.pupils)}
                    {cell(row.counts?.messages, row.caps.messages, row.over.messages)}
                    {cell(row.counts?.storageMb, row.caps.storageMb, row.over.storageMb, " MB")}
                    <td className="py-1.5 text-right tabular-nums">{row.counts ? row.counts.activeUsers : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {usage.sampled === 0 && <p className="mt-2 text-xs text-fg-muted">{t("root.usageNotSampled")} {t("root.usageRunNow")}</p>}
          </TableScroll>
        )}
      </CardBody>
    </Card>
  );
}
