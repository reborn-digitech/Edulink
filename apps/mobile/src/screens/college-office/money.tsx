import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { familyChildrenSchema, studentLedgerSchema } from "@edulink/contracts";
import { formatPaise } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useRole } from "@/lib/session";
import { ChildSwitcher, childQuery } from "../family/shared";

/**
 * A college student's money on the phone (4 Oct 2026), the web's
 * /student/money: this year's ledger by term — the demand, what the
 * scholarship is expected to cover, what was paid and what is owed net of the
 * state's share. Paying is the fee module's screen.
 *
 * A guardian's too (5 Oct 2026, the web's /parent/money; the campaign's
 * "parent money on the phone"): the same ledger of a child at a college, a
 * child switch for two, read through the same door — a minor's always, an
 * adult's only while they grant MONEY, and the refusal says so as the server
 * says it.
 */
export function StudentMoneyScreen() {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const parent = useRole() === "PARENT";
  const [childId, setChildId] = useState<string | null>(null);
  const children = useQuery({ queryKey: ["family", "children"], enabled: parent, queryFn: async () => familyChildrenSchema.parse(unwrap(await api().get("/api/v1/family/children"))) });
  const query = useQuery({ queryKey: ["student", "ledger", childId], queryFn: async () => studentLedgerSchema.parse(unwrap(await api().get(`/api/v1/student/ledger${childQuery(childId)}`))) });
  const l = query.data;
  const money = (paise: number) => formatPaise(paise, locale);
  return (
    <Screen title={t("collegeOffice.moneyTitle")} description={l ? t("collegeOffice.moneyIntro", { year: l.year?.name ?? "—" }) : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {parent ? <ChildSwitcher pupils={children.data?.children ?? []} selectedId={childId} onSelect={setChildId} /> : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {l ? (
        <Card>
          <Row title={t("collegeOffice.colDemand")} right={<Text>{money(l.totals.demandPaise)}</Text>} />
          <Row title={t("collegeOffice.colScholarship")} right={<Text>{money(l.totals.scholarshipReceivablePaise)}</Text>} />
          <Row title={t("collegeOffice.colPaid")} right={<Text>{money(l.totals.paidPaise)}</Text>} />
          <Row title={t("collegeOffice.colNetDue")} right={<Text bold>{money(l.totals.netDuePaise)}</Text>} />
        </Card>
      ) : null}
      {l && l.terms.length === 0 ? <Empty icon="receipt" title={t("collegeOffice.moneyEmpty")} body={t("collegeOffice.moneyEmptyBody")} action={<Button label={t("fees.myFeesTitle")} variant="secondary" onPress={() => router.push("/(app)/fees" as never)} />} /> : null}
      {l && l.terms.length > 0 ? (
        <Card>
          {l.terms.map((x) => (
            <Row
              key={x.demandId}
              title={x.label}
              caption={`${t("collegeOffice.colDemand")} ${money(x.demandPaise)} · ${t("collegeOffice.colScholarship")} ${money(x.scholarshipReceivablePaise)} · ${t("collegeOffice.colPaid")} ${money(x.paidPaise)}`}
              right={<Text bold>{money(x.netDuePaise)}</Text>}
            />
          ))}
        </Card>
      ) : null}
      {l ? (
        <Text variant="sm" tone="muted">
          {t("collegeOffice.moneyHowToPay")}
        </Text>
      ) : null}
    </Screen>
  );
}
