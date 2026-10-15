import Link from "next/link";
import { institutionKindLabel } from "@/lib/institution";
import { BuildingsIcon, HandshakeIcon, RocketLaunchIcon, WarningIcon } from "@phosphor-icons/react/ssr";
import { formatPaise } from "@edulink/i18n";
import { requireSuperuser } from "@/lib/tenancy";
import { operatorDashboard, type DashboardRow, type DashboardState } from "@/lib/subscriptions";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { getT, getLocale, getRelativeTime } from "@/lib/i18n/server";
import type { Translate } from "@/lib/i18n/dictionary";
import { dueLabel, statusLabel } from "./subscription-words";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { PageHeader } from "@/components/ui/page-header";
import { BulkSelectProvider, SelectSchool } from "./bulk-select";
import { CopyChip } from "./copy-chip";
import { UsageSummary } from "./usage-summary";
import { TableScroll } from "@/components/ui/table-scroll";
import { ModelServersCard } from "@/components/quiz-review/model-servers-card";
import { FeaturesCard } from "./features/card";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("root.dashboard") };
}

const STATES: DashboardState[] = ["live", "trial", "soon", "due", "suspended", "noadmin", "unverified", "removed", "test", "all"];

/**
 * The operator's dashboard. The tiles count every real live school; the
 * table is the list narrowed by the chips, due-first; the usage card below
 * is this month against each plan, as it was. Everything here is RECORDED
 * — the page says so in its intro — and nothing on it collects a rupee.
 */
