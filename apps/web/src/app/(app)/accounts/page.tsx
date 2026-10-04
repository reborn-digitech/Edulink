import type { Metadata } from "next";
import Link from "next/link";
import { BankIcon, ChartBarIcon, FileCsvIcon, HandCoinsIcon, ListChecksIcon, PercentIcon, ReceiptIcon, StackIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import { isCollegeKind } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { accountsOverview } from "@/lib/accounts";
import { getLocale, getT } from "@/lib/i18n/server";
import { db } from "@/lib/db";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { NotCollege, Table, money, day } from "@/components/college-office/parts";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("role.accounts") };
}

/**
 * THE ACCOUNTS HOME (4 October 2026; role ACCOUNTS, which hangs on no module;
 * the office and the principal read it too). This term's collection against
 * demand by programme, the defaulters, what the state still owes in
 * scholarships by age, income and expense, the concessions waiting for the
 * principal, and the way to every desk the accounts office keeps: fee
 * structures, concessions, scholarships, no-dues, the fee ledger, payroll,
 * purchases and the fixed-asset register, and the auditor's schedules as
 * sheets. No money moves here (decision 0003).
 */
export default async function AccountsPage() {
  const ctx = await requireRole("ACCOUNTS", "ADMIN", "PRINCIPAL");
  const [t, locale, kind] = await Promise.all([getT(), getLocale(), institutionKindOf(ctx.schoolId)]);
  if (!isCollegeKind(kind ?? "SCHOOL")) {
    return (
      <div className="space-y-5">
        <PageHeader title={t("role.accounts")} />
        <NotCollege t={t} />
      </div>
    );
  }
  const [o, programmes, scholarshipsOn, payrollOn, inventoryOn] = await Promise.all([
    accountsOverview(ctx),
    db.programme.findMany({ where: { schoolId: ctx.schoolId }, select: { id: true, code: true } }),
    isModuleOn(ctx.schoolId, "SCHOLARSHIPS"),
    isModuleOn(ctx.schoolId, "PAYROLL"),
    isModuleOn(ctx.schoolId, "INVENTORY"),
  ]);
  const code = new Map(programmes.map((p) => [p.id, p.code]));
  const totals = o.collection.reduce((a, r) => ({ demand: a.demand + r.demandPaise, collected: a.collected + r.collectedPaise, outstanding: a.outstanding + r.outstandingPaise }), { demand: 0, collected: 0, outstanding: 0 });
  const receivable = o.receivableAgeing.reduce((a, r) => a + r.receivablePaise, 0);
  const links: { href: string; label: string; icon: React.ReactNode; show: boolean }[] = [
    { href: "/accounts/structures", label: t("collegeOffice.navStructures"), icon: <StackIcon weight="duotone" className="size-5" />, show: true },
    { href: "/accounts/concessions", label: t("collegeOffice.navConcessions"), icon: <PercentIcon weight="duotone" className="size-5" />, show: true },
    { href: "/accounts/scholarships", label: t("collegeOffice.navScholarships"), icon: <HandCoinsIcon weight="duotone" className="size-5" />, show: scholarshipsOn },
    { href: "/accounts/no-dues", label: t("collegeOffice.navNoDues"), icon: <ListChecksIcon weight="duotone" className="size-5" />, show: true },
    { href: "/accounts/students", label: t("collegeOffice.navStudents"), icon: <UsersThreeIcon weight="duotone" className="size-5" />, show: true },
    { href: "/admin/fees", label: t("collegeOffice.navFeeLedger"), icon: <ReceiptIcon weight="duotone" className="size-5" />, show: true },
    { href: "/admin/payroll", label: t("collegeOffice.navPayroll"), icon: <BankIcon weight="duotone" className="size-5" />, show: payrollOn },
    { href: "/admin/inventory/purchases", label: t("collegeOffice.navPurchases"), icon: <ReceiptIcon weight="duotone" className="size-5" />, show: inventoryOn },
    { href: "/admin/inventory/assets", label: t("collegeOffice.navAssets"), icon: <ChartBarIcon weight="duotone" className="size-5" />, show: inventoryOn },
  ];
  const reports = ["collection", "defaulters", "receivable", "income-expense", "finance-table"] as const;
  return (
    <div className="space-y-6">
      <PageHeader title={t("role.accounts")} description={t("collegeOffice.accountsIntro", { year: o.year?.name ?? "—" })} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label={t("collegeOffice.tileDemand")} value={money(totals.demand, locale)} />
        <StatTile label={t("collegeOffice.tileCollected")} value={money(totals.collected, locale)} tone="ok" />
        <StatTile label={t("collegeOffice.tileOutstanding")} value={money(totals.outstanding, locale)} tone={totals.outstanding > 0 ? "warn" : "neutral"} />
        <StatTile label={t("collegeOffice.tileReceivable")} value={money(receivable, locale)} tone="accent" hint={o.pendingConcessions > 0 ? t("collegeOffice.tilePendingConcessions", { n: o.pendingConcessions }) : undefined} />
      </div>
      <Card>
        <CardBody className="flex flex-wrap gap-2 pt-5">
          {links.filter((l) => l.show).map((l) => (
            <Button key={l.href} asChild variant="secondary" size="sm">
              <Link href={l.href}>
                {l.icon}
                {l.label}
              </Link>
            </Button>
          ))}
        </CardBody>
      </Card>
      <Card>
        <CardHeader icon={<ChartBarIcon weight="duotone" className="size-5" />} title={t("collegeOffice.collectionTitle")} description={t("collegeOffice.collectionIntro")} />
        <CardBody>
          {o.collection.length === 0 ? (
            <EmptyState title={t("collegeOffice.collectionEmpty")} description={t("collegeOffice.collectionEmptyBody")} action={<Button asChild size="sm"><Link href="/accounts/structures">{t("collegeOffice.navStructures")}</Link></Button>} />
          ) : (
            <Table head={[t("collegeOffice.colProgramme"), t("collegeOffice.colTerm"), t("collegeOffice.colDemand"), t("collegeOffice.colCollected"), t("collegeOffice.colOutstanding")]} testId="accounts-collection">
              {o.collection.map((r, i) => (
                <tr key={i}>
                  <td className="py-2 pr-3">{r.programmeId ? (code.get(r.programmeId) ?? "—") : "—"}</td>
                  <td className="py-2 pr-3">{r.term}</td>
                  <td className="py-2 pr-3 tabular-nums">{money(r.demandPaise, locale)}</td>
                  <td className="py-2 pr-3 tabular-nums">{money(r.collectedPaise, locale)}</td>
                  <td className="py-2 pr-3 tabular-nums">{money(r.outstandingPaise, locale)}</td>
                </tr>
              ))}
            </Table>
          )}
        </CardBody>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={t("collegeOffice.defaultersTitle")} />
          <CardBody>
            {o.defaulters.length === 0 ? (
              <p className="text-sm text-fg-muted">{t("collegeOffice.defaultersNone")}</p>
            ) : (
              <Table head={[t("collegeOffice.colName"), t("collegeOffice.colOverdue"), t("collegeOffice.colOldestDue")]}>
                {o.defaulters.slice(0, 20).map((d) => (
                  <tr key={d.studentMembershipId}>
                    <td className="py-2 pr-3">
                      <Link className="text-accent-strong hover:underline" href={`/accounts/students?student=${d.studentMembershipId}`}>
                        {d.name}
                      </Link>
                    </td>
                    <td className="py-2 pr-3 tabular-nums">{money(d.overduePaise, locale)}</td>
                    <td className="py-2 pr-3">{day(d.oldestDueKey, locale)}</td>
                  </tr>
                ))}
              </Table>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={t("collegeOffice.ageingTitle")} description={t("collegeOffice.ageingIntro")} />
          <CardBody>
            <Table head={[t("collegeOffice.colAge"), t("collegeOffice.colClaims"), t("collegeOffice.colReceivable")]}>
              {o.receivableAgeing.map((r) => (
                <tr key={r.bucket}>
                  <td className="py-2 pr-3">{t(`collegeOffice.ageing${r.bucket}`)}</td>
                  <td className="py-2 pr-3 tabular-nums">{r.claims}</td>
                  <td className="py-2 pr-3 tabular-nums">{money(r.receivablePaise, locale)}</td>
                </tr>
              ))}
            </Table>
          </CardBody>
        </Card>
      </div>
      <Card>
        <CardHeader title={t("collegeOffice.incomeTitle")} description={t("collegeOffice.incomeIntro")} />
        <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label={t("collegeOffice.sheetCollected")} value={money(o.incomeExpense.feesCollectedPaise, locale)} />
          <StatTile label={t("collegeOffice.sheetScholarships")} value={money(o.incomeExpense.scholarshipsDisbursedPaise, locale)} />
          <StatTile label={t("collegeOffice.sheetPurchases")} value={money(o.incomeExpense.purchasesPaise, locale)} />
          <StatTile label={t("collegeOffice.sheetSalaries")} value={money(o.incomeExpense.payrollGrossPaise, locale)} />
        </CardBody>
      </Card>
      <Card>
        <CardHeader icon={<FileCsvIcon weight="duotone" className="size-5" />} title={t("collegeOffice.schedulesTitle")} description={t("collegeOffice.schedulesIntro")} />
        <CardBody className="flex flex-wrap gap-2">
          {reports.map((r) => (
            <Button key={r} asChild variant="secondary" size="sm">
              <a href={`/accounts/export/${r}`} download>
                {t(`collegeOffice.report_${r.replace("-", "_")}` as TranslationKey)}
              </a>
            </Button>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
