import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatPaise } from "@edulink/i18n";
import { requireRole, AccessError } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { listHeads, listStructures, pupilLedger } from "@/lib/fees";
import { formatDateKey, todayKey } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { DEMAND_STATUS_KEY } from "../../labels";
import { TakePaymentForm } from "./take-payment-form";
import { PaymentsTable } from "./payments-table";
import { ConcessionsPanel } from "./concessions-panel";
import { AssignPlanForm } from "./assign-plan-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.feePupil") };
}

/**
 * One pupil's ledger for the year: the plan, the instalments with their
 * head lines, the payments with receipts, the concessions — and, for the
 * office, the counter. The principal reads the same page without the forms.
 */
export default async function PupilFeesPage({ params }: { params: Promise<{ studentMembershipId: string }> }) {
  const t = await getT();
  const locale = await getLocale();
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const office = ctx.role === "ADMIN";
  const { studentMembershipId } = await params;
  const school = await db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } });
  const today = todayKey(school.timezone);

  let ledger;
  try {
    ledger = await pupilLedger(ctx.schoolId, studentMembershipId, { todayKey: today });
  } catch (error) {
    if (error instanceof AccessError && error.code === "NOT_FOUND") notFound();
    throw error;
  }
  const [heads, structures] = await Promise.all([office ? listHeads(ctx.schoolId) : [], office ? listStructures(ctx, {}) : []]);
  const published = structures.filter((s) => s.publishedAt && !s.archivedAt).map((s) => ({ id: s.id, name: s.name, gradeLevel: s.gradeLevel }));
  const money = (paise: number) => formatPaise(paise, locale);
  const dateOf = (key: string) => formatDateKey(key, { day: "numeric", month: "short", year: "numeric" }, locale);
  const openDemands = ledger.demands.filter((d) => d.outstandingPaise > 0).map((d) => ({ id: d.id, label: d.label, dueDateKey: dateOf(d.dueDateKey), outstandingPaise: d.outstandingPaise }));
  const p = ledger.pupil;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("fees.pupilTitle", { name: p.name })}
        description={[p.studentCode, p.className ?? p.gradeLevel, ledger.year?.name].filter(Boolean).join(" · ")}
        back={{ href: "/admin/fees/dues", label: t("fees.duesTitle") }}
        meta={p.leftAt ? <Badge tone="neutral">{t("ui.reasonLeft")}</Badge> : undefined}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label={t("fees.duesColDue")} value={money(ledger.totals.netPaise)} />
        <StatTile label={t("fees.duesColPaid")} value={money(ledger.totals.paidPaise)} tone="ok" />
        <StatTile label={t("fees.duesColOutstanding")} value={money(ledger.totals.outstandingPaise)} tone={ledger.totals.outstandingPaise > 0 ? "warn" : "neutral"} />
        <StatTile label={t("fees.duesColOverdue")} value={money(ledger.totals.overduePaise)} tone={ledger.totals.overduePaise > 0 ? "danger" : "neutral"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          {/* ---------------- plan ---------------- */}
          <Card>
            <CardHeader title={t("fees.pupilPlan")} description={ledger.plan ? ledger.plan.structureName : t("fees.pupilNoPlan")} />
            {office && ledger.year && (
              <CardBody>
                <AssignPlanForm studentMembershipId={p.studentMembershipId} structures={published} currentStructureId={ledger.plan?.structureId ?? null} />
              </CardBody>
            )}
          </Card>

          {/* ---------------- instalments ---------------- */}
          <Card>
            <CardHeader title={t("fees.pupilDemandsTitle")} />
            <CardBody>
              {ledger.demands.length === 0 ? (
                <p className="text-sm text-fg-muted">{ledger.year ? t("fees.pupilNoPlan") : t("fees.noYear")}</p>
              ) : (
                <ul className="divide-y divide-border">
                  {ledger.demands.map((d) => (
                    <li key={d.id}>
                      <details className="group py-2">
                        <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 text-sm">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-fg">{d.label}</span>
                            <span className="text-fg-muted">{dateOf(d.dueDateKey)}</span>
                            <Badge tone={d.overdue ? "danger" : d.status === "PAID" ? "ok" : d.status === "PART" ? "warn" : "neutral"} size="sm">
                              {d.overdue ? t("fees.overdue") : DEMAND_STATUS_KEY[d.status] ? t(DEMAND_STATUS_KEY[d.status]!) : d.status}
                            </Badge>
                          </span>
                          <span className="tabular-nums">
                            <span className="text-ok">{money(d.paidPaise)}</span> <span className="text-fg-muted">/</span> <strong className="text-fg">{money(d.netPaise)}</strong>
                          </span>
                        </summary>
                        <table className="mt-2 w-full text-xs text-fg-muted">
                          <thead>
                            <tr className="text-left uppercase tracking-wide">
                              <th className="py-1 pr-3 font-medium">{t("fees.receiptHead")}</th>
                              <th className="py-1 pr-3 text-right font-medium">{t("fees.lineGross")}</th>
                              <th className="py-1 pr-3 text-right font-medium">{t("fees.lineConcession")}</th>
                              <th className="py-1 text-right font-medium">{t("fees.lineNet")}</th>
                            </tr>
                          </thead>
                          <tbody className="tabular-nums">
                            {d.lines.map((l) => (
                              <tr key={l.headId}>
                                <td className="py-1 pr-3">
                                  {l.name} <span className="font-mono">{l.code}</span>
                                </td>
                                <td className="py-1 pr-3 text-right">{money(l.grossPaise)}</td>
                                <td className="py-1 pr-3 text-right">{l.concessionPaise > 0 ? `−${money(l.concessionPaise)}` : "—"}</td>
                                <td className="py-1 text-right text-fg">{money(l.grossPaise - l.concessionPaise)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </details>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          {/* ---------------- payments ---------------- */}
          <Card>
            <CardHeader title={t("fees.pupilPaymentsTitle")} />
            <CardBody>
              <PaymentsTable
                studentMembershipId={p.studentMembershipId}
                timezone={school.timezone}
                office={office}
                payments={ledger.payments.map((x) => ({
                  id: x.id,
                  amountPaise: x.amountPaise,
                  method: x.method,
                  status: x.status,
                  reference: x.reference,
                  note: x.note,
                  paidAt: x.paidAt?.toISOString() ?? null,
                  createdAt: x.createdAt.toISOString(),
                  collectedBy: x.collectedBy,
                  payer: x.payer,
                  receipt: x.receipt,
                  reversalReason: x.reversalReason,
                  refundedPaise: x.refundedPaise,
                }))}
              />
            </CardBody>
          </Card>

          {/* ---------------- concessions ---------------- */}
          <Card>
            <CardHeader title={t("fees.pupilConcessionsTitle")} />
            <CardBody>
              <ConcessionsPanel
                studentMembershipId={p.studentMembershipId}
                office={office && Boolean(ledger.year)}
                heads={heads.map((h) => ({ id: h.id, name: h.name }))}
                concessions={ledger.concessions.map((c) => ({ id: c.id, headId: c.headId, headName: c.headName, kind: c.kind, value: c.value, reason: c.reason, grantedBy: c.grantedBy, revoked: c.revokedAt !== null }))}
              />
            </CardBody>
          </Card>
        </div>

        {/* ---------------- the counter ---------------- */}
        {office && (
          <Card className="lg:sticky lg:top-4 lg:self-start">
            <CardHeader title={t("fees.takePaymentTitle")} />
            <CardBody>
              {openDemands.length === 0 ? <p className="text-sm text-fg-muted">{t("fees.refuseNothingDue")}</p> : <TakePaymentForm studentMembershipId={p.studentMembershipId} openDemands={openDemands} todayKey={today} />}
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
