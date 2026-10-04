import type { Metadata } from "next";
import Link from "next/link";
import { WalletIcon } from "@phosphor-icons/react/ssr";
import { isCollegeKind } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf } from "@/lib/modules";
import { myLedger } from "@/lib/college-fees";
import { getLocale, getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { CLAIM_STATUS_KEY, NotCollege, SCHEME_KEY, Table, day, money } from "@/components/college-office/parts";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("collegeOffice.moneyTitle") };
}

/**
 * THE COLLEGE STUDENT'S MONEY (4 Oct 2026): this year's ledger by term — the
 * demand, what the scholarship is expected to cover, what was paid, and what
 * is owed net of the state's share — and the claims behind it. Paying is the
 * fee module's (the college's own gateway, UPI or the counter; decision 0003).
 */
export default async function StudentMoneyPage() {
  const ctx = await requireRole("STUDENT");
  const [t, locale, kind] = await Promise.all([getT(), getLocale(), institutionKindOf(ctx.schoolId)]);
  if (!isCollegeKind(kind ?? "SCHOOL")) return <NotCollege t={t} />;
  const l = await myLedger(ctx);
  return (
    <div className="space-y-6">
      <PageHeader title={t("collegeOffice.moneyTitle")} description={t("collegeOffice.moneyIntro", { year: l.year?.name ?? "—" })} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label={t("collegeOffice.colDemand")} value={money(l.totals.demandPaise, locale)} />
        <StatTile label={t("collegeOffice.colScholarship")} value={money(l.totals.scholarshipReceivablePaise, locale)} tone="accent" />
        <StatTile label={t("collegeOffice.colPaid")} value={money(l.totals.paidPaise, locale)} tone="ok" />
        <StatTile label={t("collegeOffice.colNetDue")} value={money(l.totals.netDuePaise, locale)} tone={l.totals.netDuePaise > 0 ? "warn" : "neutral"} />
      </div>
      <Card>
        <CardHeader icon={<WalletIcon weight="duotone" className="size-5" />} title={t("collegeOffice.byTerm")} />
        <CardBody>
          {l.terms.length === 0 ? (
            <EmptyState title={t("collegeOffice.moneyEmpty")} description={t("collegeOffice.moneyEmptyBody")} action={<Button asChild size="sm" variant="secondary"><Link href="/student">{t("collegeOffice.goHome")}</Link></Button>} />
          ) : (
            <Table head={[t("collegeOffice.colTerm"), t("collegeOffice.colDue"), t("collegeOffice.colDemand"), t("collegeOffice.colScholarship"), t("collegeOffice.colPaid"), t("collegeOffice.colNetDue")]} testId="student-ledger">
              {l.terms.map((x) => (
                <tr key={x.demandId}>
                  <td className="py-2 pr-3">{x.label}</td>
                  <td className="py-2 pr-3">{day(x.dueDateKey, locale)}</td>
                  <td className="py-2 pr-3 tabular-nums">{money(x.demandPaise, locale)}</td>
                  <td className="py-2 pr-3 tabular-nums">{money(x.scholarshipReceivablePaise, locale)}</td>
                  <td className="py-2 pr-3 tabular-nums">{money(x.paidPaise, locale)}</td>
                  <td className="py-2 pr-3 font-medium tabular-nums">{money(x.netDuePaise, locale)}</td>
                </tr>
              ))}
            </Table>
          )}
          {l.claims.length > 0 ? (
            <ul className="mt-4 space-y-1 text-sm">
              {l.claims.map((c) => (
                <li key={c.id}>
                  {t(SCHEME_KEY(c.scheme))}: {t(CLAIM_STATUS_KEY(c.status))}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-4 text-xs text-fg-muted">{t("collegeOffice.moneyHowToPay")}</p>
        </CardBody>
      </Card>
    </div>
  );
}
