import { View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { placementSummarySchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Stat, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { DRIVE_STATUS_KEY, lpa, packageRange } from "./words";
import { CollegeRoleHome } from "../college/role-home";

/**
 * The TPO's home on the phone (the placement module, 4 Oct 2026): the
 * season's numbers and the drives at a glance — the web's /placement, whose
 * forms (a drive, its rule, rounds, offers, the table's sheets) stay on the
 * web. With placement switched off it is the college role home, which says so.
 */
export function TpoHome() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const session = useSession();
  const on = session.status === "signed-in" && (session.me.modules ?? []).includes("PLACEMENT");
  const query = useQuery({ queryKey: ["placement", "summary"], enabled: on, queryFn: async () => placementSummarySchema.parse(unwrap(await api().get("/api/v1/placement/summary"))) });
  if (session.status === "signed-in" && !on) return <CollegeRoleHome role="TPO" />;
  const s = query.data;
  return (
    <Screen title={t("placement.homeTitle")} description={s ? t("placement.homeIntro", { batch: s.batchYear }) : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {s ? (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
            <Stat label={t("placement.tileFinalYear")} value={s.table.finalYear} />
            <Stat label={t("placement.tilePlaced")} value={s.table.placed} tone="ok" />
            <Stat label={t("placement.tileMedian")} value={s.table.medianSalaryRupees === null ? "—" : lpa(s.table.medianSalaryRupees, t)} />
          </View>
          {/* B-29: a season whose batch has nobody finishing reads as broken beside a drive's eligible count; say why. */}
          <Text variant="sm" tone="subtle">
            {s.table.finalYear === 0 ? t("placement.tileFinalYearNone", { batch: s.batchYear }) : t("placement.tileFinalYearHint", { batch: s.batchYear })}
          </Text>
          <Card title={t("placement.waitingTitle")}>
            <Row title={t("placement.waitingRequirements", { count: s.requirementsWaiting })} />
            <Row title={t("placement.waitingInternships", { count: s.internshipsWaiting })} />
            <Row title={t("placement.waitingCompanies", { count: s.unverifiedCompanies })} />
          </Card>
          <Card title={t("placement.drivesTitle")}>
            {s.drives.length === 0 ? <Empty icon="briefcase" title={t("placement.noDrivesTitle")} body={t("placement.noDrivesBody")} action={<Button label={t("nav.more")} variant="secondary" onPress={() => router.push("/(app)/more" as never)} />} /> : null}
            {s.drives.map((d) => (
              <Row key={d.id} title={d.title} caption={`${d.companyName} · ${packageRange(d.packageMinRupees, d.packageMaxRupees, t)} · ${t(DRIVE_STATUS_KEY[d.status]!)} · ${t("placement.colApplicants")} ${d.applicants} · ${t("placement.colOffers")} ${d.offers}`} />
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
