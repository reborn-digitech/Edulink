import type { Metadata } from "next";
import { formatPaise } from "@edulink/i18n";
import { requireExpert } from "@/lib/tenancy";
import { expertEarnings } from "@/lib/gig-payments";
import type { SessionPaymentStatus } from "@/lib/gig-payments";
import { formatInZone } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("gigs.earningsTitle"), robots: { index: false, follow: false } };
}

const TONE: Record<SessionPaymentStatus, "info" | "ok" | "neutral" | "warn" | "danger"> = { INITIATED: "info", PAID: "warn", HELD: "warn", DUE: "info", PAID_OUT: "ok", REFUNDED: "neutral", FAILED: "danger" };

/**
 * The expert's earnings from paid workshop seats (decision 0004, second
 * amendment of 2 October 2026): seat by seat the fee the company collected,
 * its commission, the GST on the commission and the net that is theirs —
 * on hold, due, paid or refunded; the payouts the company made with the
 * transfer's reference; and the tax invoices for the commission, each a
 * PDF. No pupil's name: the school's and the workshop's title are what a
 * statement needs (decision 0002).
 */
export default async function ExpertEarningsPage() {
  const ctx = await requireExpert();
  const t = await getT();
  const locale = await getLocale();
  const e = await expertEarnings(ctx);
  const money = (paise: number) => formatPaise(paise, locale);
  const when = (iso: string) => formatInZone(new Date(iso), "Asia/Kolkata", { dateStyle: "medium" }, locale);
  const statusKey = (s: SessionPaymentStatus) => `gigs.paymentStatus${s}` as const;

  return (
    <div className="space-y-6">
      <PageHeader title={t("gigs.earningsTitle")} description={t("gigs.earningsIntro")} />
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4" data-testid="earnings-totals">
        {[
          [t("gigs.earningsHeld"), e.heldPaise],
          [t("gigs.earningsDue"), e.duePaise],
          [t("gigs.earningsReleased"), e.paidOutPaise],
          [t("gigs.earningsRefunded"), e.refundedPaise],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-[--radius-md] border border-border bg-surface px-3 py-2">
            <dt className="text-xs uppercase tracking-wide text-fg-muted">{label}</dt>
            <dd className="text-lg font-bold tabular-nums text-fg">{money(Number(value))}</dd>
          </div>
        ))}
      </dl>
      <Card>
        <CardHeader title={t("gigs.yourSeats")} />
        <CardBody>
          {e.rows.length === 0 ? (
            <p className="py-4 text-center text-sm text-fg-muted">{t("gigs.earningsNone")}</p>
          ) : (
            <ul className="divide-y divide-border" data-testid="earnings-rows">
              {e.rows.map((r) => (
                <li key={r.paymentId} className="flex flex-wrap items-start justify-between gap-2 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-medium text-fg">{r.title}</p>
                    <p className="text-xs text-fg-muted">
                      {when(r.startsAt)} · {r.schoolName}
                      {r.status === "REFUNDED" ? ` · ${t("gigs.refundLine", { amount: money(r.amountPaise) })}` : ` · ${t("gigs.earningsFigures", { net: money(r.netPaise), amount: money(r.amountPaise), commission: money(r.commissionPaise), gst: money(r.gstPaise) })}`}
                      {r.holdUntil && (r.status === "HELD" || r.status === "PAID") ? ` · ${t("gigs.holdUntilLine", { date: when(r.holdUntil) })}` : ""}
                      {r.dueAt && r.status === "DUE" ? ` · ${t("gigs.dueAtLine", { date: when(r.dueAt) })}` : ""}
                      {r.paidOutAt && r.status === "PAID_OUT" ? ` · ${when(r.paidOutAt)}` : ""}
                    </p>
                  </div>
                  <Badge tone={TONE[r.status]}>{t(statusKey(r.status))}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader title={t("gigs.payoutsTitle")} />
        <CardBody>
          {e.payouts.length === 0 ? (
            <p className="py-4 text-center text-sm text-fg-muted">{t("gigs.opPayoutsNone")}</p>
          ) : (
            <ul className="divide-y divide-border" data-testid="earnings-payouts">
              {e.payouts.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-fg">{p.status === "PAID" ? t("gigs.payoutLine", { amount: money(p.netPaise), count: p.paymentsCount }) : t("gigs.payoutOpenLine", { amount: money(p.netPaise), count: p.paymentsCount })}</p>
                    <p className="text-xs text-fg-muted">{p.status === "PAID" && p.paidAt ? t("gigs.paidOutLine", { date: when(p.paidAt), reference: p.reference ?? "" }) : when(p.createdAt)}</p>
                  </div>
                  {p.invoiceId && (
                    <Button asChild size="sm" variant="secondary">
                      <a href={`/api/v1/expert/invoices/${p.invoiceId}/pdf`} target="_blank" rel="noreferrer noopener">
                        {t("gigs.invoicePdf")}
                      </a>
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader title={t("gigs.invoicesTitle")} />
        <CardBody>
          {e.invoices.length === 0 ? (
            <p className="py-4 text-center text-sm text-fg-muted">{t("gigs.invoicesNone")}</p>
          ) : (
            <ul className="divide-y divide-border" data-testid="earnings-invoices">
              {e.invoices.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <p className="text-sm text-fg">{t("gigs.invoiceLine", { number: i.number, date: when(i.issuedAt), total: money(i.totalPaise) })}</p>
                  <Button asChild size="sm" variant="secondary">
                    <a href={`/api/v1/expert/invoices/${i.id}/pdf`} target="_blank" rel="noreferrer noopener">
                      {t("gigs.invoicePdf")}
                    </a>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
