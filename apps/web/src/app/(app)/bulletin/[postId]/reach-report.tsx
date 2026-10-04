import Link from "next/link";
import { DownloadSimpleIcon, PrinterIcon } from "@phosphor-icons/react/ssr";
import type { CircularReach } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { StatTile } from "@/components/ui/card";
import { formatInZone } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { RemindButton } from "./remind-button";
import { REACH_STATE_KEY, REACH_STATE_TONE } from "./reach-labels";

/**
 * Who a circular has reached: the four numbers, when it went and when the
 * rest were chased, then class by class the families still waiting with
 * each guardian's name, whether the app can reach them, whether a text
 * went, and — for the office — the number to ring. A delivery checklist,
 * not a league table: the names on it are the ones to telephone.
 */
export async function ReachReport({ reach, office, timezone }: { reach: CircularReach; office: boolean; timezone: string }) {
  const t = await getT();
  const locale = await getLocale();
  const when = (iso: string) => formatInZone(new Date(iso), timezone, { dateStyle: "medium", timeStyle: "short" }, locale);
  const outstanding = reach.totals.total - reach.totals.acked;
  const staffOnly = reach.audience === "TEACHERS";

  return (
    <section aria-labelledby="reach-report" className="space-y-4 rounded-[--radius-lg] border border-border bg-surface p-5" data-testid="reach-report">
      <div>
        <h2 id="reach-report" className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
          {t("circulars.reachTitle")}
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-fg-muted">{t("circulars.reachHint")}</p>
      </div>

      {/* ---- the four numbers ---- */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label={t("circulars.total")} value={reach.totals.total} />
        <StatTile label={t("circulars.told")} value={reach.totals.told} tone={reach.totals.told < reach.totals.total ? "warn" : "ok"} />
        <StatTile label={t("circulars.seen")} value={reach.totals.seen} tone="accent" />
        <StatTile label={t("circulars.acked")} value={reach.totals.acked} tone={outstanding === 0 && reach.totals.total > 0 ? "ok" : "neutral"} hint={outstanding > 0 ? t("circulars.outstandingCount", { count: outstanding }) : undefined} />
      </div>
      {reach.totals.noGuardian > 0 && (
        <p className="text-sm text-warn" data-testid="reach-no-guardian">
          {t("circulars.noGuardianCount", { count: reach.totals.noGuardian })}
        </p>
      )}

      {/* ---- when it went, and when the rest were chased ---- */}
      <dl className="space-y-1 text-sm text-fg-muted">
        <div>
          {reach.deliveredAt ? t("circulars.delivered", { when: when(reach.deliveredAt) }) : reach.deliveryQueuedAt ? t("circulars.queued") : t("circulars.notDelivered")}
        </div>
        {reach.remindedAt && <div>{t("circulars.reminded", { when: when(reach.remindedAt), count: reach.remindCount })}</div>}
      </dl>

      {/* ---- the chase, and the ways out of the page ---- */}
      <div className="space-y-3 border-t border-border pt-4">
        {office && (
          <div>
            <RemindButton postId={reach.postId} canRemind={reach.canRemind} blocked={reach.remindBlocked} />
            <p className="mt-1.5 text-xs text-fg-muted">{t("circulars.remindHint")}</p>
          </div>
        )}
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
          <li>
            <Link href={`/bulletin/${reach.postId}/print`} className="inline-flex items-center gap-1.5 font-medium text-accent-strong underline underline-offset-2 hover:text-fg">
              <PrinterIcon weight="bold" className="size-4" aria-hidden="true" />
              {t("circulars.print")}
            </Link>
          </li>
          <li>
            <a href={`/bulletin/${reach.postId}/outstanding`} className="inline-flex items-center gap-1.5 font-medium text-accent-strong underline underline-offset-2 hover:text-fg">
              <DownloadSimpleIcon weight="bold" className="size-4" aria-hidden="true" />
              {t("circulars.exportOutstanding")}
            </a>
          </li>
          <li>
            <a href={`/bulletin/${reach.postId}/outstanding?format=xlsx`} className="font-medium text-accent-strong underline underline-offset-2 hover:text-fg">
              {t("circulars.exportOutstandingXlsx")}
            </a>
          </li>
        </ul>
      </div>

      {/* ---- class by class: the families still waiting ---- */}
      <ul className="space-y-5">
        {reach.groups.map((group) => (
          <li key={group.classId ?? "staff"}>
            <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
              <span className="font-semibold text-fg">{group.className || t("circulars.audienceTeachers")}</span>
              <span className="text-fg-muted">{t("circulars.ackedOf", { acked: group.acked, total: group.total })}</span>
            </p>
            {group.outstanding.length === 0 ? (
              <p className="mt-1 text-xs text-ok">{t("circulars.everyoneReached")}</p>
            ) : (
              <div className="relative mt-2 overflow-x-auto rounded-[--radius-md] border border-border" tabIndex={0}>
                <table className="w-full text-sm">
                  <caption className="sr-only">
                    {group.className || t("circulars.audienceTeachers")} · {t("circulars.outstanding")}
                  </caption>
                  <thead className="bg-surface-muted text-left text-xs uppercase tracking-wide text-fg-muted">
                    <tr>
                      <th scope="col" className="px-3 py-2 font-medium">{staffOnly ? t("circulars.audienceTeachers") : t("circulars.columnFamily")}</th>
                      <th scope="col" className="px-3 py-2 font-medium">{t("circulars.columnState")}</th>
                      {!staffOnly && <th scope="col" className="px-3 py-2 font-medium">{t("circulars.columnGuardian")}</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {group.outstanding.map((family) => (
                      <tr key={family.studentMembershipId}>
                        <td className="px-3 py-2 align-top font-medium text-fg">{family.studentName}</td>
                        <td className="px-3 py-2 align-top">
                          <Badge tone={REACH_STATE_TONE[family.state]} size="sm">
                            {t(REACH_STATE_KEY[family.state])}
                          </Badge>
                        </td>
                        {!staffOnly && (
                          <td className="px-3 py-2 align-top">
                            {family.noGuardian ? (
                              <Badge tone="warn" size="sm">
                                {t("circulars.noGuardian")}
                              </Badge>
                            ) : family.guardians.length === 0 ? (
                              <span className="text-fg-muted">—</span>
                            ) : (
                              <ul className="space-y-1">
                                {family.guardians.map((g) => (
                                  <li key={g.userId} className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-fg">{g.name}</span>
                                    {!g.hasApp && (
                                      <Badge tone="outline" size="sm">
                                        {t("circulars.noApp")}
                                      </Badge>
                                    )}
                                    {g.texted && (
                                      <Badge tone="info" size="sm">
                                        {t("circulars.texted")}
                                      </Badge>
                                    )}
                                    {g.phone && (
                                      <a href={`tel:${g.phone}`} className="font-mono text-xs text-accent-strong underline underline-offset-2 hover:text-fg">
                                        {g.phone}
                                      </a>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