export default async function RootPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; state?: string; plan?: string; partner?: string }>;
}) {
  const { q, state: rawState, plan: rawPlan, partner: rawPartner } = await searchParams;
  const t = await getT();
  const locale = await getLocale();
  const relativeTime = await getRelativeTime();
  const session = await requireSuperuser();
  const state: DashboardState = STATES.includes(rawState as DashboardState) ? (rawState as DashboardState) : "live";
  const d = await operatorDashboard(session, { q, state, planId: rawPlan || undefined, partnerId: rawPartner || undefined });
  const planId = d.plans.some((p) => p.id === rawPlan) ? rawPlan : "";
  const partnerId = d.partners.some((p) => p.id === rawPartner) ? rawPartner : "";
  const narrowed = Boolean(q || state !== "live" || planId || partnerId);
  // ACTIVE schools the partners brought that are on no plan, or on a plan with no price: no figure to take a share of, so the owed sum leaves them out and says so.
  const unpriced = d.partners.reduce((sum, p) => sum + p.unpricedSchools, 0);
  const money = (paise: number) => formatPaise(paise, locale);
  const percent = (tenths: number) => (tenths / 10).toLocaleString(undefined, { maximumFractionDigits: 1 });

  const tiles: { label: string; value: string; tone?: "warn" | "danger" | "ok" }[] = [
    { label: t("root.tileLive"), value: String(d.tiles.live) },
    { label: t("root.tileTrial"), value: String(d.tiles.trial) },
    { label: t("root.tileDueSoon"), value: String(d.tiles.dueSoon), tone: d.tiles.dueSoon > 0 ? "warn" : undefined },
    { label: t("root.tilePastDue"), value: String(d.tiles.pastDue), tone: d.tiles.pastDue > 0 ? "danger" : undefined },
    { label: t("root.tileSuspended"), value: String(d.tiles.suspended) },
    { label: t("root.tilePupils"), value: d.tiles.pupils.toLocaleString() },
    { label: t("root.tileMessages"), value: d.tiles.messageCap === null ? d.tiles.messages.toLocaleString() : t("root.tileOfCap", { used: d.tiles.messages.toLocaleString(), cap: d.tiles.messageCap.toLocaleString() }), tone: d.tiles.messageCap !== null && d.tiles.messages > d.tiles.messageCap ? "danger" : undefined },
    { label: t("root.tileStorage"), value: d.tiles.storageCapMb === null ? `${d.tiles.storageMb.toLocaleString()} MB` : t("root.tileOfCap", { used: `${d.tiles.storageMb.toLocaleString()} MB`, cap: `${d.tiles.storageCapMb.toLocaleString()} MB` }), tone: d.tiles.storageCapMb !== null && d.tiles.storageMb > d.tiles.storageCapMb ? "danger" : undefined },
    { label: t("root.tileJobsOverdue"), value: String(d.tiles.jobsOverdue), tone: d.tiles.jobsOverdue > 0 ? "danger" : "ok" },
    { label: t("root.tileOwed"), value: money(d.tiles.owedThisMonthPaise) },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader title={t("root.dashboard")} description={d.counts.all === 0 ? t("root.nothingHereYet") : d.counts.all === 1 ? t("root.schoolsOnServerOne") : t("root.schoolsOnServerMany", { count: d.counts.all })} />
        <Button asChild icon={<RocketLaunchIcon weight="bold" />}>
          <Link href="/root/onboard">{t("root.onboardCta")}</Link>
        </Button>
      </div>

      <p className="rounded-[var(--radius-md)] border border-border bg-surface-muted px-4 py-3 text-sm leading-relaxed text-fg-muted">{t("root.dashboardIntro")}</p>

      {/* The tiles: every real live school, whatever the chips below say. */}
      <section aria-label={t("root.dashboard")}>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {tiles.map((tile) => (
            <li key={tile.label} className="rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2.5">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-wide text-fg-muted">{tile.label}</p>
              <p className={`mt-0.5 text-lg font-bold tabular-nums ${tile.tone === "danger" ? "text-danger" : tile.tone === "warn" ? "text-warn" : tile.tone === "ok" ? "text-ok" : "text-fg"}`}>{tile.value}</p>
            </li>
          ))}
        </ul>
        <p className="mt-1.5 text-xs text-fg-subtle">{t("root.tilesNote")}</p>
      </section>

      {/* feature-switches (15 Oct 2026): the platform's features, each off until switched on at /root/features. */}
      <FeaturesCard />

      {/* quiz-publish-jobs (11 Oct 2026): the two model servers' state and the way to the generated bank. */}
      <ModelServersCard deskHref="/root/quiz-review" />

      {/* What each partner is owed this month, recorded only; the partners page has the detail. */}
      {d.partners.length > 0 && (
        <Card>
          <CardHeader
            icon={<HandshakeIcon weight="duotone" className="size-5" />}
            title={t("root.tileOwed")}
            description={t("root.partnersIntro")}
            action={
              <Button asChild size="sm" variant="ghost">
                <Link href="/root/partners">{t("root.partners")}</Link>
              </Button>
            }
          />
          <CardBody>
            <ul className="flex flex-wrap gap-2">
              {d.partners.map((p) => (
                <li key={p.id} className="rounded-full border border-border px-3 py-1 text-sm">
                  <span className="font-medium text-fg">{p.name}</span> <span className="text-fg-muted">· {percent(p.percentTenths)}% · {p.schools === 1 ? t("root.partnerSchoolsOne") : t("root.partnerSchoolsMany", { count: p.schools })} · </span>
                  <span className="font-semibold tabular-nums text-fg">{money(p.owedThisMonthPaise)}</span>
                </li>
              ))}
            </ul>
            {unpriced > 0 && <p className="mt-2 text-xs text-fg-subtle">{unpriced === 1 ? t("root.partnerUnpricedOne") : t("root.partnerUnpricedMany", { count: unpriced })}</p>}
          </CardBody>
        </Card>
      )}

      {(d.counts.all > 1 || narrowed) && (
        <DataToolbar
          search={{ value: q ?? "", placeholder: t("root.searchPlaceholder"), label: t("common.searchLabel") }}
          facets={[
            {
              key: "state",
              label: t("root.stateFilter"),
              value: state,
              defaultValue: "live",
              as: "select",
              options: [
                { value: "live", label: t("root.stateLive"), count: d.counts.live },
                { value: "trial", label: t("root.stateTrial"), count: d.counts.trial },
                { value: "soon", label: t("root.stateSoon"), count: d.counts.soon },
                { value: "due", label: t("root.stateDue"), count: d.counts.due },
                { value: "suspended", label: t("root.stateSuspended"), count: d.counts.suspended },
                { value: "noadmin", label: t("root.stateNoAdmin"), count: d.counts.noadmin },
                { value: "unverified", label: t("root.stateUnverified"), count: d.counts.unverified },
                { value: "removed", label: t("root.removedBadge"), count: d.counts.removed },
                { value: "test", label: t("root.stateTest"), count: d.counts.test },
                { value: "all", label: t("vacancies.filterAll"), count: d.counts.all },
              ],
            },
            ...(d.plans.length > 0 ? [{ key: "plan", label: t("root.filterPlan"), value: planId ?? "", as: "select" as const, options: [{ value: "", label: t("root.anyPlan") }, ...d.plans.map((p) => ({ value: p.id, label: p.name }))] }] : []),
            ...(d.partners.length > 0 ? [{ key: "partner", label: t("root.filterPartner"), value: partnerId ?? "", as: "select" as const, options: [{ value: "", label: t("root.anyPartner") }, ...d.partners.map((p) => ({ value: p.id, label: p.name }))] }] : []),
          ]}
          labels={{ clearAll: t("common.clearAll"), clearSearch: t("common.clearSearch"), activeFilters: t("common.activeFilters") }}
        />
      )}

      {d.rows.length === 0 && narrowed ? (
        <EmptyState title={t("common.noResultsTitle")} description={t("common.noResultsBody")} />
      ) : d.rows.length === 0 ? (
        <EmptyState
          icon={<BuildingsIcon weight="duotone" className="size-8" />}
          title={t("root.noSchoolsYet")}
          description={t("root.addFirstOne")}
          action={
            <Button asChild>
              <Link href="/root/onboard">{t("root.onboardCta")}</Link>
            </Button>
          }
        />
      ) : (
        <BulkSelectProvider schools={d.rows.map((s) => ({ id: s.id, name: s.name }))}>
          <Card>
            <CardHeader icon={<BuildingsIcon weight="duotone" className="size-5" />} title={t("root.schoolsTable")} />
            <CardBody>
              <TableScroll>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-fg-muted">
                      <th className="py-1 pr-2" />
                      <th className="py-1 pr-3">{t("root.colSchool")}</th>
                      <th className="py-1 pr-3">{t("root.colState")}</th>
                      <th className="py-1 pr-3">{t("root.colPlan")}</th>
                      <th className="py-1 pr-3 text-right">{t("root.colPupils")}</th>
                      <th className="py-1 pr-3">{t("root.colDue")}</th>
                      <th className="py-1 pr-3">{t("root.colPartner")}</th>
                      <th className="py-1 pr-3">{t("root.colContact")}</th>
                      <th className="py-1 pr-3">{t("root.colLastActivity")}</th>
                      <th className="py-1" />
                    </tr>
                  </thead>
                  <tbody>
                    {d.rows.map((row) => (
                      <SchoolRow key={row.id} row={row} t={t} relativeTime={relativeTime} percent={percent} />
                    ))}
                  </tbody>
                </table>
              </TableScroll>
            </CardBody>
          </Card>
        </BulkSelectProvider>
      )}

      {/* This month against each school's plan, from the nightly rows; only when there is a live school to count. */}
      {d.tiles.live > 0 && <UsageSummary session={session} />}
    </div>
  );
}

