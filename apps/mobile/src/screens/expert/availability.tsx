import { useRef, useState } from "react";
import { TextInput, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { expertAddSlotSchema, expertAvailabilitySchema, okSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Text } from "@/components";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { formatDateKey, formatInstant, Pill } from "../family/shared";

/**
 * Availability — the web's /expert/availability: the windows this expert
 * offers, by day, with the booked ones locked (a school holds them; freeing
 * one means cancelling the booking, not deleting the time), and the form
 * that offers another. Times are stored and shown in UTC, as the web says.
 */
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** "2030-01-10" + "09:30" → an ISO instant in UTC, or null when either half is not a date or a time. */
export function utcInstant(dateKey: string, hhmm: string): string | null {
  if (!DATE.test(dateKey) || !TIME.test(hhmm)) return null;
  const at = new Date(`${dateKey}T${hhmm}:00.000Z`);
  return Number.isNaN(at.getTime()) ? null : at.toISOString();
}

export function ExpertAvailability() {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const { locale } = useLocale();
  const query = useQuery({
    queryKey: ["expert", "availability"],
    queryFn: async () => expertAvailabilitySchema.parse(unwrap(await api().get("/api/v1/shared/expert/availability"))),
  });
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const firstField = useRef<TextInput>(null);
  const offer = useMutation({
    mutationFn: async (body: { startsAt: string; endsAt: string; note?: string }) => {
      const result = await api().post("/api/v1/shared/expert/availability", body);
      if (!result.ok) throw new Error(errorText(result, t("common.somethingWrong")));
      return okSchema.parse(result.data);
    },
    onSuccess: () => {
      setDate("");
      setStart("");
      setEnd("");
      setNote("");
      setError(null);
      void qc.invalidateQueries({ queryKey: ["expert", "availability"] });
    },
    onError: (e) => setError(e.message),
  });
  const withdraw = useMutation({
    mutationFn: async (slotId: string) => {
      const result = await api().request("DELETE", `/api/v1/shared/expert/availability/${slotId}`);
      if (!result.ok) throw new Error(errorText(result, t("common.somethingWrong")));
      return okSchema.parse(result.data);
    },
    onSuccess: () => {
      setConfirming(null);
      setError(null);
      void qc.invalidateQueries({ queryKey: ["expert", "availability"] });
    },
    onError: (e) => setError(e.message),
  });

  const submit = () => {
    setError(null);
    const startsAt = utcInstant(date.trim(), start.trim());
    const endsAt = utcInstant(date.trim(), end.trim());
    const next: Record<string, string> = {};
    if (!DATE.test(date.trim())) next.date = t("common.checkTheForm");
    if (!startsAt) next.start = t("common.checkTheForm");
    if (!endsAt) next.end = t("common.checkTheForm");
    if (startsAt && endsAt && endsAt <= startsAt) next.end = t("competitions.endBeforeStart");
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    setErrors({});
    const parsed = expertAddSlotSchema.safeParse({ startsAt, endsAt, ...(note.trim() ? { note: note.trim() } : {}) });
    if (!parsed.success) {
      setErrors({ note: t("common.checkTheForm") });
      return;
    }
    offer.mutate(parsed.data);
  };

  const d = query.data;
  const time = (iso: string) => formatInstant(iso, locale, { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "UTC" });
  // Grouped by the UTC day the window starts on, earliest first.
  const days = new Map<string, NonNullable<typeof d>["slots"]>();
  for (const slot of [...(d?.slots ?? [])].sort((a, b) => a.startsAt.localeCompare(b.startsAt))) {
    const key = slot.startsAt.slice(0, 10);
    days.set(key, [...(days.get(key) ?? []), slot]);
  }

  return (
    <Screen title={t("expert.availability")} description={t("expert.availabilityBody")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {error ? <Failed message={error} onRetry={confirming ? () => withdraw.mutate(confirming) : submit} /> : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} planFrom={query.error} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <Card title={t("expert.offerTime")}>
            <Text variant="xs" tone="subtle">
              {t("expert.timesInUtc")}
            </Text>
            <Field ref={firstField} label={t("calendar.date")} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" autoCapitalize="none" error={errors.date} />
            <View style={{ flexDirection: "row", gap: th.space[3] }}>
              <View style={{ flex: 1 }}>
                <Field label={t("expert.starts")} value={start} onChangeText={setStart} placeholder="HH:MM" autoCapitalize="none" error={errors.start} />
              </View>
              <View style={{ flex: 1 }}>
                <Field label={t("expert.ends")} value={end} onChangeText={setEnd} placeholder="HH:MM" autoCapitalize="none" error={errors.end} />
              </View>
            </View>
            <Field label={t("calendar.note")} value={note} onChangeText={setNote} placeholder={t("expert.timeNotePlaceholder")} error={errors.note} />
            <Button label={t("expert.offerTime")} onPress={submit} busy={offer.isPending} />
          </Card>

          <Card title={t("expert.yourTimes")}>
            {d.slots.length === 0 ? (
              <Empty title={t("expert.noTimesYet")} action={<Button label={t("expert.offerTime")} variant="secondary" onPress={() => firstField.current?.focus()} />} />
            ) : (
              [...days.entries()].map(([dayKey, slots]) => (
                <View key={dayKey} style={{ gap: th.space[1] }}>
                  <Text variant="sm" bold tone="muted" accessibilityRole="header" level={3}>
                    {formatDateKey(dayKey, locale, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                  </Text>
                  {slots.map((slot) => {
                    const busy = withdraw.isPending && withdraw.variables === slot.id;
                    return (
                      <View key={slot.id} style={{ borderTopWidth: 1, borderTopColor: th.border }}>
                        <Row
                          title={`${time(slot.startsAt)} – ${time(slot.endsAt)}`}
                          caption={[slot.note, slot.booking?.topic].filter(Boolean).join(" · ") || undefined}
                          right={
                            slot.booking ? (
                              <Pill label={t("expert.bookedBy", { school: slot.booking.schoolName })} tone="accent" />
                            ) : confirming === slot.id ? null : (
                              <Button variant="ghost" label={t("common.remove")} onPress={() => setConfirming(slot.id)} />
                            )
                          }
                        />
                        {!slot.booking && confirming === slot.id ? (
                          <View style={{ flexDirection: "row", gap: th.space[2], paddingBottom: th.space[2] }}>
                            <Button variant="danger" label={t("expert.withdrawTime")} busy={busy} onPress={() => withdraw.mutate(slot.id)} style={{ flex: 1 }} />
                            <Button variant="secondary" label={t("common.keep")} disabled={busy} onPress={() => setConfirming(null)} style={{ flex: 1 }} />
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              ))
            )}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
