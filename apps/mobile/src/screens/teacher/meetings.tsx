import { useRef, useState } from "react";
import { TextInput, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { publishSlotsSchema, slotsPublishedSchema, staffMeetingsSchema, type PublishSlotsBody } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Stat, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Notice } from "../staff/shared";
import { Pill, formatInstant } from "../family/shared";

/**
 * Meetings, the web's /teacher/meetings: offer a run of back-to-back slots,
 * watch families claim them, cancel the ones that can no longer happen —
 * which tells the family, by construction. Times are in the school's zone,
 * because the meeting happens at the school.
 */
export function TeacherMeetings() {
  const t = useT();
  const { locale } = useLocale();
  const th = useTheme();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["staff", "meetings"],
    queryFn: async () => staffMeetingsSchema.parse(unwrap(await api().get("/api/v1/staff/meetings"))),
  });
  const [date, setDate] = useState("");
  const [time, setTime] = useState("15:00");
  const [duration, setDuration] = useState("15");
  const [count, setCount] = useState("6");
  const [location, setLocation] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [note, setNote] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const firstField = useRef<TextInput>(null);
  const offer = useMutation({
    mutationFn: async (body: PublishSlotsBody) => slotsPublishedSchema.parse(unwrap(await api().post("/api/v1/staff/meetings", body))),
    onSuccess: (made) => {
      setDate("");
      setNote(made.created === 1 ? t("meetings.offeredOne") : t("meetings.offeredMany", { count: made.created }));
      void qc.invalidateQueries({ queryKey: ["staff", "meetings"] });
    },
  });
  const cancel = useMutation({
    mutationFn: async (slotId: string) => unwrap(await api().post("/api/v1/staff/meetings/cancel", { slotId })),
    onSuccess: () => {
      setConfirming(null);
      void qc.invalidateQueries({ queryKey: ["staff", "meetings"] });
    },
  });

  const submit = () => {
    setNote(null);
    const parsed = publishSlotsSchema.safeParse({ date: date.trim(), time: time.trim(), durationMinutes: Number(duration), count: Number(count), location: location.trim() || undefined });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0] ?? "");
        next[field] = field === "date" || field === "time" ? t("access.pickAMeetingTime") : t("common.checkTheForm");
      }
      setErrors(next);
      return;
    }
    setErrors({});
    offer.mutate(parsed.data);
  };

  const d = query.data;
  const booked = d ? d.slots.filter((s) => s.booking).length : 0;
  const open = d ? d.slots.length - booked : 0;
  const from = (iso: string) => formatInstant(iso, locale, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }, d?.timezone);
  const until = (iso: string) => formatInstant(iso, locale, { hour: "numeric", minute: "2-digit" }, d?.timezone);

  return (
    <Screen title={t("meetings.teacherTitle")} description={t("meetings.teacherIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
            <Stat label={t("meetings.bookedChip")} value={booked} tone={booked > 0 ? "accent" : "fg"} />
            <Stat label={t("meetings.stillOpen")} value={open} />
          </View>

          <Card title={t("meetings.publishTitle")}>
            <Text variant="sm" tone="muted">
              {t("meetings.publishHint")}
            </Text>
            <Field ref={firstField} label={t("meetings.fieldDate")} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" autoCapitalize="none" error={errors.date} />
            <Field label={t("meetings.fieldFrom")} value={time} onChangeText={setTime} placeholder="15:00" autoCapitalize="none" error={errors.time} />
            <Field label={t("meetings.fieldLength")} value={duration} onChangeText={setDuration} keyboardType="number-pad" error={errors.durationMinutes} />
            <Field label={t("meetings.fieldCount")} value={count} onChangeText={setCount} keyboardType="number-pad" error={errors.count} />
            <Field label={t("meetings.fieldWhere")} value={location} onChangeText={setLocation} placeholder={t("meetings.wherePlaceholder")} error={errors.location} />
            {offer.isError ? <Failed message={offer.error.message} onRetry={submit} /> : null}
            {note ? <Notice text={note} /> : null}
            <Button label={t("meetings.publish")} onPress={submit} busy={offer.isPending} />
          </Card>

          {cancel.isError ? <Failed message={cancel.error.message} onRetry={() => (confirming ? cancel.mutate(confirming) : cancel.reset())} /> : null}
          {d.slots.length === 0 ? (
            <Empty title={t("meetings.upcomingTitle")} body={t("meetings.upcomingEmpty")} action={<Button label={t("meetings.publish")} variant="secondary" onPress={() => firstField.current?.focus()} />} />
          ) : (
            <Card title={t("meetings.upcomingTitle")}>
              {d.slots.map((slot) => (
                <View key={slot.id} style={{ gap: th.space[1] }}>
                  <Row
                    title={`${from(slot.startsAt)} – ${until(slot.endsAt)}${slot.location ? ` · ${slot.location}` : ""}`}
                    caption={slot.booking ? `${t("meetings.bookedBy", { child: slot.booking.childName, parent: slot.booking.parentName })}${slot.booking.note ? ` — “${slot.booking.note}”` : ""}` : t("meetings.stillOpen")}
                    right={slot.booking ? <Pill label={t("meetings.bookedChip")} tone="ok" /> : null}
                  />
                  {confirming === slot.id ? (
                    <View style={{ gap: th.space[2], padding: th.space[3], borderRadius: th.radius.md, backgroundColor: th.dangerSoft }}>
                      <Text variant="sm" bold tone="danger">
                        {t("meetings.cancelAsk")}
                      </Text>
                      <View style={{ flexDirection: "row", gap: th.space[2] }}>
                        <Button label={t("common.confirm")} variant="danger" busy={cancel.isPending} onPress={() => cancel.mutate(slot.id)} style={{ flexGrow: 1 }} />
                        <Button label={t("common.keep")} variant="secondary" onPress={() => setConfirming(null)} style={{ flexGrow: 1 }} />
                      </View>
                    </View>
                  ) : (
                    <Button label={t("common.cancel")} variant="ghost" onPress={() => setConfirming(slot.id)} />
                  )}
                </View>
              ))}
            </Card>
          )}
        </>
      ) : null}
    </Screen>
  );
}
