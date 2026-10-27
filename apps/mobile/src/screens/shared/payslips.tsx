import { useState } from "react";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { formatPaise, type TranslationKey } from "@edulink/i18n";
import { myPayslipsSchema, type MyPayslips as MyPayslipsView } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { bytesApi, shareBytes } from "@/lib/download";
import { useLocale, useT } from "@/lib/i18n";
import { monthLabel } from "../staff/payroll";
import { formatDate } from "@/lib/dates";

export const MY_PAYSLIPS_PATH = "/api/v1/account/payslips";
export const MY_PAYSLIPS_KEY = ["account", "payslips"] as const;

/** The words a structure line goes by when it gives none: the dictionary's own, as the web and the PDF say it. */
const CODE_KEY: Record<string, TranslationKey> = {
  BASIC: "payroll.codeBasic",
  HRA: "payroll.codeHra",
  DA: "payroll.codeDa",
  CONVEYANCE: "payroll.codeConveyance",
  SPECIAL: "payroll.codeSpecial",
  OTHER_EARNING: "payroll.codeOtherEarning",
  PF_EMPLOYEE: "payroll.codePfEmployee",
  PF_EMPLOYER: "payroll.codePfEmployer",
  ESI_EMPLOYEE: "payroll.codeEsiEmployee",
  ESI_EMPLOYER: "payroll.codeEsiEmployer",
  PT: "payroll.codePt",
  TDS: "payroll.codeTds",
  ADVANCE: "payroll.codeAdvance",
  OTHER_DEDUCTION: "payroll.codeOtherDeduction",
};

/**
 * My own payslips — the web's /account/payslips: each locked month with its
 * PDF (in my language) handed to the share sheet and how the school recorded
 * paying it, the salary structure I am paid on (mine, never anyone else's)
 * and my advances. Any member of staff.
 */
export function MyPayslips() {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const query = useQuery({ queryKey: MY_PAYSLIPS_KEY, queryFn: async () => myPayslipsSchema.parse(unwrap(await api().get(MY_PAYSLIPS_PATH))) });
  const d = query.data;
  const [busy, setBusy] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const money = (p: number) => formatPaise(p, locale, { always: true });
  // How the school recorded paying each slip (owner-batch-item2b): the day, the mode and the reference, or not yet.
  const paidLine = (p: MyPayslipsView["slips"][number]["payment"]) =>
    p ? [t("salaryPay.myPaid", { date: formatDate(p.paidOn), mode: t(`payroll.mode${p.mode}` as TranslationKey) }), p.reference ? t("salaryPay.myPaidRef", { reference: p.reference }) : null].filter(Boolean).join(" · ") : t("salaryPay.myUnpaid");
  const home = <Button label={t("nav.overview")} variant="secondary" onPress={() => router.push("/(app)" as never)} />;
  const download = async (month: string) => {
    setBusy(month);
    setPdfError(null);
    const fallback = t("common.somethingWrong");
    const got = await bytesApi.get(`/api/v1/account/payslips/${month}/pdf`, fallback);
    const error = got.ok ? await shareBytes(got, `payslip-${month}.pdf`, fallback) : got.error;
    setBusy(null);
    setPdfError(error);
  };
  return (
    <Screen title={t("payroll.myTitle")} description={t("payroll.myIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {pdfError ? <Failed message={pdfError} /> : null}
      {d ? (
        <>
          <Card title={t("payroll.mySlips")}>
            {d.slips.length === 0 ? (
              <Empty icon="receipt" title={t("payroll.mySlipsNone")} body={t("payroll.mySlipsNoneBody")} action={home} />
            ) : (
              d.slips.map((s) => (
                <Row
                  key={s.month}
                  title={monthLabel(s.month, locale)}
                  caption={[`${t("payroll.colNet")} ${money(s.netPaise)} · ${t("payroll.colGross")} ${money(s.grossPaise)}`, paidLine(s.payment)].join("\n")}
                  right={<Button variant="secondary" label={t("payroll.slipPdf")} accessibilityLabel={`${t("payroll.slipPdf")}: ${monthLabel(s.month, locale)}`} busy={busy === s.month} onPress={() => void download(s.month)} />}
                />
              ))
            )}
          </Card>
          <Card title={t("payroll.myStructure")}>
            {!d.structure ? (
              <Empty icon="receipt" title={t("payroll.myStructureNone")} body={t("payroll.myStructureNoneBody")} action={home} />
            ) : (
              <>
                <Text variant="sm" tone="muted">
                  {t("payroll.myStructureBody", { name: d.structure.name, from: formatDate(d.structure.effectiveFrom) })}
                </Text>
                {d.structure.components.map((c) => (
                  <Row key={c.code} title={c.label || t(CODE_KEY[c.code] ?? "payroll.codeOtherEarning")} caption={c.monthlyPaise ? money(c.monthlyPaise) : t("payroll.byTheRules")} />
                ))}
                <Text variant="sm" bold>
                  {`${t("payroll.monthlyGross")}: ${money(d.structure.monthlyGrossPaise)}`}
                </Text>
              </>
            )}
          </Card>
          {d.advances.length ? (
            <Card title={t("payroll.myAdvances")}>
              {d.advances.map((a) => (
                <Row key={a.id} title={`${money(a.amountPaise)} · ${t(`payroll.advance${a.status}` as TranslationKey)}`} caption={a.status === "RECORDED" ? `${a.reason} · ${t("payroll.outstanding", { amount: money(a.outstandingPaise) })}` : a.reason} />
              ))}
            </Card>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}
