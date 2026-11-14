import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { entranceSlotsListSchema, entranceSlotsPublishedSchema, slotCancelledSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Screen, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Confirm, param, Pill } from "../family/shared";
import { slotLine } from "../shared/application";
import { dateProblem } from "../shared/pupil-record";
import { must, parseClock, Refusal } from "./shared";
import { CYCLES_KEY } from "./admissions";

/** A day and a clock time as the office types them, as the instant the server stores; null when either cannot be read. */
export function slotStart(date: string, time: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  const minutes = parseClock(time);
  if (!m || minutes === null) return null;
  const at = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Math.floor(minutes / 60), minutes % 60, 0, 0);
  return Number.isNaN(at.getTime()) ? null : at.toISOString();
}

const whole = (text: string, min: number, max: number): number | null => {
  const n = Number(text.trim());
  return /^\d+$/.test(text.trim()) && n >= min && n <= max ? n : null;
};

/**
 * One cycle's entrance-test sittings — the web's sittings panel: each with
 * its time, its room and how many of its places are booked, cancelled
 * ones marked, and a form that publishes a run of sittings back to back
 * from a first start time. Cancelling releases the families booked on it
 * and tells them.
 */
export function AdmissionSlots() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = param(params.id);
  // Keyed by the cycle (TA-162): the route stays mounted as a tab, and another cycle's sittings form kept this one's.
  return <CycleSlots key={id ?? ""} id={id} />;
}

