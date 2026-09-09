import { useRef, useState } from "react";
import { TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { enquiryOpenedSchema, enquiryReplyBodySchema, enquiryThreadSchema } from "@edulink/contracts";
import { Button, Empty, Failed, Field, Loading, Screen, Text } from "@/components";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { openWeb } from "../staff/shared";
import { param, Pill, relativeTime } from "../family/shared";

/**
 * One enquiry, the web's /enquiries/[enquiryId], read from whichever side
 * this session stands on: the messages oldest first, a reply box while it
 * is open, and — on the school's side — closing it, which is the web's
 * confirm-and-close and opens there.
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
              {data.side === "school" ? <Button label={t("enquiries.closeCta")} variant="ghost" onPress={() => openWeb(`/enquiries/${enquiryId}`)} /> : null}
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
