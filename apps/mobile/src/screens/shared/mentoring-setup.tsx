import { useState } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import { communityMentoringOptionsSchema, communityMentorThreadSchema, mentoringPageSchema, okSchema, type CommunityMentoringOptions } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Icon, Loading, Screen, Text, useToast } from "@/components";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { haptics } from "@/lib/haptics";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useRole } from "@/lib/session";
import { Note, Pill, relativeTime } from "../family/shared";

type Pairing = CommunityMentoringOptions["pairing"];
type Request = z.infer<typeof mentoringPageSchema>["requests"][number];

/** The web's AskForm keeps the button off until the pupil has said something; the library's own "say a bit more" still has the last word. */
const ASK_MIN = 15;
/** The web's PairForm: a purpose of five characters or more. */
const PAIR_MIN = 5;
/** A school's whole roll is too long for a thumb; the search narrows it. */
const PUPILS_SHOWN = 12;

/**
 * Setting mentoring up — the forms on the web's /mentoring page, as their own
 * screen: a pupil asks their school for a mentor; a teacher or the office
 * pairs a pupil with a published expert (the guardians are asked next); the
 * office and the head decide what pupils have asked. Who sees which is the
 * web's branching on the role, and the server refuses the rest.
 */
export function MentoringSetup() {
  const role = useRole();
  const t = useT();
  if (role === null)
    return (
      <Screen title={t("mentoring.setUp")}>
        <Loading />
      </Screen>
    );
  if (role === "STUDENT") return <AskForMentor />;
  if (role === "ADMIN" || role === "TEACHER" || role === "PRINCIPAL") return <StaffSetUp role={role} />;
  return <NothingToSetUp />;
}

function useToList(): () => void {
  const router = useRouter();
  return () => router.push("/(app)/mentoring" as never);
}

function useOptions(enabled: boolean) {
  return useQuery({
    queryKey: ["community", "mentoring", "options"],
    enabled,
    queryFn: async () => communityMentoringOptionsSchema.parse(unwrap(await api().get("/api/v1/community/mentoring/options"))),
  });
}

/** A guardian or an expert has nothing to set up: mentoring is started by the school, and the guardian's part is agreeing in the thread. */
function NothingToSetUp() {
  const t = useT();
  const toList = useToList();
  return (
    <Screen title={t("mentoring.setUp")}>
      <Empty icon="handshake" title={t("mentoring.setUp")} body={t("mentoring.emptyBody")} action={<Button label={t("mentoring.all")} variant="secondary" onPress={toList} />} />
    </Screen>
  );
}