function SchoolRow({ row, t, relativeTime, percent }: { row: DashboardRow; t: Translate; relativeTime: (d: Date) => string; percent: (tenths: number) => string }) {
  const due = dueLabel(t, row.subscription.daysToDue);
  const dueClass = row.dueTone === "past" ? "font-semibold text-danger" : row.dueTone === "soon" ? "font-semibold text-warn" : "text-fg";
  return (
    <tr className={`border-t border-border align-top ${row.removedAt ? "opacity-70" : ""}`}>
      <td className="py-2 pr-2">
        <SelectSchool id={row.id} name={row.name} />
      </td>
      <td className="py-2 pr-3">
        <Link href={`/root/${row.id}`} className="font-medium text-fg hover:underline">
          {row.name}
        </Link>
        {/* The kind by name (4 Oct 2026): a college reads as a college in the operator's list. */}
        <p className="text-xs text-fg-muted">
          {institutionKindLabel(row.kind, t)} · {row.city || t("root.noAddress")}
        </p>
      </td>
      <td className="py-2 pr-3">
        <div className="flex flex-wrap gap-1">
          {row.removedAt ? (
            <Badge tone="danger" size="sm">
              {t("root.removedBadge")}
            </Badge>
          ) : (
            <>
              <Badge tone={row.subscription.status === "ACTIVE" ? "ok" : row.subscription.status === "TRIAL" ? "info" : row.subscription.status === "DUE" ? "danger" : row.subscription.status === "SUSPENDED" || row.subscription.status === "ENDED" ? "neutral" : "outline"} size="sm">
                {statusLabel(t, row.subscription.status)}
              </Badge>
              {!row.verifiedAt && (
                <Badge tone="warn" size="sm">
                  {t("root.stateUnverified")}
                </Badge>
              )}
              {row.pendingAdminInvites > 0 && (
                <Badge tone="warn" size="sm">
                  {row.pendingAdminInvites === 1 ? t("root.invitesPendingOne") : t("root.invitesPendingMany", { count: row.pendingAdminInvites })}
                </Badge>
              )}
              {(!row.gradeLow || !row.gradeHigh) && (
                <span className="flex items-center gap-1 text-xs font-medium text-warn" title={t("root.needsSetupTitle")}>
                  <WarningIcon weight="bold" className="size-3.5" />
                  {t("root.needsSetup")}
                </span>
              )}
            </>
          )}
        </div>
      </td>
      <td className="py-2 pr-3 text-xs text-fg-muted">{row.plan ? row.plan.name : t("root.planNone")}</td>
      <td className="py-2 pr-3 text-right tabular-nums">{row.pupils === null ? "—" : row.pupils.toLocaleString()}</td>
      <td className={`py-2 pr-3 whitespace-nowrap ${dueClass}`}>
        {row.subscription.dueAt ? (
          <>
            {row.subscription.dueAt}
            {due && <span className="block text-xs font-normal">{due}</span>}
          </>
        ) : (
          <span className="text-xs text-fg-subtle">{t("root.subscriptionNotRecorded")}</span>
        )}
      </td>
      <td className="py-2 pr-3 text-xs">{row.commission ? t("root.commissionLine", { partner: row.commission.partnerName, percent: percent(row.commission.percentTenths) }) : <span className="text-fg-subtle">{t("root.commissionNone")}</span>}</td>
      <td className="py-2 pr-3 text-xs">
        {row.contact.name || row.contact.phone ? (
          <>
            {row.contact.name && <span className="block text-fg">{row.contact.name}</span>}
            {row.contact.phone && <CopyChip text={row.contact.phone} />}
          </>
        ) : (
          <span className="text-fg-subtle">{t("root.contactNone")}</span>
        )}
      </td>
      <td className="py-2 pr-3 text-xs text-fg-muted whitespace-nowrap">{row.lastActivityAt ? relativeTime(new Date(row.lastActivityAt)) : t("root.noActivityYet")}</td>
      <td className="py-2 text-right">
        <Button asChild size="sm" variant="secondary">
          <Link href={`/root/${row.id}`}>{t("root.openSchool")}</Link>
        </Button>
      </td>
    </tr>
  );
}
