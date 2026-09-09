import { useState } from "react";
import { Linking, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { competitionDetailSchema, competitionEnterResultSchema, okSchema } from "@edulink/contracts";
import { Button, Card, Failed, Loading, Row, Screen, Text } from "@/components";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useRole } from "@/lib/session";
import { openWeb } from "../staff/shared";
import { formatInstant, formatMilli, Note, param, Pill } from "../family/shared";

const DATE: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };

/** "3rd" — an English value, like a date; the label around it is what translates. */
export function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  const suffix = { 1: "st", 2: "nd", 3: "rd" }[n % 10] ?? "th";
  return `${n}${suffix}`;
}

/**
 * One competition, the web's /competitions/[competitionId]: what the reader
 * can do about it first (a pupil enters, a guardian says yes), then the
 * dates, the brief, the schools' board and the rules. Handing work in,
 * withdrawing and organising are the web's forms and open there.
 */
export function CompetitionDetail() {
  const params = useLocalSearchParams<{ competitionId?: string }>();
  const competitionId = param(params.competitionId);
  const t = useT();
  const th = useTheme();
  const role = useRole();
  const qc = useQueryClient();
  const { locale } = useLocale();
  const [note, setNote] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["shared", "competitions", competitionId],
    queryFn: async () => competitionDetailSchema.parse(unwrap(await api().get(`/api/v1/shared/competitions/${competitionId}`))),
    enabled: Boolean(competitionId),
  });
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["shared", "competitions"] });
  };
  const enter = useMutation({
    mutationFn: async () => {
      const result = await api().post(`/api/v1/shared/competitions/${competitionId}/enter`, {});
      if (!result.ok) throw new Error(errorText(result, t("competitions.thatDidNotGo")));
      return competitionEnterResultSchema.parse(result.data);
    },
    onSuccess: (res) => {
      const title = query.data?.title ?? "";
      setNote(res.awaitingConsent ? `${t("competitions.askedToEnter")} ${t("competitions.grownUpMustYes", { title })}` : `${t("competitions.enteredToast")} ${t("competitions.takingPartIn", { title })}`);
      refresh();
    },
  });
  const consent = useMutation({
    mutationFn: async ({ entryId }: { entryId: string; childName: string }) => {
      const result = await api().post(`/api/v1/shared/competitions/entries/${entryId}/consent`, {});
      if (!result.ok) throw new Error(errorText(result, t("competitions.thatDidNotGo")));
      return okSchema.parse(result.data);
    },
    onSuccess: (_res, { childName }) => {
      setNote(`${t("competitions.consentGiven")} ${t("competitions.childCanTakePart", { child: childName, title: query.data?.title ?? "" })}`);
      refresh();
    },
  });

  const c = query.data;
  if (!competitionId) {
    return (
      <Screen title={t("competitions.title")}>
        <Failed message={t("convo.errorInvalid")} />
      </Screen>
    );
  }
  const when = (iso: string | null) => (iso ? formatInstant(iso, locale, DATE) : null);
  const closes = when(c?.registrationClosesAt ?? null);
  const starts = when(c?.startsAt ?? null);
  const ends = when(c?.endsAt ?? null);
  const staff = role === "ADMIN" || role === "TEACHER";
  const external = c?.externalUrl ?? null;
  const hasActions = Boolean(c && (role === "STUDENT" || role === "PARENT" || c.isOrganiser || staff || external));
  const retryConsent = consent.variables;
  const entryPill = (awaiting: boolean) => <Pill tone={awaiting ? "warn" : "ok"} label={awaiting ? t("competitions.waitingForGrownUp") : t("competitions.youAreEntered")} />;
  const result = (scoreMilli: number | null, rank: number | null) =>
    scoreMilli === null && rank === null ? null : <Pill tone="ok" label={[rank !== null ? t("competitions.placeLabel", { n: ordinal(rank) }) : null, scoreMilli !== null ? t("competitions.pointsLabel", { n: formatMilli(scoreMilli) }) : null].filter(Boolean).join(" · ")} />;

  return (
    <Screen title={c?.title ?? t("competitions.title")} description={c?.summary} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {c ? (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: th.space[2] }}>
            {c.verified ? <Pill tone="accent" label={t("competitions.verified")} /> : null}
            {c.status !== "PUBLISHED" ? <Pill label={c.status === "DRAFT" ? t("competitions.notPublishedYet") : t("competitions.archived")} /> : null}
            <Text variant="sm" tone="muted">
              {t("competitions.runBy", { name: c.organizerName })}
            </Text>
          </View>
          {note ? (
            <Note tone="ok">
              <Text variant="sm" accessibilityLiveRegion="polite">
                {note}
              </Text>
            </Note>
          ) : null}
          {hasActions ? (
          <Card>
            {role === "STUDENT" ? (
              c.entry ? (
                <>
                  {entryPill(c.entry.awaitingConsent)}
                  {result(c.entry.scoreMilli, c.entry.rank)}
                  {!c.entry.awaitingConsent && c.acceptingWork ? (
                    <Button label={c.entry.submissionUrl ? t("competitions.changeIt") : t("competitions.handItIn")} variant="secondary" onPress={() => openWeb(`/competitions/${competitionId}`)} />
                  ) : (
                    <Text variant="sm" tone="muted">
                      {c.entry.awaitingConsent ? t("competitions.handInOnceYes") : t("competitions.finished")}
                    </Text>
                  )}
                  <Button label={t("competitions.withdraw")} variant="ghost" onPress={() => openWeb(`/competitions/${competitionId}`)} />
                </>
              ) : c.open ? (
                <>
                  {enter.isError ? <Failed message={enter.error.message} onRetry={() => enter.mutate()} /> : null}
                  <Button label={t("competitions.enterThis")} onPress={() => enter.mutate()} busy={enter.isPending} />
                  {c.requiresParentConsent ? (
                    <Text variant="sm" tone="muted">
                      {t("competitions.grownUpAskedFirst")}
                    </Text>
                  ) : null}
                </>
              ) : (
                <Text variant="sm" tone="muted">
                  {t("competitions.entriesClosed")}
                </Text>
              )
            ) : null}
            {role === "PARENT" ? (
              c.waiting.length > 0 ? (
                <>
                  {consent.isError ? <Failed message={consent.error.message} onRetry={retryConsent ? () => consent.mutate(retryConsent) : undefined} /> : null}
                  {c.waiting.map((item) => (
                    <View key={item.entryId} style={{ gap: th.space[2] }}>
                      <Text variant="base">{t("competitions.wouldLikeToTakePart", { child: item.childName })}</Text>
                      <Text variant="xs" tone="muted">
                        {t("competitions.cannotUntilYes")}
                      </Text>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
                        <Button label={t("competitions.allow")} onPress={() => consent.mutate({ entryId: item.entryId, childName: item.childName })} busy={consent.isPending} />
                        <Button label={t("competitions.notThisTime")} variant="secondary" onPress={() => openWeb(`/competitions/${competitionId}`)} />
                      </View>
                    </View>
                  ))}
                </>
              ) : c.entry ? (
                <>
                  {entryPill(c.entry.awaitingConsent)}
                  {result(c.entry.scoreMilli, c.entry.rank)}
                </>
              ) : (
                <Text variant="sm" tone="muted">
                  {t("competitions.noChildAsked")}
                </Text>
              )
            ) : null}
            {c.isOrganiser ? (
              <>
                <Text variant="sm" tone="muted">
                  {t("competitions.yourSchoolOrganising")}
                  {c.status === "DRAFT" ? ` ${t("competitions.nobodyElseSeesYet")}` : ""}
                </Text>
                <Button label={c.status === "PUBLISHED" ? t("competitions.withdrawIt") : t("competitions.publishIt")} variant="secondary" onPress={() => openWeb(`/competitions/${competitionId}`)} />
              </>
            ) : null}
            {staff ? (
              <>
                <Button label={t("competitions.entriesAndResultsLink")} variant="secondary" onPress={() => openWeb(`/competitions/${competitionId}/entries`)} />
                <Text variant="sm" tone="muted">
                  {c.enteredCount === 0 ? t("competitions.noPupilsYet") : c.enteredCount === 1 ? t("competitions.pupilsTakingPartOne") : t("competitions.pupilsTakingPartMany", { count: c.enteredCount })}
                </Text>
              </>
            ) : null}
            {external ? <Button label={t("competitions.organiserPage")} variant="secondary" onPress={() => void Linking.openURL(external)} /> : null}
          </Card>
          ) : null}
          {closes || starts || ends ? (
            <Card title={t("competitions.dates")}>
              {closes ? <Row title={t("competitions.entriesClose")} right={<Text variant="sm">{closes}</Text>} /> : null}
              {starts ? <Row title={t("competitions.starts")} right={<Text variant="sm">{starts}</Text>} /> : null}
              {ends ? <Row title={t("competitions.ends")} right={<Text variant="sm">{ends}</Text>} /> : null}
            </Card>
          ) : null}
          {c.body ? (
            <Card title={t("competitions.about")}>
              <Text variant="base">{c.body}</Text>
            </Card>
          ) : null}
          {c.board.length > 0 ? (
            <Card title={t("competitions.schoolsDoing")}>
              <Text variant="xs" tone="muted">
                {staff ? t("competitions.rankedNotNamedStaff") : t("competitions.rankedNotNamed")}
              </Text>
              {c.board.map((row, index) => (
                <Row
                  key={row.schoolId}
                  title={`${index + 1}. ${row.schoolName}${row.isOwnSchool ? ` · ${t("competitions.yourSchool")}` : ""}`}
                  caption={[row.entrants === 1 ? t("competitions.resultsOne") : t("competitions.resultsMany", { count: row.entrants }), row.bestRank !== null ? t("competitions.bestPlace", { n: ordinal(row.bestRank) }) : null, row.bestScoreMilli !== null ? t("competitions.bestScore", { n: (row.bestScoreMilli / 1000).toFixed(1) }) : null].filter(Boolean).join(" · ")}
                />
              ))}
            </Card>
          ) : null}
          {c.eligibility || c.rules || c.prizes ? (
            <Card>
              {c.eligibility ? (
                <View style={{ gap: th.space[1] }}>
                  <Text variant="sm" bold accessibilityRole="header">
                    {t("competitions.whoCanEnter")}
                  </Text>
                  <Text variant="base">{c.eligibility}</Text>
                </View>
              ) : null}
              {c.rules ? (
                <View style={{ gap: th.space[1] }}>
                  <Text variant="sm" bold accessibilityRole="header">
                    {t("competitions.rules")}
                  </Text>
                  <Text variant="base">{c.rules}</Text>
                </View>
              ) : null}
              {c.prizes ? (
                <View style={{ gap: th.space[1] }}>
                  <Text variant="sm" bold accessibilityRole="header">
                    {t("competitions.prizes")}
                  </Text>
                  <Text variant="base">{c.prizes}</Text>
                </View>
              ) : null}
            </Card>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}