/** One choosable card in a list — a radio a thumb can hit, with the details the web's buttons carry. */
function Choice({ title, caption, tags = [], verified, selected, onPress }: { title: string; caption?: string; tags?: string[]; verified?: boolean; selected: boolean; onPress: () => void }) {
  const th = useTheme();
  const t = useT();
  return (
    <Pressable
      accessibilityRole="radio"
      aria-checked={selected}
      accessibilityState={{ checked: selected }}
      accessibilityLabel={caption ? `${title}, ${caption}` : title}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={({ pressed }) => ({
        minHeight: th.tap,
        padding: th.space[3],
        gap: th.space[1],
        borderRadius: th.radius.md,
        borderWidth: 1,
        borderColor: selected ? th.accent : th.border,
        backgroundColor: selected ? th.accentSoft : th.surface,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: th.space[2] }}>
        <Icon name={selected ? "checkCircle" : "circle"} size={20} color={selected ? th.accentStrong : th.fgSubtle} weight={selected ? "fill" : "regular"} />
        <Text variant="base" bold>
          {title}
        </Text>
        {verified ? <Pill tone="ok" label={t("mentoring.checked")} /> : null}
      </View>
      {caption ? (
        <Text variant="sm" tone="muted">
          {caption}
        </Text>
      ) : null}
      {tags.length > 0 ? (
        <Text variant="xs" tone="subtle">
          {tags.join(" · ")}
        </Text>
      ) : null}
    </Pressable>
  );
}

/* ------------------------------------------------------------------------- */
/* A pupil asking                                                            */
/* ------------------------------------------------------------------------- */

/**
 * The web's AskForm. The copy does the work: asking is not being paired — the
 * school looks first, then a grown-up at home — and that is said before the
 * pupil types anything. At the limit of waiting asks there is nothing to fill in.
 */
function AskForMentor() {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const toList = useToList();
  const query = useOptions(true);
  const [chosen, setChosen] = useState<string | null>(null);
  const [why, setWhy] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const ask = useMutation({
    mutationFn: async (body: { expertProfileId: string; purpose: string }) => {
      const result = await api().post("/api/v1/community/mentoring/ask", body);
      if (!result.ok) throw new Error(errorText(result, t("mentoring.didNotWork")));
      return communityMentorThreadSchema.parse(result.data);
    },
    onSuccess: () => {
      setChosen(null);
      setWhy("");
      setError(null);
      setSent(true);
      toast.show(t("mentoring.sentToSchool"));
      void qc.invalidateQueries({ queryKey: ["community", "mentoring"] });
      void qc.invalidateQueries({ queryKey: ["shared", "mentoring"] });
    },
    // The library's refusals ("say a bit more", "already asked") are about what was typed: they sit under the box.
    onError: (e) => setError(e.message),
  });
  const d = query.data;
  const atLimit = d ? d.openRequests >= d.maxOpenRequests : false;
  const ready = Boolean(chosen) && why.trim().length >= ASK_MIN;
  return (
    <Screen title={t("mentoring.askTitle")} description={t("mentoring.askDescription")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <Note tone="accent">
            <Text variant="sm">{t("mentoring.askExplainer")}</Text>
          </Note>
          {sent ? (
            <Note tone="ok">
              <Text variant="sm" bold tone="ok" accessibilityLiveRegion="polite">
                {t("mentoring.sentToSchool")}
              </Text>
              <Text variant="xs" tone="muted">
                {t("mentoring.willLetYouKnow")}
              </Text>
            </Note>
          ) : null}
          {atLimit ? (
            <Empty icon="handshake" title={t("mentoring.askTitle")} body={d.openRequests === 1 ? t("mentoring.atLimitOne") : t("mentoring.atLimitMany", { count: d.openRequests })} action={<Button label={t("mentoring.all")} variant="secondary" onPress={toList} />} />
          ) : d.askable.length === 0 ? (
            <Empty icon="handshake" title={t("mentoring.askTitle")} body={t("mentoring.nobodyToAsk")} action={<Button label={t("mentoring.all")} variant="secondary" onPress={toList} />} />
          ) : (
            <>
              <Card title={t("mentoring.whoToAsk")}>
                <View accessibilityRole="radiogroup" accessibilityLabel={t("mentoring.whoToAsk")} style={{ gap: th.space[2] }}>
                  {d.askable.map((expert) => (
                    <Choice
                      key={expert.id}
                      title={expert.name}
                      caption={expert.headline}
                      tags={expert.specialisms}
                      verified={expert.verified}
                      selected={chosen === expert.id}
                      onPress={() => {
                        setSent(false);
                        setError(null);
                        setChosen(chosen === expert.id ? null : expert.id);
                      }}
                    />
                  ))}
                </View>
              </Card>
              {chosen ? (
                <Card>
                  <Field
                    label={t("mentoring.helpWithWhat")}
                    hint={t("mentoring.helpHint")}
                    value={why}
                    onChangeText={(next) => {
                      setWhy(next);
                      setError(null);
                    }}
                    multiline
                    maxLength={1000}
                    error={error}
                    style={{ minHeight: th.tap * 2, textAlignVertical: "top", paddingTop: th.space[3] }}
                  />
                  <Button label={t("mentoring.askYourSchool")} busy={ask.isPending} disabled={!ready} onPress={() => ask.mutate({ expertProfileId: chosen, purpose: why.trim() })} />
                </Card>
              ) : null}
            </>
          )}
        </>
      ) : null}
    </Screen>
  );
}

/* ------------------------------------------------------------------------- */
/* The school: deciding requests, pairing                                    */
/* ------------------------------------------------------------------------- */

/**
 * Staff: the office and the head decide the pupils' asks (the web's
 * RequestQueue) — a teacher does not, because a pupil asking an outside
 * adult into their life is a school-level decision; the office and a teacher
 * pair (the web's PairForm) — the head does not, as on the web.
 */
function StaffSetUp({ role }: { role: "ADMIN" | "TEACHER" | "PRINCIPAL" }) {
  const t = useT();
  const pairs = role === "ADMIN" || role === "TEACHER";
  const reviews = role === "ADMIN" || role === "PRINCIPAL";
  const options = useOptions(pairs);
  const page = useQuery({
    queryKey: ["shared", "mentoring"],
    enabled: reviews,
    queryFn: async () => mentoringPageSchema.parse(unwrap(await api().get("/api/v1/shared/mentoring"))),
  });
  // A disabled query stays "pending" for ever: only the ones this role asks count.
  const loading = (pairs && options.isPending) || (reviews && page.isPending);
  const failed = (pairs && options.isError ? options.error : null) ?? (reviews && page.isError ? page.error : null);
  const refetch = () => {
    if (pairs) void options.refetch();
    if (reviews) void page.refetch();
  };
  return (
    <Screen title={t("mentoring.setUp")} description={pairs ? t("mentoring.guardianFirst") : t("mentoring.decisionFirst")} refreshing={options.isRefetching || page.isRefetching} onRefresh={refetch}>
      {loading ? <Loading /> : null}
      {failed ? <Failed message={failed.message} onRetry={refetch} /> : null}
      {!loading && !failed ? (
        <>
          {reviews && page.data ? <RequestQueue requests={page.data.requests} showEmpty={!pairs} /> : null}
          {pairs && options.data ? <PairForm pairing={options.data.pairing} /> : null}
        </>
      ) : null}
    </Screen>
  );
}

