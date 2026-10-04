import Link from "next/link";
import { formatPaise } from "@edulink/i18n";
import type { PayrollStatement } from "@edulink/contracts";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { LINK, NUM, TD, TH } from "@/components/module-flash";
import { CODE_LABEL_KEY } from "@/lib/payroll-rules";
import type { Translate, TranslationKey } from "@/lib/i18n/dictionary";
import { TableScroll } from "@/components/ui/table-scroll";

/**
 * A yearly earnings statement (April to March) from the locked runs: month
 * by month, and each component's year total. Drawn the same for the office
 * (/admin/payroll/statement/<person>) and for the person (/account/payslips/statement).
 */
export function PayrollStatementView({ s, t, locale, yearHref }: { s: PayrollStatement; t: Translate; locale: string; yearHref: (year: string) => string }) {
  const money = (p: number) => formatPaise(p, locale as "en", { always: true });
  const start = Number(s.year.slice(0, 4));
  const prev = `${start - 1}-${String(start % 100).padStart(2, "0")}`;
  const next = `${start + 1}-${String((start + 2) % 100).padStart(2, "0")}`;
  const monthLabel = (m: string) => {
    const [y, mm] = m.split("-").map(Number) as [number, number];
    return new Intl.DateTimeFormat(locale === "en" ? "en-IN" : `${locale}-IN`, { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, mm - 1, 1)));
  };
  return (
    <Card>
      <CardHeader
        title={t("payroll.statementTitle", { name: s.name, year: s.year })}
        description={t("payroll.statementBody")}
        action={
          <span className="flex gap-3 text-sm">
            <Link className={LINK} href={yearHref(prev)}>{prev}</Link>
            <Link className={LINK} href={yearHref(next)}>{next}</Link>
          </span>
        }
      />
      <CardBody className="space-y-6">
        {s.months.length === 0 ? (
          <EmptyState className="border-0 bg-transparent py-4" title={t("payroll.statementNone")} description={t("payroll.statementNoneBody")} />
        ) : (
          <>
            <TableScroll>
              <table className="w-full min-w-[32rem] text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className={TH}>{t("payroll.colMonth")}</th>
                    <th scope="col" className={`${TH} text-right`}>{t("payroll.colGross")}</th>
                    <th scope="col" className={`${TH} text-right`}>{t("payroll.colDeductions")}</th>
                    <th scope="col" className={`${TH} text-right`}>{t("payroll.colNet")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {s.months.map((m) => (
                    <tr key={m.month}>
                      <td className={TD}>{monthLabel(m.month)}</td>
                      <td className={NUM}>{money(m.grossPaise)}</td>
                      <td className={NUM}>{money(m.deductionsPaise)}</td>
                      <td className={NUM}>{money(m.netPaise)}</td>
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <td className={TD}>{t("payroll.pdfTotal")}</td>
                    <td className={NUM}>{money(s.grossPaise)}</td>
                    <td className={NUM}>{money(s.deductionsPaise)}</td>
                    <td className={NUM}>{money(s.netPaise)}</td>
                  </tr>
                </tbody>
              </table>
            </TableScroll>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className={TH}>{t("payroll.colComponent")}</th>
                  <th scope="col" className={TH}>{t("payroll.colKind")}</th>
                  <th scope="col" className={`${TH} text-right`}>{t("payroll.colYear")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {s.components.map((c) => (
                  <tr key={`${c.code}|${c.label}`}>
                    <td className={TD}>{c.label || t(CODE_LABEL_KEY[c.code as keyof typeof CODE_LABEL_KEY] as TranslationKey)}</td>
                    <td className={TD}>{t(`payroll.kind${c.kind}`)}</td>
                    <td className={NUM}>{money(c.paise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </CardBody>
    </Card>
  );
}
