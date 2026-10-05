import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { formatPaise, type TranslationKey } from "@edulink/i18n";
import { payrollSummarySchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useRole } from "@/lib/session";
import { formatMonth } from "@/lib/dates";

export const PAYROLL_PATH = "/api/v1/admin/payroll";
export const PAYROLL_KEY = ["admin", "payroll"] as const;

/** "September 2026" in the reader's language. */
export function monthLabel(month: string, locale: string, short = false): string {
  return /^\d{4}-\d{2}$/.test(month) ? formatMonth(`${month}-01`, locale, short) : month;
}

/**
 * The payroll summary for the office and the head — the web's
 * /admin/payroll overview, READ-ONLY on the phone: who has a salary, each
 * month's run with its totals, and what payroll cost by month and by
 * department. No one's payslip is here; runs are drafted and locked on the
 * web.
 */
export function StaffPayroll() {
  const t = useT();
  const { locale } = useLocale();
  const role = useRole();
  const router = useRouter();
  const office = role === null || role === "ADMIN" || role === "PRINCIPAL";
  const query = useQuery({ queryKey: PAYROLL_KEY, enabled: office, queryFn: async () => payrollSummarySchema.parse(unwrap(await api().get(PAYROLL_PATH))) });
  const d = query.data;
  const home = <Button label={t("nav.overview")} variant="secondary" onPress={() => router.push("/(app)" as never)} />;
  if (!office) {
    return (
      <Screen title={t("payroll.title")}>
        <Empty icon="receipt" title={t("payroll.title")} body={t("payroll.intro")} action={home} />
      </Screen>
    );
  }
  const money = (p: number) => formatPaise(p, locale);
  return (
    <Screen title={t("payroll.title")} description={t("payroll.intro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <Card title={t("payroll.tabOverview")}>
            <Text variant="sm">{`${t("payroll.statStaff")}: ${d.withSalary}/${d.staffCount}`}</Text>
            {d.latestLockedMonth ? <Text variant="sm">{`${t("payroll.statHeadcount")}: ${monthLabel(d.latestLockedMonth, locale)}`}</Text> : null}
            {d.canEdit && d.advancesWaiting > 0 ? (
              <Text variant="sm" tone="accent">
                {t("payroll.advancesWaiting", { count: d.advancesWaiting })}
              </Text>
            ) : null}
            {!d.canEdit ? (
              <Text variant="xs" tone="muted">
                {t("payroll.headReads")}
              </Text>
            ) : null}
          </Card>
          <Card title={t("payroll.runsTitle")}>
            {d.runs.length === 0 ? (
              <Empty icon="receipt" title={t("payroll.runsNone")} body={d.canEdit ? t("payroll.runsNoneBody") : t("payroll.runsNoneHead")} action={home} />
            ) : (
              d.runs.map((r) => (
                <Row
                  key={r.month}
                  title={`${monthLabel(r.month, locale)} · ${t(`payroll.status${r.status}` as TranslationKey)}`}
                  caption={[`${t("payroll.colPeople")} ${r.headcount}`, `${t("payroll.colGross")} ${money(r.grossPaise)}`, `${t("payroll.colNet")} ${money(r.netPaise)}`, `${t("payroll.colEmployer")} ${money(r.employerPaise)}`].join(" · ")}
                />
              ))
            )}
          </Card>
          <Card title={t("payroll.costByMonth")}>
            {d.costByMonth.length === 0 ? (
              <Empty icon="chartLine" title={t("payroll.noLockedRun")} body={t("payroll.noLockedRunBody")} action={home} />
            ) : (
              d.costByMonth.map((m) => <Row key={m.month} title={monthLabel(m.month, locale, true)} caption={money(m.grossPaise + m.employerPaise)} />)
            )}
          </Card>
          <Card title={t("payroll.costByDepartment")}>
            {d.costByDepartment.length === 0 ? (
              <Empty icon="users" title={t("payroll.noLockedRun")} body={t("payroll.noLockedRunBody")} action={home} />
            ) : (
              d.costByDepartment.map((x) => <Row key={x.department} title={t(`payroll.dept${x.department}` as TranslationKey)} caption={[`${t("payroll.colPeople")} ${x.headcount}`, `${t("payroll.colGross")} ${money(x.grossPaise)}`, `${t("payroll.colEmployer")} ${money(x.employerPaise)}`].join(" · ")} />)
            )}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
