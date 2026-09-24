import { useState } from "react";
import { Linking, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { competitionDetailSchema, competitionEnterResultSchema, contestStatusSetSchema, okSchema } from "@edulink/contracts";
import { Button, Card, Failed, Field, Loading, Row, Screen, Text, useToast } from "@/components";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useRole } from "@/lib/session";
import { must, Refusal } from "../staff/shared";
import { formatInstant, formatMilli, Note, param, Pill } from "../family/shared";

const DATE: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };

type Status = "PUBLISHED" | "ARCHIVED" | "DRAFT";
/** The far-reaching press waiting on its second tap: withdrawing, a guardian's no, publishing or withdrawing the competition. */
type Confirming = { kind: "withdraw" } | { kind: "decline"; entryId: string } | { kind: "status"; next: Status } | null;

/** "3rd" — an English value, like a date; the label around it is what translates. */
export function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  const suffix = { 1: "st", 2: "nd", 3: "rd" }[n % 10] ?? "th";
  return `${n}${suffix}`;
}

/**
 * One competition, the web's /competitions/[competitionId]: what the reader
 * can do about it first — a pupil enters, hands in the link to their work,
 * changes it or withdraws; a guardian says yes or "Not this time"; the
 * organising school's admin publishes or withdraws it; staff go to their
 * school's entries — then the dates, the brief, the schools' board and the
 * rules. Withdrawing, a guardian's no and publishing ask twice.
 */
