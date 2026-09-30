import type { Metadata } from "next";
import Link from "next/link";
import { CalendarBlankIcon, DownloadSimpleIcon, ReceiptIcon, ArrowCounterClockwiseIcon, WrenchIcon } from "@phosphor-icons/react/ssr";
import { formatPaise } from "@edulink/i18n";
import { requireRole } from "@/lib/tenancy";
import { feeOverview } from "@/lib/fees-reports";
import { listAcademicYears } from "@/lib/academic-year";
import { FEE_CLAIM_STALE_DAYS } from "@/lib/constants";
import { formatDateKey } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { METHOD_KEY, PAY_STATUS_KEY, PAY_STATUS_TONE, receiptHref } from "./labels";
import { CarryForwardForm } from "./carry-forward-form";
import { ExportLinks } from "./export-links";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.fees") };
}

/**
 * The office's overview: what the school asked for this year, what arrived,
 * what is still to come and how old it is. The principal reads the same
 * page; the writes (carry-forward, the exports) are the office's alone and
 * are not drawn for the head.
 */
export default async function FeesOverviewPage() {
  const t = await getT();
  const locale = await getLocale();
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const office = ctx.role === "ADMIN";
  const o = await feeOverview(ctx);
  const money = (paise: number) => formatPaise(paise, locale);
  const dateOf = (key: string) => formatDateKey(key, { day: "numeric", month: "short" }, locale);

  const header = <PageHeader title={t("fees.title")} description={t("fees.overviewIntro")} />;

  if (!o.year) {
    return (
      <div className="space-y-6">
        {header}
        <EmptyState
          icon={<CalendarBlankIcon weight="duotone" className="size-8" />}
          title={t("fees.noYear")}
          action={
            office ? (
              <Button asChild>
                <Link href="/admin/calendar">{t("nav.calendar")}</Link>
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  }

  const years = office ? await listAcademicYears(ctx) : [];
  const needsSetUp = o.heads === 0 || o.structures === 0;
  const ageingTotal = o.ageing.current + o.ageing.d30 + o.ageing.d90 + o.ageing.d90plus;
  const ageingRows: { key: "current" | "d30" | "d90" | "d90plus"; label: string; tone: string }[] = [
    { key: "current", label: t("fees.ageingCurrent"), tone: "bg-ok" },
    { key: "d30", label: t("fees.ageing30"), tone: "bg-warn" },
    { key: "d90", label: t("fees.ageing90"), tone: "bg-danger/70" },
    { key: "d90plus", label: t("fees.ageing90plus"), tone: "bg-danger" },
  ];
  const monthStart = `${o.todayKey.slice(0, 7)}-01`;

  return (
    <div className="space-y-6">
      {header}

      {/* ---------------- where to go ---------------- */}
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="secondary" size="sm">
          <Link href="/admin/fees/dues">{t("fees.linkDues")}</Link>
        </Button>
        {office && (
          <Button asChild variant="secondary" size="sm">
            <Link href="/admin/fees/claims">
              {t("fees.linkClaims")}
              {o.claims.waiting > 0 && <Badge tone="warn" size="sm">{o.claims.waiting}</Badge>}
            </Link>
          </Button>
        )}
        <Button asChild variant="secondary" size="sm">
          <Link href="/admin/fees/structures">{t("fees.linkStructures")}</Link>
        </Button>
        {office && (
          <>
            <Button asChild variant="secondary" size="sm">
              <Link href="/admin/fees/heads">{t("fees.linkHeads")}</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/admin/fees/settings">{t("fees.linkSettings")}</Link>
            </Button>
          </>
        )}
      </div>

      {/* ---------------- set up ---------------- */}
      {office && needsSetUp && (
        <Card>
          <CardHeader icon={<WrenchIcon weight="duotone" className="size-5" />} title={t("fees.setUpTitle")} description={o.heads === 0 ? t("fees.structureNoHeads") : t("fees.noStructures")} />
          <CardBody>
            <ul className="grid gap-3 sm:grid-cols-3">
              {[
                { href: "/admin/fees/heads", title: t("fees.setUpHeads"), hint: t("fees.setUpHeadsHint"), done: o.heads > 0 },
                { href: "/admin/fees/structures", title: t("fees.setUpStructures"), hint: t("fees.setUpStructuresHint"), done: o.structures > 0 },
                { href: "/admin/fees/settings", title: t("fees.setUpSettings"), hint: t("fees.setUpSettingsHint"), done: o.options.online || o.options.upi },
              ].map((step) => (
                <li key={step.href}>
                  <Link href={step.href} className="block h-full rounded-[--radius-md] border border-border bg-surface-muted p-4 transition-colors hover:border-border-strong">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-fg">{step.title}</span>
                      {step.done && <Badge tone="ok" size="sm">✓</Badge>}
                    </span>
                    <span className="mt-1 block text-xs text-fg-muted">{step.hint}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      {/* ---------------- the numbers ---------------- */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label={t("fees.cardDemanded")} value={money(o.totals.demandedPaise)} hint={o.year.name} />
        <StatTile label={t("fees.cardCollected")} value={money(o.totals.collectedPaise)} tone="ok" />
        <StatTile label={t("fees.cardOutstanding")} value={money(o.totals.outstandingPaise)} tone={o.totals.outstandingPaise > 0 ? "warn" : "neutral"} />
        <StatTile label={t("fees.cardOverdue")} value={money(o.totals.overduePaise)} tone={o.totals.overduePaise > 0 ? "danger" : "neutral"} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label={t("fees.cardPupilsOnPlan")} value={o.pupils.onPlan} />
        <StatTile label={t("fees.cardPupilsWithout")} value={o.pupils.withoutPlan} tone={o.pupils.withoutPlan > 0 ? "warn" : "neutral"} />
        <StatTile
          label={t("fees.cardClaims")}
          value={o.claims.waiting}
          tone={o.claims.stale > 0 ? "danger" : o.claims.waiting > 0 ? "warn" : "neutral"}
          hint={o.claims.stale > 0 ? t("fees.cardStale", { count: o.claims.stale, days: FEE_CLAIM_STALE_DAYS }) : undefined}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ---------------- by grade ---------------- */}
        <Card>
          <CardHeader title={t("fees.byGradeTitle")} />
          <CardBody>
            {o.byGrade.length === 0 ? (
              <p className="text-sm text-fg-muted">{t("fees.noStructures")}</p>
            ) : (
              <div className="overflow-x-auto" tabIndex={0}>
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-fg-muted">
                    <tr>
                      <th className="py-2 pr-3 font-medium">{t("fees.structureGrade")}</th>
                      <th className="py-2 pr-3 text-right font-medium">{t("fees.structurePupils")}</th>
                      <th className="py-2 pr-3 text-right font-medium">{t("fees.cardDemanded")}</th>
                      <th className="py-2 pr-3 text-right font-medium">{t("fees.cardCollected")}</th>
                      <th className="py-2 pr-3 text-right font-medium">{t("fees.cardOutstanding")}</th>
                      <th className="py-2 text-right font-medium">{t("fees.cardOverdue")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border tabular-nums">
                    {o.byGrade.map((g) => (
                      <tr key={g.gradeLevel}>
                        <td className="py-2 pr-3 font-medium text-fg">{g.gradeLevel}</td>
                        <td className="py-2 pr-3 text-right">{g.pupils}</td>
                        <td className="py-2 pr-3 text-right">{money(g.demandedPaise)}</td>
                        <td className="py-2 pr-3 text-right text-ok">{money(g.collectedPaise)}</td>
                        <td className="py-2 pr-3 text-right">{money(g.outstandingPaise)}</td>
                        <td className={`py-2 text-right ${g.overduePaise > 0 ? "text-danger" : ""}`}>{money(g.overduePaise)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>

        {/* ---------------- ageing ---------------- */}
        <Card>
          <CardHeader title={t("fees.ageingTitle")} />
          <CardBody className="space-y-3">
            {ageingTotal > 0 && (
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-muted" aria-hidden="true">
                {ageingRows.map((row) => (
                  <span key={row.key} className={row.tone} style={{ width: `${(o.ageing[row.key] / ageingTotal) * 100}%` }} />
                ))}
              </div>
            )}
            <ul className="divide-y divide-border text-sm tabular-nums">
              {ageingRows.map((row) => (
                <li key={row.key} className="flex items-center justify-between gap-3 py-2">
                  <span className="flex items-center gap-2 text-fg-muted">
                    <span className={`size-2.5 rounded-full ${row.tone}`} aria-hidden="true" />
                    {row.label}
                  </span>
                  <span className="font-medium text-fg">{money(o.ageing[row.key])}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        {/* ---------------- this month ---------------- */}
        <Card>
          <CardHeader title={t("fees.methodsTitle")} />
          <CardBody>
            {o.methodsThisMonth.length === 0 ? (
              <p className="text-sm text-fg-muted">{t("fees.parentNoHistory")}</p>
            ) : (
              <ul className="divide-y divide-border text-sm tabular-nums">
                {o.methodsThisMonth.map((m) => (
                  <li key={m.method} className="flex items-center justify-between gap-3 py-2">
                    <span className="text-fg">
                      {METHOD_KEY[m.method] ? t(METHOD_KEY[m.method]!) : m.method} <span className="text-fg-muted">· {m.count}</span>
                    </span>
                    <span className="font-medium text-fg">{money(m.amountPaise)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* ---------------- recent ---------------- */}
        <Card>
          <CardHeader icon={<ReceiptIcon weight="duotone" className="size-5" />} title={t("fees.recentTitle")} />
          <CardBody>
            {o.recent.length === 0 ? (
              <p className="text-sm text-fg-muted">{t("fees.parentNoHistory")}</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {o.recent.map((p) => (
                  <li key={p.paymentId} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-fg">{p.pupilName}</span>
                      <span className="block text-xs text-fg-muted">
                        {dateOf(p.when.toISOString().slice(0, 10))} · {METHOD_KEY[p.method] ? t(METHOD_KEY[p.method]!) : p.method}
                        {p.receiptId && p.serial && (
                          <>
                            {" · "}
                            <Link href={receiptHref(p.receiptId)} className="text-accent-strong underline decoration-accent-strong/40 hover:decoration-accent-strong">
                              {p.serial}
                            </Link>
                          </>
                        )}
                      </span>
                    </span>
                    <span className="flex items-center gap-2 tabular-nums">
                      <Badge tone={PAY_STATUS_TONE[p.status] ?? "neutral"} size="sm">
                        {PAY_STATUS_KEY[p.status] ? t(PAY_STATUS_KEY[p.status]!) : p.status}
                      </Badge>
                      <span className="font-medium text-fg">{money(p.amountPaise)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {office && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader icon={<DownloadSimpleIcon weight="duotone" className="size-5" />} title={t("fees.linkExportCollections")} />
            <CardBody>
              <ExportLinks fromKey={monthStart} toKey={o.todayKey} />
            </CardBody>
          </Card>
          {years.length >= 2 && (
            <Card>
              <CardHeader icon={<ArrowCounterClockwiseIcon weight="duotone" className="size-5" />} title={t("fees.carryTitle")} description={t("fees.carryIntro")} />
              <CardBody>
                <CarryForwardForm years={years.map((y) => ({ id: y.id, name: y.name }))} currentYearId={o.year.id} />
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
