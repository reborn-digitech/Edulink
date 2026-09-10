import { useRef, useState } from "react";
import { TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { enquiryOpenedSchema, enquiryReplyBodySchema, enquiryThreadSchema, okSchema } from "@edulink/contracts";
import { Button, Empty, Failed, Field, Loading, Screen, Text, useToast } from "@/components";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { param, Pill, relativeTime } from "../family/shared";

/**
 * One enquiry, the web's /enquiries/[enquiryId], read from whichever side
 * this session stands on: the messages oldest first, a reply box while it
 * is open, and — on the school's side — closing it, after a confirm: nobody
 * can reply after.
 */
export function EnquiryDetail() {
  const params = useLocalSearchParams<{ enquiryId?: string }>();
  const enquiryId = param(params.enquiryId);
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
    queryKey: ["shared", "enquiries", enquiryId],
    queryFn: async () => enquiryThreadSchema.parse(unwrap(await api().get(`/api/v1/shared/enquiries/${enquiryId}`))),
    enabled: Boolean(enquiryId),
  });
  const reply = useMutation({
    mutationFn: async (body: { body: string }) => {
      const result = await api().post(`/api/v1/shared/enquiries/${enquiryId}/reply`, body);
      if (!result.ok) throw new Error(errorText(result, t("common.somethingWrong")));
      return enquiryOpenedSchema.parse(result.data);
    },
    onSuccess: () => {
      setDraft("");
      setSent(true);
      void qc.invalidateQueries({ queryKey: ["shared", "enquiries"] });
    },
  });
  const close = useMutation({
    mutationFn: async () => {
      const result = await api().post(`/api/v1/community/enquiries/${enquiryId}/close`);
      if (!result.ok) throw new Error(errorText(result, t("common.somethingWrong")));
      return okSchema.parse(result.data);
    },
    onSuccess: () => {
      setConfirming(false);
      toast.show(t("enquiries.closedToast"));
      void qc.invalidateQueries({ queryKey: ["shared", "enquiries"] });
    },
    onError: (e) => toast.show(e.message, "danger"),
  });

  const submit = () => {
    setSent(false);
    const parsed = enquiryReplyBodySchema.safeParse({ body: draft });
    if (!parsed.success) {
      setFormError(t("remarks.writeSomethingFirst"));
      return;
    }
    setFormError(null);
    reply.mutate(parsed.data);
  };

  const data = query.data;
  if (!enquiryId) {
    return (
      <Screen title={t("enquiries.title")}>
        <Failed message={t("convo.errorInvalid")} />
      </Screen>
    );
  }
  const title = data ? (data.subject ? t("enquiries.threadTitleVacancy", { subject: data.subject, school: data.schoolName }) : t("enquiries.threadTitleAdmission", { school: data.schoolName })) : t("enquiries.title");
  const isOpen = data?.status === "OPEN";
  return (
    <Screen title={title} description={data?.side === "school" ? data.fromName : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {data ? (
        <>
          <Pill tone={isOpen ? "ok" : "muted"} label={isOpen ? t("enquiries.openBadge") : t("enquiries.closedBadge")} />
          {data.messages.length === 0 ? (
            <Empty
              title={t("remarks.noMessagesYet")}
              action={
                isOpen ? (
                  <Button label={t("mobile.writeFirstMessage")} variant="secondary" onPress={() => box.current?.focus()} />
                ) : (
                  <Button label={t("enquiries.title")} variant="secondary" onPress={() => router.push("/(app)/enquiries" as never)} />
                )
              }
            />
          ) : (
            <View style={{ gap: th.space[2] }}>
              {data.messages.map((m) => (
                <View
                  key={m.id}
                  accessible
                  accessibilityLabel={`${m.mine ? t("enquiries.sentByYou") : m.authorName}: ${m.body}`}
                  style={{ alignSelf: m.mine ? "flex-end" : "flex-start", maxWidth: "88%", backgroundColor: m.mine ? th.accentSoft : th.surface, borderWidth: 1, borderColor: m.mine ? th.accentRing : th.border, borderRadius: th.radius.lg, padding: th.space[3], gap: 2 }}
                >
                  <Text variant="xs" bold tone={m.mine ? "accent" : "muted"}>
                    {m.mine ? t("enquiries.sentByYou") : m.authorName}
                  </Text>
                  <Text variant="base">{m.body}</Text>
                  <Text variant="xs" tone="subtle">
                    {relativeTime(m.createdAt, locale)}
                  </Text>
                </View>
              ))}
            </View>
          )}
          {isOpen ? (
            <>
              <Field ref={box} label={t("remarks.writeReply")} placeholder={t("enquiries.replyPlaceholder")} value={draft} onChangeText={setDraft} multiline error={formError} style={{ minHeight: th.tap * 2, textAlignVertical: "top", paddingTop: th.space[3] }} />
              {reply.isError ? <Failed message={reply.error.message} onRetry={submit} /> : null}
              {sent ? (
                <Text variant="sm" tone="ok" accessibilityLiveRegion="polite">
                  {t("remarks.sent")}
                </Text>
              ) : null}
              <Button label={t("enquiries.replyCta")} onPress={submit} busy={reply.isPending} />
              {close.isError ? <Failed message={close.error.message} /> : null}
              {data.side === "school" ? (
                confirming ? (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
                    <Button label={t("enquiries.closeCta")} variant="danger" busy={close.isPending} onPress={() => close.mutate()} />
                    <Button label={t("common.cancel")} variant="ghost" onPress={() => setConfirming(false)} />
                  </View>
                ) : (
                  <Button label={t("enquiries.closeCta")} variant="ghost" onPress={() => setConfirming(true)} />
                )
              ) : null}
            </>
          ) : (
            <Text variant="sm" tone="muted" accessibilityLiveRegion="polite">
              {t("enquiries.closedNote")}
            </Text>
          )}
        </>
      ) : null}
    </Screen>
  );
}
