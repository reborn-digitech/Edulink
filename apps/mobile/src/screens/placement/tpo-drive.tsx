import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { driveViewSchema, roundResultsResultSchema, type DriveApplicationView, type RoundOutcome } from "@edulink/contracts";
import { Button, Card, Failed, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Notice } from "../staff/shared";
import { DRIVE_STATUS_KEY, OUTCOME_KEY, applicationLabel, offerLine, packageRange } from "./words";

/**
 * ONE DRIVE ON THE TPO'S PHONE (5 Oct 2026, the campaign's TPO recommendation:
 * "the TPO is on campus with the recruiter"). The web's /placement/drives/[id]
 * at the size of a corridor: the eligible count, each applicant with where
 * they stand, and — for a drive the college hosts — the shortlist and each
 * round's outcome, one press a candidate, through the same door the web's
 * results table posts to (POST /api/v1/placement/drives/{id}/results), so the
 * rules are the library's: only a consented application, round n only for a
 * candidate through n − 1, each student told. Opening a drive, its rule, an
 * offer with its letter and the season's table stay on the web.
 */
export function TpoDriveScreen() {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const { driveId } = useLocalSearchParams<{ driveId?: string }>();
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const query = useQuery({ queryKey: ["placement", "drive", driveId], enabled: Boolean(driveId), queryFn: async () => driveViewSchema.parse(unwrap(await api().get(`/api/v1/placement/drives/${driveId}`))) });
  const record = useMutation({
    mutationFn: async (v: { round: number; studentMembershipId: string; outcome: RoundOutcome }) => roundResultsResultSchema.parse(unwrap(await api().post(`/api/v1/placement/drives/${driveId}/results`, { round: v.round, results: [{ studentMembershipId: v.studentMembershipId, outcome: v.outcome }] }))),
    onSuccess: (r) => {
      setNotice({ tone: "ok", text: t("placement.resultsSaved", { count: r.saved }) });
      void qc.invalidateQueries({ queryKey: ["placement"] });
    },
    onError: (e: Error) => setNotice({ tone: "danger", text: e.message }),
  });
  const d = query.data;
  /** The round a candidate is up for: the shortlist first, then the one after the last they passed; null when there is none left. */
  const nextRound = (a: DriveApplicationView): number | null => {
    if (!d || a.consentAt === null || a.status === "WITHDRAWN" || a.status === "REJECTED" || a.status === "SELECTED" || a.offer) return null;
    const passed = a.results.filter((r) => r.outcome === "PASSED").map((r) => r.round);
    const next = passed.length ? Math.max(...passed) + 1 : 0;
    return next <= d.rounds.length ? next : null;
  };
  const roundLabel = (n: number) => (n === 0 ? t("placement.roundShortlist") : t("placement.roundN", { round: n }));
  return (
    <Screen title={d?.title ?? t("placement.tabDrives")} description={d ? `${d.companyName} · ${packageRange(d.packageMinRupees, d.packageMaxRupees, t)} · ${t(DRIVE_STATUS_KEY[d.status]!)}` : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed error={query.error} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <Card>
            <Text>{t("placement.recruiterEligible", { count: d.eligibleCount })}</Text>
            <Text variant="sm" tone="muted">
              {t("placement.resultsIntro")}
            </Text>
          </Card>
          <Card title={t("placement.applicantsTitle", { count: d.applications.length })}>
            {d.applications.length === 0 ? <Text tone="muted">{t("placement.noApplicants")}</Text> : null}
            {d.applications.map((a) => {
              const next = d.hosted ? nextRound(a) : null;
              const last = a.results.length ? a.results[a.results.length - 1]! : null;
              const caption = [applicationLabel(a, t), last ? `${roundLabel(last.round)}: ${t(OUTCOME_KEY[last.outcome]!)}` : null, a.consentAt === null ? t("placement.awaitingConsentTitle") : null, a.offer ? offerLine(a.offer, t) : null].filter(Boolean).join(" · ");
              return (
                <View key={a.id} style={{ gap: th.space[2], paddingVertical: th.space[2], borderTopWidth: 1, borderColor: th.border }}>
                  <Row title={a.studentName} caption={caption} />
                  {next !== null ? (
                    <View style={{ flexDirection: "row", gap: th.space[2], flexWrap: "wrap" }}>
                      <Button label={`${roundLabel(next)}: ${t("placement.outcomePASSED")}`} disabled={record.isPending} onPress={() => record.mutate({ round: next, studentMembershipId: a.studentMembershipId, outcome: "PASSED" })} />
                      <Button label={t("placement.outcomeREJECTED")} variant="secondary" disabled={record.isPending} onPress={() => record.mutate({ round: next, studentMembershipId: a.studentMembershipId, outcome: "REJECTED" })} />
                      <Button label={t("placement.outcomeABSENT")} variant="secondary" disabled={record.isPending} onPress={() => record.mutate({ round: next, studentMembershipId: a.studentMembershipId, outcome: "ABSENT" })} />
                    </View>
                  ) : null}
                </View>
              );
            })}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