/**
 * The web's RequestQueue. Both answers are real answers: agreeing asks the
 * family; declining asks for a reason the pupil reads (the web's prompt,
 * here a box that opens under the request, with a cancel).
 */
function RequestQueue({ requests, showEmpty }: { requests: Request[]; showEmpty: boolean }) {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const toList = useToList();
  const { locale } = useLocale();
  const [declining, setDeclining] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const decide = useMutation({
    mutationFn: async (v: { threadId: string; approve: boolean; reason?: string }) => {
      const result = await api().post(`/api/v1/community/mentoring/${v.threadId}/decide`, v.approve ? { approve: true } : { approve: false, ...(v.reason ? { reason: v.reason } : {}) });
      if (!result.ok) throw new Error(errorText(result, t("mentoring.didNotWork")));
      return okSchema.parse(result.data);
    },
    onSuccess: (_data, v) => {
      setDeclining(null);
      setReason("");
      setError(null);
      toast.show(v.approve ? t("mentoring.sentToFamily") : t("mentoring.pupilTold"));
      void qc.invalidateQueries({ queryKey: ["shared", "mentoring"] });
      void qc.invalidateQueries({ queryKey: ["community", "mentoring"] });
    },
    onError: (e) => {
      setError(e.message);
      toast.show(e.message, "danger");
    },
  });
  if (requests.length === 0) {
    return showEmpty ? <Empty icon="handshake" title={t("mentoring.noRequests")} body={t("mentoring.decisionFirst")} action={<Button label={t("mentoring.all")} variant="secondary" onPress={toList} />} /> : null;
  }
  return (
    <Card title={requests.length === 1 ? t("mentoring.askingOne") : t("mentoring.askingMany", { count: requests.length })}>
      <Text variant="xs" tone="muted">
        {t("mentoring.decisionFirst")}
      </Text>
      {error ? <Failed message={error} /> : null}
      {requests.map((r) => {
        const mine = decide.isPending && decide.variables?.threadId === r.threadId;
        return (
          <View key={r.threadId} style={{ gap: th.space[2], paddingTop: th.space[3], borderTopWidth: 1, borderTopColor: th.border }}>
            <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: th.space[2] }}>
              <Text variant="base" bold>
                {`${r.studentName} → ${r.expertName}`}
              </Text>
              {r.expertVerified ? <Pill tone="ok" label={t("mentoring.checked")} /> : null}
            </View>
            <Text variant="xs" tone="muted">
              {[r.expertHeadline, t("mentoring.askedAgo", { when: relativeTime(r.askedAt, locale) })].filter(Boolean).join(" · ")}
            </Text>
            <Text variant="sm">{`“${r.purpose}”`}</Text>
            {declining === r.threadId ? (
              <>
                <Field label={t("mentoring.whyNotPrompt", { name: r.studentName })} value={reason} onChangeText={setReason} multiline maxLength={1000} style={{ minHeight: th.tap * 2, textAlignVertical: "top", paddingTop: th.space[3] }} />
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
                  <Button label={t("mentoring.noTellWhy")} variant="danger" busy={mine} accessibilityLabel={`${t("mentoring.noTellWhy")}: ${r.studentName}`} onPress={() => decide.mutate({ threadId: r.threadId, approve: false, reason: reason.trim() })} />
                  <Button
                    label={t("common.cancel")}
                    variant="ghost"
                    onPress={() => {
                      setDeclining(null);
                      setReason("");
                    }}
                  />
                </View>
              </>
            ) : (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
                <Button label={t("mentoring.agreeAsk")} busy={mine} disabled={decide.isPending} accessibilityLabel={`${t("mentoring.agreeAsk")}: ${r.studentName}`} onPress={() => decide.mutate({ threadId: r.threadId, approve: true })} />
                <Button
                  label={t("mentoring.noTellWhy")}
                  variant="secondary"
                  disabled={decide.isPending}
                  onPress={() => {
                    setError(null);
                    setReason("");
                    setDeclining(r.threadId);
                  }}
                />
              </View>
            )}
          </View>
        );
      })}
    </Card>
  );
}

