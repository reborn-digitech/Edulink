import { useRef, useState } from "react";
import { usePrivateScreen } from "@/lib/private-screen";
import { TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { inboxThreadDetailSchema, inboxThreadReplyBodySchema, inboxThreadReplyResultSchema } from "@edulink/contracts";
import { Button, Empty, Failed, Field, Loading, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { whenLabel } from "./support";

/**
 * A remark thread, the web's /remarks/[threadId], for every role: one
 * pupil, their teacher, their guardians and the office, oldest message first,
 * and a reply box unless the thread is closed.
 */
export function Thread() {
  // A child's record, a register, a message: private while on screen (no screenshots or screen recording on the phone).
  usePrivateScreen();
  const { threadId } = useLocalSearchParams<{ threadId?: string }>();
  const t = useT();
  const { locale } = useLocale();
  const th = useTheme();
  const qc = useQueryClient();
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const replyBox = useRef<TextInput>(null);

  const query = useQuery({
    queryKey: ["shared", "threads", threadId],
    queryFn: async () => inboxThreadDetailSchema.parse(unwrap(await api().get(`/api/v1/shared/threads/${threadId}`))),
    enabled: Boolean(threadId),
  });
  const reply = useMutation({
    mutationFn: async (body: { body: string }) => inboxThreadReplyResultSchema.parse(unwrap(await api().post(`/api/v1/shared/threads/${threadId}/reply`, body))),
    onSuccess: () => {
      setDraft("");
      setSent(true);
      void qc.invalidateQueries({ queryKey: ["shared", "threads", threadId] });
      void qc.invalidateQueries({ queryKey: ["shared", "inbox"] });
    },
  });

  const submit = () => {
    setSent(false);
    const parsed = inboxThreadReplyBodySchema.safeParse({ body: draft });
    if (!parsed.success) {
      setFormError(t("remarks.writeSomethingFirst"));
      return;
    }
    setFormError(null);
    reply.mutate(parsed.data);
  };

  const data = query.data;
  if (!threadId) {
    return (
      <Screen title={t("remarks.title")}>
        <Failed message={t("convo.errorInvalid")} />
      </Screen>
    );
  }
  return (
    <Screen title={data?.subject ?? t("remarks.title")} description={data ? t("remarks.onlyVisibleTo", { student: data.student.name, teacher: data.teacher.name }) : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed error={query.error} onRetry={() => void query.refetch()} /> : null}
      {data ? (
        <>
          {data.messages.length === 0 ? (
            <Empty
              title={t("remarks.noMessagesYet")}
              action={
                data.closedAt ? (
                  <Button label={t("nav.messages")} variant="secondary" onPress={() => router.push("/(app)/messages" as never)} />
                ) : (
                  <Button label={t("mobile.writeFirstMessage")} variant="secondary" onPress={() => replyBox.current?.focus()} />
                )
              }
            />
          ) : (
            <View style={{ gap: th.space[2] }}>
              {data.messages.map((m) => (
                <View
                  key={m.id}
                  accessible
                  accessibilityLabel={`${m.mine ? t("convo.you") : m.authorName}: ${m.body}`}
                  style={{ alignSelf: m.mine ? "flex-end" : "flex-start", maxWidth: "88%", backgroundColor: m.mine ? th.accentSoft : th.surface, borderWidth: 1, borderColor: m.mine ? th.accentRing : th.border, borderRadius: th.radius.lg, padding: th.space[3], gap: 2 }}
                >
                  <Text variant="xs" bold tone={m.mine ? "accent" : "muted"}>
                    {m.mine ? t("convo.you") : m.authorName}
                  </Text>
                  <Text variant="base">{m.body}</Text>
                  <Text variant="xs" tone="subtle">
                    {whenLabel(m.createdAt, locale)}
                    {m.mine ? ` · ${m.readByOthers ? t("convo.readMark") : t("convo.sentMark")}` : ""}
                  </Text>
                </View>
              ))}
            </View>
          )}
          {data.closedAt ? (
            <Text variant="sm" tone="muted" accessibilityLiveRegion="polite">
              {t("remarks.closed")}
            </Text>
          ) : (
            <>
              <Field ref={replyBox} label={t("remarks.writeReply")} placeholder={t("remarks.writeReplyPlaceholder")} value={draft} onChangeText={setDraft} multiline error={formError} style={{ minHeight: 96, textAlignVertical: "top", paddingTop: th.space[3] }} />
              {reply.isError ? <Failed message={`${t("remarks.couldNotSend")}: ${reply.error.message}`} onRetry={submit} /> : null}
              {sent ? (
                <Text variant="sm" tone="ok" accessibilityLiveRegion="polite">
                  {t("remarks.sent")}
                </Text>
              ) : null}
              <Button label={t("common.send")} onPress={submit} busy={reply.isPending} />
            </>
          )}
        </>
      ) : null}
    </Screen>
  );
}
