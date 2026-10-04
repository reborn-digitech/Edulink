import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { iqacOverviewSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Stat, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useSession } from "@/lib/session";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { CollegeRoleHome } from "@/screens/college/role-home";

/**
 * The IQAC coordinator's home on the phone (the IQAC module, 4 Oct 2026), the
 * web's /iqac at a glance: the cycle's predicted CGPA and band, the distance
 * to the next, the ten cheapest metrics, the open surveys and grievances, and
 * the regulators' calendar — with the sentence that the platform does not
 * score for NAAC. The predictor's detail, the filings and the registers are
 * on the web. While the college has IQAC off, the foundation's home says so.
 */
export function IqacHome() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const session = useSession();
  const me = session.status === "signed-in" ? session.me : null;
  const on = (me?.modules ?? []).includes("IQAC");
  const query = useQuery({ queryKey: ["iqac", "overview"], enabled: on, queryFn: async () => iqacOverviewSchema.parse(unwrap(await api().get("/api/v1/iqac/overview"))) });
  if (!on) return <CollegeRoleHome role="IQAC" />;
  const o = query.data;
  return (
    <Screen title={t("iqac.title")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Text variant="sm" tone="muted">
        {t("iqac.notAScore")}
      </Text>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {o ? (
        <>
          {o.cycle ? (
            <Card title={t("iqac.cycleTitle")}>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[3] }}>
                <Stat label={t("iqac.cgpaLabel")} value={o.cycle.cgpa?.toFixed(2) ?? "—"} />
                <Stat label={t("iqac.gradeLabel")} value={o.cycle.grade ?? "—"} />
              </View>
              <Text variant="sm" tone="muted">
                {o.nextBand ? t("iqac.nextBandLine", { distance: o.nextBand.distance.toFixed(2), grade: o.nextBand.grade, min: o.nextBand.min.toFixed(2) }) : t("iqac.topBand")}
              </Text>
            </Card>
          ) : (
            <Empty icon="medal" title={t("iqac.noCycleTitle")} body={t("iqac.noCycleBody")} action={<Button label={t("nav.bulletin")} variant="secondary" onPress={() => router.push("/(app)/bulletin" as never)} />} />
          )}
          {o.cheapest.length ? (
            <Card title={t("iqac.cheapestTitle")}>
              {o.cheapest.map((m) => (
                <Row key={m.code} title={`${m.code} ${m.text}`} caption={t("iqac.cheapestRow", { gain: m.gainPerUnit.toFixed(4), unit: m.unit })} />
              ))}
            </Card>
          ) : null}
          <Card>
            <Row title={t("iqac.navSurveys")} caption={String(o.counts.openSurveys)} />
            <Row title={t("iqac.navGrievances")} caption={`${o.counts.openGrievances}${o.counts.overdueGrievances ? ` · ${t("iqac.overdueBadge")}` : ""}`} />
          </Card>
          <Card title={t("iqac.calendarTitle")}>
            {o.calendar.map((c) => (
              <Row key={c.code} title={c.label} caption={`${t("iqac.calendarDue", { from: c.from, to: c.to })}${c.filedThisYear ? ` · ${t("iqac.calendarFiled")}` : ""}`} />
            ))}
            <Text variant="xs" tone="muted">
              {t("iqac.calendarCheck")}
            </Text>
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