/**
 * The web's PairForm. It says what happens next before the button is
 * pressed — a guardian is asked, nobody writes until they agree — and on
 * success opens the thread it made, which is where that wait is shown.
 */
function PairForm({ pairing }: { pairing: Pairing }) {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const router = useRouter();
  const toast = useToast();
  const toList = useToList();
  const [pupilId, setPupilId] = useState("");
  const [expertId, setExpertId] = useState("");
  const [purpose, setPurpose] = useState("");
  const [find, setFind] = useState("");
  const [error, setError] = useState<string | null>(null);
  const pair = useMutation({
    mutationFn: async (body: { expertProfileId: string; studentMembershipId: string; purpose: string }) => {
      const result = await api().post("/api/v1/community/mentoring/pair", body);
      if (!result.ok) throw new Error(errorText(result, t("mentoring.couldNotSetUp")));
      return communityMentorThreadSchema.parse(result.data);
    },
    onSuccess: ({ threadId }) => {
      setPupilId("");
      setExpertId("");
      setPurpose("");
      setError(null);
      toast.show(t("mentoring.sentToFamily"));
      void qc.invalidateQueries({ queryKey: ["shared", "mentoring"] });
      void qc.invalidateQueries({ queryKey: ["community", "mentoring"] });
      router.push({ pathname: "/(app)/mentoring/thread", params: { threadId } } as never);
    },
    onError: (e) => {
      setError(e.message);
      toast.show(e.message, "danger");
    },
  });
  if (pairing.experts.length === 0 || pairing.pupils.length === 0) {
    return (
      <Empty
        icon="handshake"
        title={t("mentoring.setUp")}
        body={pairing.experts.length === 0 ? t("mentoring.noExpertsYet") : t("mentoring.noPupils")}
        action={pairing.experts.length === 0 ? <Button label={t("nav.experts")} variant="secondary" onPress={() => router.push("/(app)/experts" as never)} /> : <Button label={t("mentoring.all")} variant="secondary" onPress={toList} />}
      />
    );
  }
  const needle = find.trim().toLowerCase();
  // Once a pupil is chosen the list folds to them; tapping them again opens it.
  const pupils = pupilId ? pairing.pupils.filter((p) => p.id === pupilId) : pairing.pupils.filter((p) => !needle || p.name.toLowerCase().includes(needle)).slice(0, PUPILS_SHOWN);
  const experts = expertId ? pairing.experts.filter((e) => e.id === expertId) : pairing.experts;
  const unverified = pairing.experts.some((e) => e.id === expertId && !e.verified);
  const ready = Boolean(pupilId && expertId) && purpose.trim().length >= PAIR_MIN;
  return (
    <>
      <Card title={t("mentoring.pupil")}>
        {!pupilId && pairing.pupils.length > PUPILS_SHOWN ? <Field label={t("common.searchLabel")} placeholder={t("mentoring.choosePupil")} value={find} onChangeText={setFind} autoCapitalize="none" returnKeyType="search" /> : null}
        <View accessibilityRole="radiogroup" accessibilityLabel={t("mentoring.choosePupil")} style={{ gap: th.space[2] }}>
          {pupils.length === 0 ? (
            <Text variant="sm" tone="muted">
              {t("common.noResultsTitle")}
            </Text>
          ) : (
            pupils.map((p) => <Choice key={p.id} title={p.name} selected={pupilId === p.id} onPress={() => setPupilId(pupilId === p.id ? "" : p.id)} />)
          )}
        </View>
      </Card>
      <Card title={t("mentoring.mentor")}>
        <View accessibilityRole="radiogroup" accessibilityLabel={t("mentoring.chooseMentor")} style={{ gap: th.space[2] }}>
          {experts.map((e) => (
            <Choice key={e.id} title={e.name} caption={e.headline} verified={e.verified} selected={expertId === e.id} onPress={() => setExpertId(expertId === e.id ? "" : e.id)} />
          ))}
        </View>
        {unverified ? (
          <Note tone="warn">
            <Text variant="xs">{t("mentoring.notVerified")}</Text>
          </Note>
        ) : null}
      </Card>
      <Card title={t("mentoring.setUp")}>
        <Field label={t("mentoring.forWhat")} placeholder={t("mentoring.purposePlaceholder")} hint={t("mentoring.guardianSees")} value={purpose} onChangeText={setPurpose} maxLength={1000} />
        {error ? <Failed message={error} /> : null}
        <Button label={t("mentoring.askTheGuardian")} busy={pair.isPending} disabled={!ready} onPress={() => pair.mutate({ expertProfileId: expertId, studentMembershipId: pupilId, purpose: purpose.trim() })} />
      </Card>
    </>
  );
}
