import { useRef, useState } from "react";
import { TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mentoringMessageBodySchema, mentoringThreadDetailSchema, okSchema } from "@edulink/contracts";
import { Button, Empty, Failed, Field, Loading, Screen, Text, useToast } from "@/components";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Note, param, Pill, relativeTime } from "../family/shared";

/**
 * One mentorship, the web's /mentoring/[threadId]: the pupil and the expert
 * writing to each other, read by the guardians and the school — said to
 * every reader before the first message. Who may write arrives as a flag
 * from the server. So are the guardian's consent (only then may anybody
 * write) and ending it — the school's or a guardian's — after a confirm.
 */
export function MentoringThread() {
  const params = useLocalSearchParams<{ threadId?: string }>();
  const threadId = param(params.threadId);
  const t = useT();
  const { locale } = useLocale();
  const th = useTheme();
  const qc = useQueryClient();
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const toast = useToast();
  const box = useRef<TextInput>(null);

  const query = useQuery({
    queryKey: ["shared", "mentoring", threadId],
    queryFn: async () => mentoringThreadDetailSchema.parse(unwrap(await api().get(`/api/v1/shared/mentoring/${threadId}`))),
    enabled: Boolean(threadId),
  });
  const send = useMutation({
    mutationFn: async (body: { body: string }) => {
      const result = await api().post(`/api/v1/shared/mentoring/${threadId}/messages`, body);
      if (!result.ok) throw new Error(errorText(result, t("expert.couldNotSend")));
      return okSchema.parse(result.data);
    },
    onSuccess: () => {
      setDraft("");
      setSent(true);
      void qc.invalidateQueries({ queryKey: ["shared", "mentoring"] });
    },
  });
  /** The web's consent and close: a guardian's yes, or the school or a guardian ending it. */
  const act = useMutation({
    mutationFn: async (what: "consent" | "close") => {
      const result = what === "consent" ? await api().post(`/api/v1/community/mentoring/${threadId}/consent`) : await api().post(`/api/v1/community/mentoring/${threadId}/close`);
      if (!result.ok) throw new Error(errorText(result, t("mentoring.couldNotDo")));
      return okSchema.parse(result.data);
    },
    onSuccess: (_data, what) => {
      setConfirming(false);
      toast.show(what === "consent" ? t("mentoring.agreedToast") : t("mentoring.ended"));
      void qc.invalidateQueries({ queryKey: ["shared", "mentoring"] });
      void qc.invalidateQueries({ queryKey: ["community", "mentoring"] });
    },
    onError: (e) => toast.show(e.message, "danger"),
  });

  const submit = () => {
    setSent(false);
    const parsed = mentoringMessageBodySchema.safeParse({ body: draft });
    if (!parsed.success) {
      setFormError(t("remarks.writeSomethingFirst"));
      return;
    }
    setFormError(null);
    send.mutate(parsed.data);
  };

  const data = query.data;
  if (!threadId) {
    return (
      <Screen title={t("feature.mentoring")}>
        <Failed message={t("convo.errorInvalid")} />
      </Screen>
    );
  }
  const canClose = Boolean(data && (data.isGuardian || data.isStaff));
  /** Ending is for good: said first, then a red button beside a cancel. */
  const endConfirm = (
    <Note tone="danger">
      <Text variant="sm" bold>
        {t("mentoring.endConfirm")}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
        <Button label={t("mentoring.endThis")} variant="danger" busy={act.isPending && act.variables === "close"} onPress={() => act.mutate("close")} />
        <Button label={t("common.cancel")} variant="ghost" onPress={() => setConfirming(false)} />
      </View>
    </Note>
  );
  return (
    <Screen title={data ? `${data.studentName} & ${data.expertName}` : t("feature.mentoring")} description={data?.purpose} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {data ? (
        <>
          <Note tone="accent">
            <Text variant="xs" tone="muted">
              {t("mentoring.notPrivateNote", { name: data.studentName, school: data.schoolName })}
            </Text>
          </Note>
          {data.awaitingConsent ? <Pill tone="warn" label={t("mentoring.awaitingGuardian")} /> : null}
          {data.status === "CLOSED" ? <Pill label={t("mentoring.ended")} /> : null}
          {data.isGuardian && data.awaitingConsent ? (
            <Note tone="warn">
              <Text variant="sm" bold>
                {t("mentoring.doYouAgree")}
              </Text>
              <Text variant="xs" tone="muted">
                {t("mentoring.canReadAndEnd")}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
                <Button label={t("mentoring.yesGoAhead")} busy={act.isPending && act.variables === "consent"} disabled={act.isPending} onPress={() => act.mutate("consent")} />
                {confirming ? null : <Button label={t("mentoring.noEndIt")} variant="ghost" disabled={act.isPending} onPress={() => setConfirming(true)} />}
              </View>
              {confirming ? endConfirm : null}
            </Note>
          ) : null}
          {data.messages.length === 0 ? (
            <Empty
              title={t("expert.noMessages")}
              action={
                data.canPost ? (
                  <Button label={t("mobile.writeFirstMessage")} variant="secondary" onPress={() => box.current?.focus()} />
                ) : (
                  <Button label={t("mentoring.all")} variant="secondary" onPress={() => router.push("/(app)/mentoring" as never)} />
                )
              }
            />
          ) : (
            <View style={{ gap: th.space[2] }}>
              {data.messages.map((m) => (
                <View
                  key={m.id}
                  accessible
                  accessibilityLabel={`${m.mine ? t("common.you") : m.authorName}: ${m.body}`}
                  style={{ alignSelf: m.mine ? "flex-end" : "flex-start", maxWidth: "88%", backgroundColor: m.mine ? th.accentSoft : th.surface, borderWidth: 1, borderColor: m.mine ? th.accentRing : th.border, borderRadius: th.radius.lg, padding: th.space[3], gap: 2 }}
                >
                  <Text variant="xs" bold tone={m.mine ? "accent" : "muted"}>
                    {m.mine ? t("common.you") : m.authorName}
                  </Text>
                  <Text variant="base">{m.body}</Text>
                  <Text variant="xs" tone="subtle">
                    {relativeTime(m.createdAt, locale)}
                  </Text>
                </View>
              ))}
            </View>
          )}
          {data.canPost ? (
            <>
              <Field ref={box} label={t("expert.writeMessage")} placeholder={t("expert.writeMessage")} value={draft} onChangeText={setDraft} multiline error={formError} style={{ minHeight: th.tap * 2, textAlignVertical: "top", paddingTop: th.space[3] }} />
              {send.isError ? <Failed message={send.error.message} onRetry={submit} /> : null}
              {sent ? (
                <Text variant="sm" tone="ok" accessibilityLiveRegion="polite">
                  {t("remarks.sent")}
                </Text>
              ) : null}
              <Button label={t("expert.send")} onPress={submit} busy={send.isPending} />
            </>
          ) : null}
          {act.isError ? <Failed message={act.error.message} /> : null}
          {canClose && !data.awaitingConsent && data.status !== "CLOSED" ? confirming ? endConfirm : <Button label={t("mentoring.endThis")} variant="ghost" onPress={() => setConfirming(true)} /> : null}
        </>
      ) : null}
    </Screen>
  );
}
