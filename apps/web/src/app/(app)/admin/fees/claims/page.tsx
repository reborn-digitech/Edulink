import type { Metadata } from "next";
import { BankIcon, QrCodeIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { listClaims } from "@/lib/fees-payments";
import { FEE_CLAIM_STALE_DAYS } from "@/lib/constants";
import { todayKey } from "@/lib/dates";
import { getT } from "@/lib/i18n/server";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { ClaimRow } from "./claim-row";
import { BankMatcher } from "./bank-matcher";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.feeClaims") };
}

/**
 * UPI payments families say they made, waiting for the office to check
 * against the bank statement. One at a time by row, or many at once by
 * pasting the statement. The office's alone: a receipt is issued here.
 */
export default async function ClaimsPage() {
  const t = await getT();
  const ctx = await requireRole("ADMIN");
  const school = await db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } });
  const { claims, waitingForUtr } = await listClaims(ctx, todayKey(school.timezone));

  return (
    <div className="space-y-6">
      <PageHeader title={t("fees.claimsTitle")} description={t("fees.claimsIntro")} back={{ href: "/admin/fees", label: t("fees.title") }} />

      {waitingForUtr > 0 && <p className="text-sm text-fg-muted">{t("fees.claimsWaitingUtr", { count: waitingForUtr })}</p>}

      {claims.length === 0 ? (
        <EmptyState icon={<QrCodeIcon weight="duotone" className="size-8" />} title={t("fees.claimsEmpty")} />
      ) : (
        // `relative` makes the scroller the containing block of the header's
        // sr-only label (position: absolute), which otherwise escapes the
        // scroll and widens the whole page on a phone.
        <div className="relative overflow-x-auto rounded-[var(--radius-lg)] border border-border bg-surface shadow-sm" tabIndex={0}>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-fg-muted">
              <tr>
                <th className="px-4 py-3 font-medium">{t("fees.claimColPupil")}</th>
                <th className="px-4 py-3 text-right font-medium">{t("fees.claimColAmount")}</th>
                <th className="px-4 py-3 font-medium">{t("fees.claimColUtr")}</th>
                <th className="px-4 py-3 font-medium">{t("fees.claimColRef")}</th>
                <th className="px-4 py-3 font-medium">{t("fees.claimColWhen")}</th>
                <th className="px-4 py-3 font-medium">{t("fees.claimColBy")}</th>
                <th className="px-4 py-3">
                  <span className="sr-only">{t("fees.claimColDecide")}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {claims.map((c) => (
                <ClaimRow
                  key={c.paymentId}
                  timezone={school.timezone}
                  staleAfterDays={FEE_CLAIM_STALE_DAYS}
                  claim={{ paymentId: c.paymentId, studentMembershipId: c.studentMembershipId, pupilName: c.pupilName, className: c.className, amountPaise: c.amountPaise, utr: c.utr, reference: c.reference, claimedAt: c.claimedAt?.toISOString() ?? null, payer: c.payer, stale: c.stale }}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Card>
        <CardHeader icon={<BankIcon weight="duotone" className="size-5" />} title={t("fees.matchTitle")} description={t("fees.matchIntro")} />
        <CardBody>
          <BankMatcher />
        </CardBody>
      </Card>
    </div>
  );
}
