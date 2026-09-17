import { View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { feeOverviewSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Stat, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useRole } from "@/lib/session";
import { formatInstant } from "../family/shared";
import { methodLabel, money, payStatusLabel, receiptPath } from "../shared/fees";
import { openWeb } from "./shared";

/**
 * The fees overview — the web's /admin/fees: what the school asked for this
 * year, what arrived, what is still to come, by grade and by age, with the
 * UPI claims waiting. The phone carries the reading, the dues, one pupil's
 * ledger with the counter, and the claims queue; the setup — heads,
 * structures, settings — and the exports stay on the web, each a row that
 * opens there signed in. The head reads; the office also collects.
 */
export function StaffFees() {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const role = useRole();
  const router = useRouter();
  const office = role === "ADMIN";
  const query = useQuery({
    queryKey: ["fees", "overview"],
    queryFn: async () => feeOverviewSchema.parse(unwrap(await api().get("/api/v1/fees/overview"))),
  });
  const d = query.data;
  const web = (path: string) => () => openWeb(path);
  return (
    <Screen title={t("fees.title")} description={d?.year ? `${d.year.name} · ${t("fees.overviewIntro")}` : t("fees.overviewIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d && !d.year ? <Empty title={t("fees.noYear")} action={<Button label={t("nav.calendar")} variant="secondary" onPress={() => router.push("/(app)/calendar" as never)} />} /> : null}
      {d?.year ? (
        <>
          <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
            <Stat label={t("fees.cardDemanded")} value={money(d.totals.demandedPaise, locale)} />
            <Stat label={t("fees.cardCollected")} value={money(d.totals.collectedPaise, locale)} tone="ok" />
            <Stat label={t("fees.cardOutstanding")} value={money(d.totals.outstandingPaise, locale)} tone={d.totals.outstandingPaise > 0 ? "warn" : "fg"} />
            <Stat label={t("fees.cardOverdue")} value={money(d.totals.overduePaise, locale)} tone={d.totals.overduePaise > 0 ? "danger" : "fg"} />
          </View>
          <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
            <Stat label={t("fees.cardPupilsOnPlan")} value={d.pupils.onPlan} />
            <Stat label={t("fees.cardPupilsWithout")} value={d.pupils.withoutPlan} tone={d.pupils.withoutPlan > 0 ? "warn" : "fg"} />
            <Stat label={t("fees.cardClaims")} value={d.claims.waiting} tone={d.claims.stale > 0 ? "danger" : d.claims.waiting > 0 ? "warn" : "fg"} />
          </View>
          {d.claims.stale > 0 ? (
            <Text variant="xs" tone="danger">
              {t("fees.phoneClaimsStale", { count: d.claims.stale })}
            </Text>
          ) : null}
          {d.structures === 0 ? (
            <Empty title={t("fees.noStructures")} body={t("fees.setUpStructuresHint")} action={<Button label={`${t("fees.linkStructures")} · ${t("fees.phoneOpensWeb")}`} variant="secondary" onPress={web("/admin/fees/structures")} />} />
          ) : null}

          <Card>
            <Row icon="users" title={t("fees.linkDues")} caption={t("fees.duesIntro")} onPress={() => router.push("/(app)/fees-dues" as never)} />
            {office ? <Row icon="checks" title={t("fees.linkClaims")} caption={t("fees.cardClaims")} right={<Text variant="lg" bold tone={d.claims.waiting > 0 ? "warn" : "muted"}>{String(d.claims.waiting)}</Text>} onPress={() => router.push("/(app)/fee-claims" as never)} /> : null}
          </Card>

          {d.byGrade.length > 0 ? (
            <Card title={t("fees.byGradeTitle")}>
              {d.byGrade.map((g) => (
                <Row
                  key={g.gradeLevel}
                  title={`${t("fees.structureGrade")} ${g.gradeLevel}`}
                  caption={[t("principal.pupilsMany", { count: g.pupils }), `${t("fees.cardCollected")} ${money(g.collectedPaise, locale)}`, g.overduePaise > 0 ? `${t("fees.cardOverdue")} ${money(g.overduePaise, locale)}` : null].filter(Boolean).join(" · ")}
                  right={
                    <Text variant="sm" bold tone={g.outstandingPaise > 0 ? "warn" : "ok"} style={{ fontVariant: ["tabular-nums"] }}>
                      {money(g.outstandingPaise, locale)}
                    </Text>
                  }
                />
              ))}
            </Card>
          ) : null}

          {d.totals.outstandingPaise > 0 ? (
            <Card title={t("fees.ageingTitle")}>
              <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
                <Stat label={t("fees.ageingCurrent")} value={money(d.ageing.current, locale)} />
                <Stat label={t("fees.ageing30")} value={money(d.ageing.d30, locale)} tone={d.ageing.d30 > 0 ? "warn" : "fg"} />
                <Stat label={t("fees.ageing90")} value={money(d.ageing.d90, locale)} tone={d.ageing.d90 > 0 ? "warn" : "fg"} />
                <Stat label={t("fees.ageing90plus")} value={money(d.ageing.d90plus, locale)} tone={d.ageing.d90plus > 0 ? "danger" : "fg"} />
              </View>
            </Card>
          ) : null}

          {d.methodsThisMonth.length > 0 ? (
            <Card title={t("fees.methodsTitle")}>
              {d.methodsThisMonth.map((m) => (
                <Row key={m.method} title={methodLabel(t, m.method)} caption={String(m.count)} right={<Text variant="sm" bold style={{ fontVariant: ["tabular-nums"] }}>{money(m.amountPaise, locale)}</Text>} />
              ))}
            </Card>
          ) : null}

          <Card title={t("fees.recentTitle")}>
            {d.recent.length === 0 ? (
              <Empty title={t("fees.parentNoHistory")} action={<Button label={t("fees.linkDues")} variant="secondary" onPress={() => router.push("/(app)/fees-dues" as never)} />} />
            ) : (
              d.recent.map((p) => (
                <Row
                  key={p.paymentId}
                  title={`${p.pupilName} · ${money(p.amountPaise, locale)}`}
                  caption={[methodLabel(t, p.method), payStatusLabel(t, p.status), formatInstant(p.when, locale), p.serial, p.receiptId ? t("fees.phoneOpensWeb") : null].filter(Boolean).join(" · ")}
                  onPress={p.receiptId ? () => openWeb(receiptPath(p.receiptId!)) : undefined}
                />
              ))
            )}
          </Card>

          <Card title={t("fees.setUpTitle")}>
            <Row icon="clipboard" title={t("fees.linkStructures")} caption={`${t("fees.setUpStructuresHint")} · ${t("fees.phoneOpensWeb")}`} onPress={web("/admin/fees/structures")} />
            <Row icon="fileText" title={t("fees.linkHeads")} caption={`${t("fees.setUpHeadsHint")} · ${t("fees.phoneOpensWeb")}`} onPress={web("/admin/fees/heads")} />
            {office ? (
              <>
                <Row icon="gear" title={t("fees.linkSettings")} caption={`${t("fees.setUpSettingsHint")} · ${t("fees.phoneOpensWeb")}`} onPress={web("/admin/fees/settings")} />
                <Row icon="share" title={t("fees.linkExportCollections")} caption={t("fees.phoneOpensWeb")} onPress={web("/admin/fees/export/collections")} />
                <Row icon="share" title={t("fees.linkExportOutstanding")} caption={t("fees.phoneOpensWeb")} onPress={web("/admin/fees/export/outstanding")} />
                <Row icon="arrowsClockwise" title={t("fees.linkCarryForward")} caption={t("fees.phoneOpensWeb")} onPress={web("/admin/fees/carry-forward")} />
              </>
            ) : null}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
