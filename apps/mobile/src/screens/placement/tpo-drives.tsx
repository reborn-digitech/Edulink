import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { driveListSchema, type DriveSummary } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { ModuleOffScreen, useModuleOn } from "@/screens/shared/desk";
import { DRIVE_STATUS_KEY, packageRange } from "./words";

/**
 * The cell's drives on the phone (the parity batch, 10 Oct 2026, R-4), the
 * web's /placement/drives: every drive of the college and the pooled drives
 * it is a guest of, the live ones first, each opening its own screen (the
 * applicants, the rounds, an offer, and moving the drive on). Opening a drive
 * and its rule stay on the web.
 */
export function TpoDrivesScreen() {
  const t = useT();
  const router = useRouter();
  const on = useModuleOn("PLACEMENT");
  const query = useQuery({ queryKey: ["placement", "drives"], enabled: on, queryFn: async () => driveListSchema.parse(unwrap(await api().get("/api/v1/placement/drives"))) });
  if (!on) return <ModuleOffScreen title={t("placement.tabDrives")} module="PLACEMENT" />;
  const drives = query.data?.drives ?? [];
  const live = drives.filter((d) => d.status !== "CLOSED");
  const closed = drives.filter((d) => d.status === "CLOSED");
  const row = (d: DriveSummary) => (
    <Row
      key={d.id}
      title={d.title}
      caption={[d.companyName, packageRange(d.packageMinRupees, d.packageMaxRupees, t), t(DRIVE_STATUS_KEY[d.status]!), d.hosted ? null : t("deskParity.driveGuestOf", { host: d.hostName }), `${t("placement.colApplicants")} ${d.applicants}`, `${t("placement.colOffers")} ${d.offers}`].filter(Boolean).join(" · ")}
      onPress={() => router.push({ pathname: "/(app)/placement-drive", params: { driveId: d.id } } as never)}
    />
  );
  return (
    <Screen title={t("placement.tabDrives")} description={t("deskParity.drivesIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {query.data && drives.length === 0 ? <Empty icon="briefcase" title={t("placement.noDrivesTitle")} body={t("placement.noDrivesBody")} action={<Button label={t("nav.more")} variant="secondary" onPress={() => router.push("/(app)/more" as never)} />} /> : null}
      {live.length > 0 ? <Card title={t("deskParity.drivesLive", { count: live.length })}>{live.map(row)}</Card> : null}
      {closed.length > 0 ? (
        <Card title={t("deskParity.drivesClosed", { count: closed.length })}>
          <Text variant="xs" tone="muted">
            {t("deskParity.drivesClosedBody")}
          </Text>
          {closed.map(row)}
        </Card>
      ) : null}
    </Screen>
  );
}
