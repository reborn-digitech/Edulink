import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleOff } from "@/components/module-off";
import { LINK } from "@/components/module-flash";
import { PageHeader } from "@/components/ui/page-header";
import { PayrollStatementView } from "@/components/payroll-statement";
import { AccessError } from "@/lib/access-error";
import { statementFor } from "@/lib/payroll";
import { getT } from "@/lib/i18n/server";
import { payrollGate } from "../../shared";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("payroll.statement") };
}

/** A member of staff's yearly earnings statement, for the office. */
export default async function PayrollStatementPage({ params, searchParams }: { params: Promise<{ membershipId: string }>; searchParams: Promise<{ year?: string }> }) {
  const { ctx, t, locale, on } = await payrollGate(true);
  if (!on) return <ModuleOff page module="PAYROLL" t={t} />;
  const { membershipId } = await params;
  const { year } = await searchParams;
  let s;
  try {
    s = await statementFor(ctx, membershipId, year);
  } catch (error) {
    if (error instanceof AccessError) notFound();
    throw error;
  }
  return (
    <div className="space-y-6">
      <PageHeader title={t("payroll.statement")} description={<Link className={LINK} href="/admin/payroll/salaries">{t("payroll.tabSalaries")}</Link>} />
      <PayrollStatementView s={s} t={t} locale={locale} yearHref={(y) => `/admin/payroll/statement/${membershipId}?year=${y}`} />
    </div>
  );
}
