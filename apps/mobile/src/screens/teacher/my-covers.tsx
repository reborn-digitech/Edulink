import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { coverAnsweredSchema, myCoversSchema, type MyCover } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Screen, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Pill } from "../family/shared";
import { addDaysToKey, formatDateKey } from "../staff/shared";
import { periodLine } from "../staff/substitutions";

/**
 * The lessons I am covering — the web's /staff/substitutions/me for every
 * member of staff: what the office has asked me to take on a day, in period
 * order, with whose lesson it is and the note the office left. One GET; the
 * day arrows ask for another day.
 */
export const MY_COVERS_PATH = "/api/v1/staff/substitutions/me";
export const MY_COVERS_KEY = ["staff", "my-covers"] as const;

/** A lesson I am covering as one block: subject and class, the period and room, whose it is, and the office's note. */
export function CoverItem({ item }: { item: MyCover }) {
  const t = useT();
  const th = useTheme();
  return (
    <View style={{ gap: 2, paddingVertical: th.space[2], borderBottomWidth: 1, borderBottomColor: th.border }}>
      <Text variant="base" bold>
        {`${item.subject} · ${item.className}`}
      </Text>
      <Text variant="sm" tone="muted">
        {[periodLine(t, item), item.room, t("substitutions.coveringFor", { name: item.absentName })].filter(Boolean).join(" · ")}
      </Text>
      {item.note ? (
        <Text variant="xs" tone="muted">
          {`${t("staffAttendance.note")}: ${item.note}`}
        </Text>
      ) : null}
      <CoverAnswer item={item} />
    </View>
  );
}

/**
 * My answer to a cover: "I'll take it" (POST …/acknowledge) or "I can't"
 * with one line of why (POST …/decline), which tells the office and the
 * head. Either can be changed until the office reassigns the lesson; the
 * list rereads after every answer so what it shows is what stands.
 */
export function CoverAnswer({ item }: { item: MyCover }) {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const [tried, setTried] = useState(false);
  const done = () => void qc.invalidateQueries({ queryKey: MY_COVERS_KEY });
  const acknowledge = useMutation({
    mutationFn: async () => coverAnsweredSchema.parse(unwrap(await api().post(`/api/v1/teaching/covers/${item.id}/acknowledge`, {}))),
    onSuccess: () => {
      toast.show(t("covers.acknowledged"), "ok");
      setDeclining(false);
      done();
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const decline = useMutation({
    mutationFn: async () => coverAnsweredSchema.parse(unwrap(await api().post(`/api/v1/teaching/covers/${item.id}/decline`, { reason: reason.trim() }))),
    onSuccess: () => {
      toast.show(t("covers.declinedToast"), "ok");
      setDeclining(false);
      setReason("");
      setTried(false);
      done();
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const taken = Boolean(item.acknowledgedAt && !item.declinedAt);
  const busy = acknowledge.isPending || decline.isPending;
  const sendDecline = () => {
    setTried(true);
    if (!reason.trim()) return;
    decline.mutate();
  };
  return (
    <View style={{ gap: th.space[2], marginTop: th.space[1] }}>
      <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: th.space[2] }}>
        {taken ? <Pill label={t("covers.stateTaken")} tone="ok" /> : null}
        {item.declinedAt ? <Pill label={t("covers.stateDeclined")} tone="danger" /> : null}
        {!taken ? <Button label={t("covers.take")} accessibilityLabel={`${t("covers.take")}: ${item.subject} · ${item.className}`} variant="secondary" busy={acknowledge.isPending} disabled={busy} onPress={() => acknowledge.mutate()} /> : null}
        {!item.declinedAt && !declining ? <Button label={t("covers.cannot")} accessibilityLabel={`${t("covers.cannot")}: ${item.subject} · ${item.className}`} variant="ghost" disabled={busy} onPress={() => setDeclining(true)} /> : null}
      </View>
      {item.declinedAt && item.declineReason && !declining ? (
        <Text variant="xs" tone="muted">
          {t("covers.yourReason", { reason: item.declineReason })}
        </Text>
      ) : null}
      {declining ? (
        <View style={{ gap: th.space[2] }}>
          <Field label={t("covers.reasonLabel")} placeholder={t("covers.reasonPlaceholder")} value={reason} onChangeText={setReason} maxLength={300} error={tried && !reason.trim() ? t("covers.reasonRequired") : null} />
          <View style={{ flexDirection: "row", gap: th.space[2] }}>
            <Button label={t("covers.declineSend")} variant="danger" busy={decline.isPending} onPress={sendDecline} />
            <Button label={t("common.cancel")} variant="ghost" disabled={busy} onPress={() => setDeclining(false)} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

export function MyCovers() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const { locale } = useLocale();
  const [date, setDate] = useState<string | null>(null);
  const query = useQuery({
    queryKey: [...MY_COVERS_KEY, date ?? "today"],
    placeholderData: keepPreviousData,
    queryFn: async () => myCoversSchema.parse(unwrap(await api().get(`${MY_COVERS_PATH}${date ? `?date=${date}` : ""}`))),
  });
  const d = query.data;
  const dayLabel = d ? formatDateKey(d.dateKey, locale, { weekday: "short", day: "numeric", month: "short" }) : "";
  return (
    <Screen title={t("substitutions.myCoversTitle")} description={t("substitutions.myCoversIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {d ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: th.space[2], flexWrap: "wrap" }}>
          <Button label={t("substitutions.previousDay")} variant="secondary" onPress={() => setDate(addDaysToKey(d.dateKey, -1))} />
          <Text variant="base" bold style={{ flex: 1, textAlign: "center" }} accessibilityLabel={t("substitutions.forDay", { date: dayLabel })}>
            {dayLabel}
          </Text>
          <Button label={t("substitutions.nextDay")} variant="secondary" onPress={() => setDate(addDaysToKey(d.dateKey, 1))} />
          {date !== null ? <Button label={t("substitutions.today")} variant="ghost" onPress={() => setDate(null)} /> : null}
        </View>
      ) : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        d.items.length === 0 ? (
          <Empty icon="users" title={t("substitutions.noCovers")} body={t("substitutions.noCoversBody")} action={<Button label={t("teacher.openTimetable")} variant="secondary" onPress={() => router.push("/(app)/timetable" as never)} />} />
        ) : (
          <Card>
            {d.items.map((item) => (
              <CoverItem key={item.id} item={item} />
            ))}
          </Card>
        )
      ) : null}
    </Screen>
  );
}
