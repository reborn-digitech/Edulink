import { useState } from "react";
import { Linking, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { contestEntriesSchema, contestLeaderboardSetSchema, contestResultSetSchema, type ContestEntries } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Icon, Loading, Screen, Stat, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useRole } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { must, Refusal } from "../staff/shared";
import { formatMilli, param, Pill } from "../family/shared";

type Entry = ContestEntries["entries"][number];

/**
 * The web's /competitions/[id]/entries: THIS school's entries in one
 * competition and what they scored, for its admins and teachers — a score and
 * a place per child, typed where the result is read out (a hall, not a desk).
 * Other schools' entries are not filtered out here; the policy never lets
 * them reach this school at all. The organising school's admin also switches
 * the schools' leaderboard on and off here.
 */
export function CompetitionEntries() {
  const params = useLocalSearchParams<{ competitionId?: string }>();
  const competitionId = param(params.competitionId);
  const t = useT();
  const th = useTheme();
  const role = useRole();
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["contest", "entries", competitionId],
    queryFn: async () => contestEntriesSchema.parse(unwrap(await api().get(`/api/v1/contest/competitions/${competitionId}/entries`))),
    enabled: Boolean(competitionId),
  });
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["contest", "entries", competitionId] });
    void qc.invalidateQueries({ queryKey: ["shared", "competitions"] });
  };
  const board = useMutation({
    mutationFn: async (enabled: boolean) => contestLeaderboardSetSchema.parse(must(await api().post(`/api/v1/contest/competitions/${competitionId}/leaderboard`, { enabled }), t("competitions.thatDidNotGo"))),
    onSuccess: (res) => {
      toast.show(res.enabled ? t("competitions.boardPublishedToast") : t("competitions.boardTakenDown"));
      refresh();
    },
  });

  if (!competitionId) {
    return (
      <Screen title={t("competitions.entriesAndResults")}>
        <Failed message={t("convo.errorInvalid")} />
      </Screen>
    );
  }
  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace({ pathname: "/(app)/competitions/detail", params: { competitionId } } as never);
  };
  const d = query.data;
  const entries = d?.entries ?? [];
  const handedIn = entries.filter((e) => e.submissionUrl).length;
  const results = entries.filter((e) => e.scoreMilli !== null || e.rank !== null).length;
  const organiser = role === "ADMIN" && Boolean(d?.competition.isOrganiser);
  const boardOn = Boolean(d?.competition.leaderboardEnabled);

  return (
    <Screen title={t("competitions.entriesAndResults")} description={t("competitions.yourPupilsOnly")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <Text variant="lg" bold>
            {d.competition.title}
          </Text>
          {entries.length > 0 ? (
            <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
              <Stat label={t("competitions.entered")} value={entries.length} />
              <Stat label={t("competitions.handedIn")} value={handedIn} />
              <Stat label={t("competitions.resultRecorded")} value={results} tone={results > 0 ? "ok" : "fg"} />
            </View>
          ) : null}
          {organiser ? (
            <Card title={boardOn ? t("competitions.boardPublished") : t("competitions.noBoard")}>
              <Text variant="sm" tone="muted">
                {t("competitions.boardExplainer")}
              </Text>
              {board.isError ? <Failed message={board.error.message} onRetry={() => board.mutate(!boardOn)} /> : null}
              <Button label={boardOn ? t("competitions.takeBoardDown") : t("competitions.publishBoard")} variant={boardOn ? "ghost" : "secondary"} busy={board.isPending} onPress={() => board.mutate(!boardOn)} />
              {boardOn ? (
                <Text variant="xs" tone="subtle">
                  {t("competitions.takingDownKeeps")}
                </Text>
              ) : null}
            </Card>
          ) : null}
          {entries.length === 0 ? (
            <Empty icon="trophy" title={t("competitions.nobodyEntered")} body={t("competitions.nobodyEnteredBody")} action={<Button label={t("competitions.backToCompetition")} variant="secondary" onPress={back} />} />
          ) : (
            entries.map((entry) => <EntryCard key={`${entry.entryId}:${entry.scoreMilli}:${entry.rank}`} entry={entry} onSaved={refresh} />)
          )}
        </>
      ) : null}
    </Screen>
  );
}

/**
 * One child's entry and what it scored. EMPTY IS NOT ZERO: both boxes empty
 * clears the result; 0 records a nought. Keyed by the saved values, so a
 * save that lands starts the card again from what the server now holds.
 */
function EntryCard({ entry, onSaved }: { entry: Entry; onSaved: () => void }) {
  const t = useT();
  const th = useTheme();
  const toast = useToast();
  const startScore = entry.scoreMilli === null ? "" : formatMilli(entry.scoreMilli);
  const startPlace = entry.rank === null ? "" : String(entry.rank);
  const [score, setScore] = useState(startScore);
  const [place, setPlace] = useState(startPlace);
  const save = useMutation({
    mutationFn: async (body: { score: string; rank: string }) => contestResultSetSchema.parse(must(await api().post(`/api/v1/contest/entries/${entry.entryId}/result`, body), t("competitions.didNotSave"))),
    onSuccess: (res) => {
      toast.show(res.cleared ? t("competitions.resultCleared") : t("competitions.resultSaved"));
      onSaved();
    },
  });
  const issues = save.error instanceof Refusal ? save.error.issues : {};
  const onField = Boolean(issues.score || issues.rank);
  const body = { score: score.trim(), rank: place.trim() };
  const dirty = body.score !== startScore || body.rank !== startPlace;
  const url = entry.submissionUrl;
  const status = entry.awaitingConsent ? (
    <Pill tone="warn" label={t("competitions.waitingOnGuardian")} />
  ) : entry.status === "RESULTS" ? (
    <Pill tone="ok" label={t("competitions.resultRecorded")} />
  ) : (
    <Pill label={entry.status === "SUBMITTED" ? t("competitions.handedIn") : t("competitions.entered")} />
  );
  return (
    <Card title={entry.studentName} action={status}>
      {url ? (
        <Button label={t("competitions.openTheirEntry")} variant="ghost" icon={<Icon name="arrowSquareOut" size={18} color={th.accentStrong} weight="bold" />} onPress={() => void Linking.openURL(url)} accessibilityLabel={`${t("competitions.openTheirEntry")}: ${entry.studentName}`} style={{ alignSelf: "flex-start" }} />
      ) : (
        <Text variant="sm" tone="muted">
          {t("competitions.nothingHandedIn")}
        </Text>
      )}
      <View style={{ flexDirection: "row", gap: th.space[3] }}>
        <View style={{ flex: 1 }}>
          <Field label={t("competitions.score")} accessibilityLabel={`${t("competitions.score")}: ${entry.studentName}`} value={score} onChangeText={setScore} keyboardType="decimal-pad" maxLength={20} error={issues.score} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label={t("competitions.place")} accessibilityLabel={`${t("competitions.place")}: ${entry.studentName}`} value={place} onChangeText={setPlace} keyboardType="number-pad" maxLength={10} error={issues.rank} />
        </View>
      </View>
      <Text variant="xs" tone="muted">
        {t("competitions.emptyClears")}
      </Text>
      {save.isError && !onField ? <Failed message={save.error.message} onRetry={() => save.mutate(body)} /> : null}
      <Button label={t("common.save")} accessibilityLabel={`${t("common.save")}: ${entry.studentName}`} variant="secondary" busy={save.isPending} disabled={!dirty} onPress={() => save.mutate(body)} />
    </Card>
  );
}
