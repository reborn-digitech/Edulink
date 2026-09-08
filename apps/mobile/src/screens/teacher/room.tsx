import { useRef, useState } from "react";
import { TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { conversationMessageSchema, inboxConversationDetailSchema } from "@edulink/contracts";
import { Button, Empty, Failed, Field, Loading, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { newClientId } from "@/lib/outbox";
import { OutboxBadge, throwIfRefused, useOutboxRunner, whenLabel, writeOrQueue } from "./support";

/**
 * A room, the web's /remarks/c/[conversationId], for every role: the
 * messages oldest first and a reply box. A message carries a clientId minted
 * here, so one written offline is queued and replayed without a twin.
 */
export function Room() {
  const { conversationId } = useLocalSearchParams<{ conversationId?: string }>();
  const t = useT();
  const { locale } = useLocale();
  const th = useTheme();
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const replyBox = useRef<TextInput>(null);
  useOutboxRunner();

  const query = useQuery({
    queryKey: ["shared", "conversations", conversationId],
    queryFn: async () => inboxConversationDetailSchema.parse(unwrap(await api().get(`/api/v1/shared/conversations/${conversationId}`))),
    enabled: Boolean(conversationId),
  });
  const tag = `messages:${conversationId}`;
  const send = useMutation({
    mutationFn: async (body: { conversationId: string; body: string; clientId: string }) =>
      throwIfRefused(await writeOrQueue(await api().post("/api/v1/messages", body), { url: "/api/v1/messages", body, tag })),
    onSuccess: (outcome) => {
      setDraft("");
      setNote(outcome.kind === "sent" ? t("remarks.sent") : t("common.queuedOffline"));
      void qc.invalidateQueries({ queryKey: ["shared", "conversations", conversationId] });
      void qc.invalidateQueries({ queryKey: ["shared", "inbox"] });
    },
  });

  const submit = () => {
    setNote(null);
    const parsed = conversationMessageSchema.safeParse({ conversationId, body: draft, clientId: newClientId() });
    if (!parsed.success) {
      setFormError(t("remarks.writeSomethingFirst"));
      return;
    }
    setFormError(null);
    send.mutate(parsed.data);
  };

  const data = query.data;
  const names = data?.others.map((o) => o.name).join(", ") ?? "";
  if (!conversationId) {
    return (
      <Screen title={t("convo.message")}>
        <Failed message={t("convo.errorInvalid")} />
      </Screen>
    );
  }
  return (
    <Screen title={names || t("convo.message")} description={data ? t("convo.onlyYouAnd", { names }) : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {data ? (
        <>
          {data.messages.length === 0 ? (
            <Empty title={t("convo.noMessagesInRoom")} body={t("convo.sayHello", { name: names })} action={<Button label={t("mobile.writeFirstMessage")} variant="secondary" onPress={() => replyBox.current?.focus()} />} />
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
          <OutboxBadge tag={tag} />
          <Field ref={replyBox} label={t("remarks.writeReply")} placeholder={t("remarks.writeReplyPlaceholder")} value={draft} onChangeText={setDraft} multiline error={formError} style={{ minHeight: 96, textAlignVertical: "top", paddingTop: th.space[3] }} />
          {send.isError ? <Failed message={`${t("remarks.couldNotSend")}: ${send.error.message}`} onRetry={submit} /> : null}
          {note ? (
            <Text variant="sm" tone="ok" accessibilityLiveRegion="polite">
              {note}
            </Text>
          ) : null}
          <Button label={t("common.send")} onPress={submit} busy={send.isPending} />
        </>
      ) : null}
    </Screen>
  );
}
