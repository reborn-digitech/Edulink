import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { accountsOverviewSchema } from "@edulink/contracts";
import { formatPaise } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useSession } from "@/lib/session";

/**
 * The ACCOUNTS home on the phone (4 Oct 2026), the web's /accounts at a glance:
 * this year's demand, collection and what is outstanding, the scholarship
 * receivable by age, the defaulters, and the concessions waiting for the
 * principal. The desk's forms are on the web.
 */
export function AccountsHomeScreen() {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const session = useSession();
  const scholarships = session.status === "signed-in" && (session.me.modules ?? []).includes("SCHOLARSHIPS");
  const query = useQuery({ queryKey: ["accounts", "overview"], queryFn: async () => accountsOverviewSchema.parse(unwrap(await api().get("/api/v1/accounts/overview"))) });
  const o = query.data;
  const money = (paise: number) => formatPaise(paise, locale);
  const totals = o?.collection.reduce((a, r) => ({ demand: a.demand + r.demandPaise, collected: a.collected + r.collectedPaise, outstanding: a.outstanding + r.outstandingPaise }), { demand: 0, collected: 0, outstanding: 0 });
  return (
    <Screen title={t("role.accounts")} description={o ? t("collegeOffice.accountsIntro", { year: o.year?.name ?? "—" }) : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {/* The counter question, from the phone (5 Oct 2026): a student by PRN, their ledger and no-dues. */}
      <Button label={t("collegeDesks.lookupTitle")} onPress={() => router.push("/(app)/accounts-lookup" as never)} />
      {/* The desk's own pages, native since the parity batch (10 Oct 2026, R-4): the queues first. */}
      <Card>
        <Row title={t("collegeOffice.navConcessions")} caption={o && o.pendingConcessions > 0 ? `${t("collegeOffice.pendingTitle")}: ${o.pendingConcessions}` : undefined} onPress={() => router.push("/(app)/concessions" as never)} />
        <Row title={t("collegeOffice.navNoDues")} onPress={() => router.push("/(app)/no-dues" as never)} />
        {scholarships ? <Row title={t("collegeOffice.navScholarships")} onPress={() => router.push("/(app)/scholarship-claims" as never)} /> : null}
        <Row title={t("collegeOffice.navStructures")} onPress={() => router.push("/(app)/fee-structures" as never)} />
        <Row title={t("collegeOffice.navFeeLedger")} onPress={() => router.push("/(app)/fees" as never)} />
      </Card>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {o && totals ? (
        <Card>
          <Row title={t("collegeOffice.tileDemand")} right={<Text>{money(totals.demand)}</Text>} />
          <Row title={t("collegeOffice.tileCollected")} right={<Text tone="ok">{money(totals.collected)}</Text>} />
          <Row title={t("collegeOffice.tileOutstanding")} right={<Text tone={totals.outstanding > 0 ? "warn" : "fg"}>{money(totals.outstanding)}</Text>} />
          {o.pendingConcessions > 0 ? <Text variant="sm" tone="warn">{t("collegeOffice.tilePendingConcessions", { n: o.pendingConcessions })}</Text> : null}
        </Card>
      ) : null}
      {o ? (
        <Card>
          <Text bold>{t("collegeOffice.ageingTitle")}</Text>
          {o.receivableAgeing.map((r) => (
            <Row key={r.bucket} title={t(`collegeOffice.ageing${r.bucket}`)} caption={t("collegeOffice.colClaims") + ` ${r.claims}`} right={<Text>{money(r.receivablePaise)}</Text>} />
          ))}
        </Card>
      ) : null}
      {o && o.defaulters.length === 0 ? <Empty icon="checks" title={t("collegeOffice.defaultersNone")} body={t("collegeOffice.collectionIntro")} action={<Button label={t("nav.bulletin")} variant="secondary" onPress={() => router.push("/(app)/bulletin" as never)} />} /> : null}
      {o && o.defaulters.length > 0 ? (
        <Card>
          <Text bold>{t("collegeOffice.defaultersTitle")}</Text>
          {o.defaulters.slice(0, 20).map((d) => (
            <Row key={d.studentMembershipId} title={d.name} caption={d.oldestDueKey} right={<Text tone="warn">{money(d.overduePaise)}</Text>} />
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}
