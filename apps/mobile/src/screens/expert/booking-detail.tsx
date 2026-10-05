import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import { accountBookingSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Icon, Loading, Screen, Text, useToast } from "@/components";
import { Avatar } from "@/components/avatar";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useRole } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { Confirm, formatInstant, Note, param, Pill, relativeTime } from "../family/shared";

type Message = z.infer<typeof accountBookingSchema>["messages"][number];

/**
 * One expert booking — the web's /experts/bookings/[id], for the expert and
 * for the booking school's staff alike: what it is about, when (in UTC, as
 * the web shows it), the conversation between the two sides and a line to
 * add to it, and — while it has not begun — cancelling it, asked about first
 * because the hour goes back to every other school.
 */
export function BookingDetail() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const role = useRole();
  const qc = useQueryClient();
  const toast = useToast();
  const { locale } = useLocale();
  const params = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  const bookingId = param(params.bookingId);
  // One name for the path segment, so every call below reads /bookings/${id}.
  const id = encodeURIComponent(bookingId ?? "");
  const query = useQuery({
    queryKey: ["account", "booking", bookingId],
    enabled: Boolean(bookingId),
    queryFn: async () => accountBookingSchema.parse(unwrap(await api().get(`/api/v1/account/bookings/${id}`))),
  });
  const d = query.data;
  const [draft, setDraft] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const invalidate = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ["account", "booking", bookingId] }),
      qc.invalidateQueries({ queryKey: ["expert", "bookings"] }),
      qc.invalidateQueries({ queryKey: ["staff", "experts"] }),
    ]);
  const send = useMutation({
    mutationFn: async (body: string) => {
      const result = await api().post(`/api/v1/account/bookings/${id}/messages`, { body });
      if (!result.ok) throw new Error(result.issues?.body ?? errorText(result, t("expert.couldNotSend")));
    },
    onSuccess: () => {
      setDraft("");
      toast.show(t("remarks.messageSent"));
      void invalidate();
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const cancel = useMutation({
    mutationFn: async () => {
      const result = await api().post(`/api/v1/account/bookings/${id}/cancel`);
      if (!result.ok) throw new Error(errorText(result, t("bulletin.couldNotDo")));
    },
    onSuccess: () => {
      setCancelling(false);
      toast.show(t("expert.bookingCancelled"));
      void invalidate();
    },
    onError: (e) => {
      setCancelling(false);
      toast.show(e.message, "danger");
    },
  });
  const home = role === "EXPERT" ? "/(app)" : "/(app)/experts";
  if (!bookingId) {
    return (
      <Screen title={t("meta.booking")}>
        <Empty title={t("access.bookingNotFound")} action={<Button label={t("expert.bookings")} variant="secondary" onPress={() => router.push(home as never)} />} />
      </Screen>
    );
  }
  const when = (iso: string) => formatInstant(iso, locale, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }, "UTC");
  const until = (iso: string) => formatInstant(iso, locale, { hour: "numeric", minute: "2-digit" }, "UTC");
  const cancelled = d?.status === "CANCELLED";
  return (
    <Screen title={d?.topic ?? t("meta.booking")} description={d ? `${d.viewerIsExpert ? d.schoolName : d.expertName} · ${when(d.startsAt)}` : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed error={query.error} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          {cancelled ? <Pill tone="danger" label={t("expert.bookingCancelled")} /> : null}
          <Text variant="sm" tone="muted">
            {`${when(d.startsAt)} – ${until(d.endsAt)}`}
          </Text>
          <Text variant="xs" tone="subtle">
            {t("expert.timesInUtc")}
          </Text>
          {d.note ? (
            <Note tone="accent">
              <Text variant="sm">{d.note}</Text>
            </Note>
          ) : null}
          <Card title={t("nav.messages")}>
            {d.messages.length === 0 ? (
              <Text variant="sm" tone="muted">
                {t("expert.noMessages")}
              </Text>
            ) : (
              d.messages.map((m) => <MessageRow key={m.id} message={m} locale={locale} />)
            )}
            {cancelled ? null : (
              <>
                <Field label={t("expert.writeMessage")} value={draft} onChangeText={setDraft} multiline maxLength={5000} style={{ minHeight: th.space[12] * 2, textAlignVertical: "top", paddingTop: th.space[3] }} />
                <Button label={t("common.send")} icon={<Icon name="paperPlane" size={18} color={th.accentFg} weight="bold" />} busy={send.isPending} disabled={!draft.trim()} onPress={() => send.mutate(draft.trim())} />
              </>
            )}
          </Card>
          {d.canCancel ? (
            cancelling ? (
              <Confirm question={t("expert.cancelWarning")} confirmLabel={t("expert.confirmCancel")} cancelLabel={t("expert.keepBooking")} busy={cancel.isPending} onConfirm={() => cancel.mutate()} onCancel={() => setCancelling(false)} />
            ) : (
              <Button label={t("expert.cancelBooking")} variant="danger" onPress={() => setCancelling(true)} />
            )
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

/** One message: who, when, what — mine on the right, in the accent. */
function MessageRow({ message, locale }: { message: Message; locale: string }) {
  const t = useT();
  const th = useTheme();
  return (
    <View style={{ flexDirection: message.mine ? "row-reverse" : "row", alignItems: "flex-start", gap: th.space[2] }}>
      <Avatar avatarKey={message.authorAvatar} name={message.authorName} size={32} />
      <View style={{ flex: 1, gap: 2, padding: th.space[3], borderRadius: th.radius.md, backgroundColor: message.mine ? th.accentSoft : th.surfaceMuted }}>
        <Text variant="xs" tone="muted">
          {`${message.mine ? t("common.you") : message.authorName} · ${relativeTime(message.createdAt, locale)}`}
        </Text>
        <Text variant="sm">{message.body}</Text>
      </View>
    </View>
  );
}