function CycleSlots({ id }: { id: string | undefined }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("30");
  const [count, setCount] = useState("1");
  const [capacity, setCapacity] = useState("10");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [tried, setTried] = useState(false);
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const [asking, setAsking] = useState<string | null>(null);
  const key = ["office", "admissions", "slots", id];
  const query = useQuery({
    queryKey: key,
    enabled: Boolean(id),
    queryFn: async () => entranceSlotsListSchema.parse(unwrap(await api().get(`/api/v1/office/admissions/cycles/${id}/slots`))),
  });
  const publish = useMutation({
    mutationFn: async (body: { startsAt: string; durationMinutes: number; count: number; capacity: number; location?: string; note?: string }) =>
      entranceSlotsPublishedSchema.parse(must(await api().post(`/api/v1/office/admissions/cycles/${id}/slots`, body), t("common.somethingWrong"))),
    onSuccess: (result) => {
      setRefusal(null);
      setTried(false);
      // The run just published leaves the form (TA-162), so a second press does not publish it again.
      setDate("");
      setTime("");
      setDuration("30");
      setCount("1");
      setCapacity("10");
      setLocation("");
      setNote("");
      toast.show(t("admissions.published", { count: result.created }), "ok");
      void qc.invalidateQueries({ queryKey: key });
      void qc.invalidateQueries({ queryKey: CYCLES_KEY });
    },
    onError: (e) => setRefusal(e instanceof Refusal ? e : new Refusal(e.message, 0, {})),
  });
  const cancel = useMutation({
    mutationFn: async (slotId: string) => slotCancelledSchema.parse(must(await api().post(`/api/v1/office/admissions/slots/${slotId}/cancel`, {}), t("common.somethingWrong"))),
    onSuccess: () => {
      setAsking(null);
      toast.show(t("admissions.cancelled"), "ok");
      void qc.invalidateQueries({ queryKey: key });
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  if (!id) {
    return (
      <Screen title={t("admissions.slotsTitle")}>
        <Empty icon="users" title={t("admissions.noCycles")} body={t("admissions.noCyclesBody")} action={<Button label={t("admissions.title")} variant="secondary" onPress={() => router.push("/(app)/admissions" as never)} />} />
      </Screen>
    );
  }
  const slots = query.data?.slots ?? [];
  const startsAt = slotStart(date, time);
  const dateBad = tried ? (dateProblem(t, date) ?? (date.trim() ? undefined : t("refusal.required"))) : undefined;
  const timeBad = tried && parseClock(time) === null ? t("refusal.required") : undefined;
  const durationN = whole(duration, 10, 240);
  const countN = whole(count, 1, 20);
  const capacityN = whole(capacity, 1, 200);
  const numberBad = (n: number | null) => (tried && n === null ? t("refusal.required") : undefined);
  const send = () => {
    setTried(true);
    if (!startsAt || durationN === null || countN === null || capacityN === null) return;
    publish.mutate({ startsAt, durationMinutes: durationN, count: countN, capacity: capacityN, ...(location.trim() ? { location: location.trim() } : {}), ...(note.trim() ? { note: note.trim() } : {}) });
  };
  return (
    <Screen title={t("admissions.slotsTitle")} description={t("admissions.testRequiredHint")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed error={query.error} onRetry={() => void query.refetch()} /> : null}
      {query.data ? (
        slots.length === 0 ? (
          <Empty icon="calendar" title={t("admissions.noSlots")} body={t("admissions.noSlotsBody")} action={<Button label={t("admissions.title")} variant="secondary" onPress={() => router.push("/(app)/admissions" as never)} />} />
        ) : (
          <Card>
            {slots.map((s) => (
              <View key={s.id} style={{ gap: th.space[2], paddingVertical: th.space[2] }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: th.space[3] }}>
                  <View style={{ flex: 1, gap: 1 }}>
                    <Text variant="base" bold>
                      {slotLine(s, locale)}
                    </Text>
                    <Text variant="sm" tone="muted">
                      {[t("admissions.booked", { booked: s.booked, capacity: s.capacity }), s.note].filter(Boolean).join(" · ")}
                    </Text>
                  </View>
                  {s.cancelledAt ? <Pill label={t("admissions.cancelled")} tone="danger" /> : asking === s.id ? null : <Button label={t("admissions.cancelSlot")} variant="ghost" onPress={() => setAsking(s.id)} />}
                </View>
                {/* Asked first, as the web asks (TA-163): a cancelled sitting releases every family booked on it and tells them, and nothing brings it back. */}
                {!s.cancelledAt && asking === s.id ? <Confirm question={t("admissions.cancelSlotConfirm")} confirmLabel={t("admissions.cancelSlot")} cancelLabel={t("common.keep")} busy={cancel.isPending && cancel.variables === s.id} onConfirm={() => cancel.mutate(s.id)} onCancel={() => setAsking(null)} /> : null}
              </View>
            ))}
          </Card>
        )
      ) : null}
      <Card title={t("admissions.publishSlots")}>
        {refusal ? <Failed message={refusal.message} /> : null}
        <Text variant="sm" tone="muted">
          {t("admissions.startsAt")}
        </Text>
        <Field label={t("admissions.slotDate")} hint="YYYY-MM-DD" value={date} onChangeText={setDate} autoCapitalize="none" keyboardType="numbers-and-punctuation" maxLength={10} error={dateBad ?? refusal?.issues.startsAt} />
        <Field label={t("admissions.slotTime")} hint="HH:MM" value={time} onChangeText={setTime} autoCapitalize="none" keyboardType="numbers-and-punctuation" maxLength={5} error={timeBad} />
        <Field label={t("admissions.duration")} value={duration} onChangeText={setDuration} keyboardType="number-pad" maxLength={3} error={numberBad(durationN) ?? refusal?.issues.durationMinutes} />
        <Field label={t("admissions.count")} value={count} onChangeText={setCount} keyboardType="number-pad" maxLength={2} error={numberBad(countN) ?? refusal?.issues.count} />
        <Field label={t("admissions.capacity")} value={capacity} onChangeText={setCapacity} keyboardType="number-pad" maxLength={3} error={numberBad(capacityN) ?? refusal?.issues.capacity} />
        <Field label={t("admissions.location")} value={location} onChangeText={setLocation} maxLength={120} error={refusal?.issues.location} />
        <Field label={t("admissions.slotNote")} value={note} onChangeText={setNote} maxLength={400} multiline error={refusal?.issues.note} />
        <Button label={t("admissions.publishSlots")} busy={publish.isPending} onPress={send} />
      </Card>
    </Screen>
  );
}
