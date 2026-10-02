import type { Metadata } from "next";
import { formatPaise } from "@edulink/i18n";
import { requireExpert } from "@/lib/tenancy";
import { expertEarnings } from "@/lib/gig-payments";
import type { SessionPaymentStatus } from "@/lib/gig-payments";
import { formatInZone } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("gigs.earningsTitle"), robots: { index: false, follow: false } };
}

const TONE: Record<SessionPaymentStatus, "info" | "ok" | "neutral" | "warn" | "danger"> = { INITIATED: "info", PAID: "warn", HELD: "warn", RELEASED: "ok", REFUNDED: "neutral", FAILED: "danger" };

/**
 * The expert's earnings from paid workshop seats: on hold, paid out and
 * refunded, seat by seat, and the payouts the gateway released with its
 * settlement reference once known. No pupil's name: the school's and the
 * workshop's title are what a statement needs (decision 0002).
 */
export default async function ExpertEarningsPage() {
  const ctx = await requireExpert();
  const t = await getT();
  const locale = await getLocale();
  const e = await expertEarnings(ctx);
  const money = (paise: number) => formatPaise(paise, locale);
  const when = (iso: string) => formatInZone(new Date(iso), "Asia/Kolkata", { dateStyle: "medium" }, locale);

  return (
    <div className="space-y-6">
      <PageHeader title={t("gigs.earningsTitle")} description={t("gigs.earningsIntro")} />
      <dl className="grid grid-cols-3 gap-2" data-testid="earnings-totals">
        {[
          [t("gigs.earningsHeld"), e.heldPaise],
          [t("gigs.earningsReleased"), e.releasedPaise],
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
                      {when(r.startsAt)} · {r.schoolName} · {t("gigs.earningsNet", { net: money(r.netPaise), amount: money(r.amountPaise) })}
                      {r.holdUntil && r.status === "HELD" ? ` · ${t("gigs.holdUntilLine", { date: when(r.holdUntil) })}` : ""}
                      {r.settlementId ? ` · ${t("gigs.settlementRef", { ref: r.settlementId })}` : ""}
                    </p>
                  </div>
                  <Badge tone={TONE[r.status]}>{t(`gigs.paymentStatus${r.status}`)}</Badge>
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
                <li key={p.id} className="py-3">
                  <p className="text-sm font-medium text-fg">{t("gigs.payoutLine", { amount: money(p.amountPaise), count: p.transfers })}</p>
                  <p className="text-xs text-fg-muted">
                    {when(p.createdAt)} · {p.status}
                    {p.settlementId ? ` · ${t("gigs.settlementRef", { ref: p.settlementId })}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