export function CompetitionDetail() {
  const params = useLocalSearchParams<{ competitionId?: string }>();
  const competitionId = param(params.competitionId);
  const t = useT();
  const th = useTheme();
  const role = useRole();
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const { locale } = useLocale();
  const [note, setNote] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<Confirming>(null);

  const query = useQuery({
    queryKey: ["shared", "competitions", competitionId],
    queryFn: async () => competitionDetailSchema.parse(unwrap(await api().get(`/api/v1/shared/competitions/${competitionId}`))),
    enabled: Boolean(competitionId),
  });
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["shared", "competitions"] });
    void qc.invalidateQueries({ queryKey: ["contest"] });
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
  /** The pupil withdrawing (childName null) and a guardian's "Not this time" are the same DELETE: the entry goes, and the child may ask again. */
  const withdraw = useMutation({
    mutationFn: async ({ entryId }: { entryId: string; childName: string | null }) => okSchema.parse(must(await api().request("DELETE", `/api/v1/contest/entries/${entryId}`), t("competitions.thatDidNotGo"))),
    onSuccess: (_res, { childName }) => {
      setConfirming(null);
      setNote(null);
      toast.show(childName ? t("competitions.childTakenOut", { child: childName, title: query.data?.title ?? "" }) : t("competitions.withdrawnDot"));
      refresh();
    },
  });
  const status = useMutation({
    mutationFn: async (next: Status) => contestStatusSetSchema.parse(must(await api().post(`/api/v1/contest/competitions/${competitionId}/status`, { status: next }), t("competitions.thatDidNotGo"))),
    onSuccess: (res) => {
      setConfirming(null);
      toast.show(res.status === "PUBLISHED" ? t("competitions.publishedMsg") : res.status === "ARCHIVED" ? t("competitions.withdrawnFromList") : t("competitions.backToADraft"));
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
  // https or nothing: the server refuses anything else, and the phone does
  // not hand itself to a scheme an older record or a tampered answer names.
  const external = c?.externalUrl && /^https:\/\/[^\s/]+/i.test(c.externalUrl.trim()) ? c.externalUrl.trim() : null;
  const hasActions = Boolean(c && (role === "STUDENT" || role === "PARENT" || c.isOrganiser || staff || external));
  const retryConsent = consent.variables;
  const retryWithdraw = withdraw.variables;
  const retryStatus = status.variables;
  const next = confirming?.kind === "status" ? confirming.next : null;
  const withdrawFailed = withdraw.isError ? <Failed message={withdraw.error.message} onRetry={retryWithdraw ? () => withdraw.mutate(retryWithdraw) : undefined} /> : null;
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
                      <HandIn key={c.entry.submissionUrl ?? ""} competitionId={competitionId} existingUrl={c.entry.submissionUrl} onDone={refresh} />
                    ) : (
                      <Text variant="sm" tone="muted">
                        {c.entry.awaitingConsent ? t("competitions.handInOnceYes") : t("competitions.finished")}
                      </Text>
                    )}
                    {withdrawFailed}
                    {confirming?.kind === "withdraw" ? (
                      <Confirm sentence={t("competitions.canAskAgain")} label={t("competitions.withdraw")} danger busy={withdraw.isPending} onConfirm={() => withdraw.mutate({ entryId: c.entry!.id, childName: null })} onCancel={() => setConfirming(null)} />
                    ) : (
                      <Button label={t("competitions.withdraw")} variant="ghost" onPress={() => setConfirming({ kind: "withdraw" })} style={{ alignSelf: "flex-start" }} />
                    )}
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
                    {withdrawFailed}
                    {c.waiting.map((item) => (
                      <View key={item.entryId} style={{ gap: th.space[2] }}>
                        <Text variant="base">{t("competitions.wouldLikeToTakePart", { child: item.childName })}</Text>
                        <Text variant="xs" tone="muted">
                          {t("competitions.cannotUntilYes")}
                        </Text>
                        {confirming?.kind === "decline" && confirming.entryId === item.entryId ? (
                          <Confirm
                            sentence={t("competitions.declineConfirm", { child: item.childName, title: c.title })}
                            label={t("competitions.notThisTime")}
                            accessibilityLabel={`${t("competitions.notThisTime")}: ${item.childName}`}
                            danger
                            busy={withdraw.isPending}
                            onConfirm={() => withdraw.mutate({ entryId: item.entryId, childName: item.childName })}
                            onCancel={() => setConfirming(null)}
                          />
                        ) : (
                          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
                            <Button label={t("competitions.allow")} onPress={() => consent.mutate({ entryId: item.entryId, childName: item.childName })} busy={consent.isPending} />
                            <Button label={t("competitions.notThisTime")} variant="secondary" onPress={() => setConfirming({ kind: "decline", entryId: item.entryId })} />
                          </View>
                        )}
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
                  {role === "ADMIN" ? (
                    <>
                      {status.isError ? <Failed message={status.error.message} onRetry={retryStatus ? () => status.mutate(retryStatus) : undefined} /> : null}
                      {next ? (
                        <Confirm
                          sentence={next === "PUBLISHED" ? t("competitions.postIntro") : c.enteredCount === 0 ? null : c.enteredCount === 1 ? t("competitions.withdrawKeepsOne") : t("competitions.withdrawKeepsMany", { count: c.enteredCount })}
                          label={next === "PUBLISHED" ? t("competitions.publishIt") : t("competitions.withdrawIt")}
                          danger={next === "ARCHIVED"}
                          busy={status.isPending}
                          onConfirm={() => status.mutate(next)}
                          onCancel={() => setConfirming(null)}
                        />
                      ) : (
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
                          {c.status !== "PUBLISHED" ? <Button label={t("competitions.publishIt")} onPress={() => setConfirming({ kind: "status", next: "PUBLISHED" })} /> : null}
                          {c.status === "PUBLISHED" ? <Button label={t("competitions.withdrawIt")} variant="secondary" onPress={() => setConfirming({ kind: "status", next: "ARCHIVED" })} /> : null}
                          {c.status === "ARCHIVED" ? <Button label={t("competitions.backToDraft")} variant="ghost" busy={status.isPending} onPress={() => status.mutate("DRAFT")} /> : null}
                        </View>
                      )}
                    </>
                  ) : null}
                </>
              ) : null}
              {staff ? (
                <>
                  <Button label={t("competitions.entriesAndResultsLink")} variant="secondary" onPress={() => router.push({ pathname: "/(app)/competition-entries", params: { competitionId } } as never)} />
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

/**
 * The pupil's hand-in: the link to their work, https only. A LINK, not a
 * file — the submit endpoint holds `submissionUrl` and nothing else, because
 * competition work goes to the organiser's own site and a child's work stored
 * here for somebody who cannot read it would be worse than useless. Keyed by
 * the saved link, so a change that lands starts it again from the server's.
 */
function HandIn({ competitionId, existingUrl, onDone }: { competitionId: string; existingUrl: string | null; onDone: () => void }) {
  const t = useT();
  const th = useTheme();
  const toast = useToast();
  const [url, setUrl] = useState(existingUrl ?? "");
  const submit = useMutation({
    mutationFn: async (value: string) => okSchema.parse(must(await api().post(`/api/v1/contest/competitions/${competitionId}/submit`, { url: value }), t("competitions.thatDidNotGo"))),
    onSuccess: () => {
      toast.show(existingUrl ? t("competitions.changed") : t("competitions.handedInToast"));
      onDone();
    },
  });
  const fieldError = submit.error instanceof Refusal ? (submit.error.issues.url ?? null) : null;
  const value = url.trim();
  return (
    <View style={{ gap: th.space[2] }}>
      <Field
        label={existingUrl ? t("competitions.yourEntry") : t("competitions.handInYourEntry")}
        value={url}
        onChangeText={setUrl}
        placeholder={t("competitions.urlPlaceholder")}
        hint={t("competitions.linkToWork")}
        error={fieldError}
        keyboardType="url"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={500}
        returnKeyType="send"
        onSubmitEditing={() => (value && value !== existingUrl ? submit.mutate(value) : undefined)}
      />
      {submit.isError && !fieldError ? <Failed message={submit.error.message} onRetry={() => submit.mutate(value)} /> : null}
      <Button label={existingUrl ? t("competitions.changeIt") : t("competitions.handItIn")} busy={submit.isPending} disabled={value.length === 0 || value === existingUrl} onPress={() => submit.mutate(value)} />
      <Text variant="xs" tone="muted">
        {t("competitions.teacherCanSee")}
      </Text>
    </View>
  );
}

/** The second tap of a far-reaching press: what it will do, then the same verb again, or Cancel. */
function Confirm({ sentence, label, accessibilityLabel, danger, busy, onConfirm, onCancel }: { sentence: string | null; label: string; accessibilityLabel?: string; danger?: boolean; busy: boolean; onConfirm: () => void; onCancel: () => void }) {
  const t = useT();
  const th = useTheme();
  return (
    <View style={{ gap: th.space[2] }}>
      {sentence ? <Text variant="sm">{sentence}</Text> : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
        <Button label={label} {...(accessibilityLabel ? { accessibilityLabel } : {})} variant={danger ? "danger" : "primary"} busy={busy} onPress={onConfirm} style={{ flexGrow: 1 }} />
        <Button label={t("common.cancel")} variant="ghost" onPress={onCancel} />
      </View>
    </View>
  );
}
