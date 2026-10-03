import type { Metadata } from "next";
import Link from "next/link";
import { ModuleOff } from "@/components/module-off";
import { LINK } from "@/components/module-flash";
import { PageHeader } from "@/components/ui/page-header";
import { PayrollStatementView } from "@/components/payroll-statement";
import { requireUser } from "@/lib/tenancy";
import { isModuleOn } from "@/lib/modules";
import { myStatement } from "@/lib/payroll";
import { SCHOOL_STAFF_ROLES } from "@/lib/staff-records";
import { getLocale, getT } from "@/lib/i18n/server";
import { redirect } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("payroll.statement") };
}

/** My yearly earnings statement, April to March, from my locked slips. */
export default async function MyStatementPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const ctx = await requireUser();
  if (!ctx.schoolId || !ctx.role || !(SCHOOL_STAFF_ROLES as readonly string[]).includes(ctx.role)) redirect("/account/payslips");
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  if (!(await isModuleOn(ctx.schoolId, "PAYROLL"))) return <ModuleOff module="PAYROLL" t={t} />;
  const { year } = await searchParams;
  const s = await myStatement(ctx, year);
  return (
    <div className="space-y-6">
      <PageHeader title={t("payroll.statement")} description={<Link className={LINK} href="/account/payslips">{t("payroll.myTitle")}</Link>} />
      <PayrollStatementView s={s} t={t} locale={locale} yearHref={(y) => `/account/payslips/statement?year=${y}`} />
    </div>
  );
}
