import type { Metadata } from "next";
import Link from "next/link";
import { WalletIcon } from "@phosphor-icons/react/ssr";
import { isCollegeKind } from "@edulink/contracts";
import { requireParent } from "@/lib/tenancy";
import { listContexts } from "@/lib/session";
import { institutionKindOf } from "@/lib/modules";
import { AccessError } from "@/lib/access-error";
import { myLedger } from "@/lib/college-fees";
import { getLocale, getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { CLAIM_STATUS_KEY, SCHEME_KEY, Table, day, money } from "@/components/college-office/parts";
import { ChildSwitcher } from "../child-switcher";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("collegeOffice.moneyTitle"), robots: { index: false, follow: false } };
}

/**
 * A COLLEGE CHILD'S MONEY, FOR THE GUARDIAN (the integration builder, 4 Oct
 * 2026; the office builder built the door GET /api/v1/student/ledger?childId=
 * and left the web page): the year's ledger by term net of the scholarship,
 * and the claims behind it. A minor's guardian always reads it; an adult's only
 * while the student grants MONEY (myLedger → assertGuardianAccess). Read only;
 * paying is the fee module's own page (decision 0003).
 */
export default async function ParentMoneyPage({ searchParams }: { searchParams: Promise<{ child?: string }> }) {
  const session = await requireParent();
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const { child } = await searchParams;
  const { children } = await listContexts(session.user.id);
  const kinds = await Promise.all(children.map(async (c) => ({ c, college: isCollegeKind((await institutionKindOf(c.schoolId)) ?? "SCHOOL") })));
  const atCollege = kinds.filter((k) => k.college).map((k) => k.c);
  const selected = atCollege.find((c) => c.studentMembershipId === child) ?? atCollege[0];
  if (!selected) {
    return (
      <div className="space-y-5">
        <PageHeader title={t("collegeOffice.moneyTitle")} />
        <EmptyState title={t("collegeHub.parentMoneyNoChild")} description={t("collegeHub.parentMoneyNoChildBody")} action={<Button asChild size="sm" variant="secondary"><Link href="/parent/fees">{t("collegeHub.parentMoneyFees")}</Link></Button>} />
      </div>
    );
  }
  const switcher = atCollege.length > 1 ? <ChildSwitcher pupils={atCollege} selectedId={selected.studentMembershipId} basePath="/parent/money" /> : null;
  const l = await myLedger(session, selected.studentMembershipId).catch((error: unknown) => {
    if (error instanceof AccessError) return error;
    throw error;
  });
  if (l instanceof AccessError) {
    return (
      <div className="space-y-5">
        <PageHeader title={t("collegeOffice.moneyTitle")} />
        {switcher}
        <EmptyState title={t("collegeHub.parentMoneyNotGranted")} description={t(l.key, l.vars)} action={<Button asChild size="sm" variant="secondary"><Link href="/parent">{t("collegeOffice.goHome")}</Link></Button>} />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <PageHeader title={t("collegeOffice.moneyTitle")} description={t("collegeOffice.moneyIntro", { year: l.year?.name ?? "—" })} />
      {switcher}
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
            <EmptyState title={t("collegeOffice.moneyEmpty")} description={t("collegeOffice.moneyEmptyBody")} action={<Button asChild size="sm" variant="secondary"><Link href="/parent">{t("collegeOffice.goHome")}</Link></Button>} />
          ) : (
            <Table head={[t("collegeOffice.colTerm"), t("collegeOffice.colDue"), t("collegeOffice.colDemand"), t("collegeOffice.colScholarship"), t("collegeOffice.colPaid"), t("collegeOffice.colNetDue")]} testId="parent-ledger">
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
