import type { Metadata } from "next";
import Link from "next/link";
import { BuildingsIcon, ShieldCheckIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { getSession } from "@/lib/session";
import { listReports, listAudit, openReportCount } from "@/lib/safety";
import { EmptyState } from "@/components/ui/states";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { relativeTime } from "@/lib/dates";
import { accessHistory } from "@/lib/superuser";
import { ReportCard } from "./report-card";
import { AuditTable } from "./audit-table";
import { getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.safety") };
}

const TABS = [
  { id: "open", labelKey: "safety.tabOpen" },
  { id: "closed", labelKey: "safety.tabClosed" },
  { id: "audit", labelKey: "safety.tabAudit" },
] as const satisfies readonly { id: string; labelKey: TranslationKey }[];

export default async function SafetyPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const tr = await getT();
  await requireRole("ADMIN");
  const session = (await getSession())!;
  const { tab } = await searchParams;
  const active = TABS.find((t) => t.id === tab)?.id ?? "open";

  /**
   * WHO OUTSIDE THIS SCHOOL HAS LOOKED INSIDE IT.
   *
   * Shown unconditionally and above the tabs, not tucked into the audit tab,
   * because it is the one thing on this page a school has no other way of
   * finding out. Every action an operator takes is also in the audit trail
   * below, but a school should not have to go looking to discover that the
   * people hosting their data opened it.
   *
   * Empty in the ordinary case, and then this renders nothing at all.
   */
  const visits = await accessHistory(session.schoolId!, 10);

  const [openCount, groups, closed, auditRows] = await Promise.all([
    openReportCount(session),
    active === "open" ? listReports(session, "OPEN") : Promise.resolve([]),
    active === "closed"
      ? Promise.all([listReports(session, "ACTIONED"), listReports(session, "DISMISSED")]).then(
          ([actioned, dismissed]) =>
            [...actioned, ...dismissed].sort((a, b) => b.latestAt.getTime() - a.latestAt.getTime()),
        )
      : Promise.resolve([]),
    active === "audit" ? listAudit(session, { take: 200 }) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{tr("safety.title")}</h1>
        <p className="mt-1 text-sm text-fg-muted">
          {openCount === 0
            ? tr("safety.nothingNeeded")
            : openCount === 1
              ? tr("safety.toDealWithOne")
              : tr("safety.toDealWithMany", { count: openCount })}
        </p>
      </div>

      {visits.length > 0 && (
        <Card className="border-warn/40">
          <CardHeader
            icon={<BuildingsIcon weight="duotone" className="size-5 text-warn" />}
            title={tr("safety.operatorTitle")}
            description={tr("safety.operatorBody")}
          />
          <CardBody>
            <ul className="space-y-2">
              {visits.map((visit) => (
                <li key={visit.id} className="rounded-[--radius-sm] bg-surface-muted p-3">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-fg">
                    {visit.operatorName}
                    {visit.live && (
                      <Badge tone="warn" size="sm">
                        {tr("safety.operatorLive")}
                      </Badge>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-fg-muted">
                    {relativeTime(visit.startedAt)} — {visit.reason}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-fg-muted">
              {tr("safety.operatorFootPrefix")} <span className="font-mono">operator.</span>{" "}
              {tr("safety.operatorFootSuffix")}
            </p>
          </CardBody>
        </Card>
      )}

      <nav className="flex gap-1 rounded-[--radius-md] bg-surface-muted p-1" aria-label={tr("safety.section")}>
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/admin/safety?tab=${t.id}`}
            aria-current={active === t.id ? "page" : undefined}
            className={`flex-1 rounded-[--radius-sm] px-3 py-2 text-center text-sm font-medium ${
              active === t.id ? "bg-surface text-fg shadow-sm" : "text-fg-muted"
            }`}
          >
            {t.id === "open" && openCount > 0
              ? tr("safety.tabOpenCount", { count: openCount })
              : tr(t.labelKey)}
          </Link>
        ))}
      </nav>

      {active === "open" &&
        (groups.length === 0 ? (
          <EmptyState
            icon={<ShieldCheckIcon weight="duotone" className="size-8" />}
            title={tr("safety.nothingReported")}
            description={tr("safety.nothingReportedBody")}
          />
        ) : (
          <>
            <p className="text-xs leading-relaxed text-fg-muted">
              {tr("safety.groupedNote")}
            </p>
            <ul className="space-y-3">
              {groups.map((group) => (
                <li key={`${group.targetType}:${group.targetId}`}>
                  <ReportCard group={group} />
                </li>
              ))}
            </ul>
          </>
        ))}

      {active === "closed" &&
        (closed.length === 0 ? (
          <EmptyState
            title={tr("safety.nothingResolved")}
            description={tr("safety.nothingResolvedBody")}
          />
        ) : (
          <ul className="space-y-3">
            {closed.map((group) => (
              <li key={`${group.targetType}:${group.targetId}:${group.status}`}>
                <ReportCard group={group} readOnly />
              </li>
            ))}
          </ul>
        ))}

      {active === "audit" &&
        (auditRows.length === 0 ? (
          <EmptyState
            title={tr("safety.nothingLogged")}
            description={tr("safety.nothingLoggedBody")}
          />
        ) : (
          <>
            <p className="text-xs leading-relaxed text-fg-muted">
              {tr("safety.auditNote")}
            </p>
            <AuditTable rows={auditRows} />
          </>
        ))}
    </div>
  );
}
