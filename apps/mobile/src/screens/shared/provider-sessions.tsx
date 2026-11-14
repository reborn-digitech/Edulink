import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gigProviderSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Screen, Text } from "@/components";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Chips, formatInstant, Note, Pill } from "@/screens/family/shared";
import { money } from "@/screens/shared/fees";
import { EarningsCard, GetPaidCard, PaidGateList } from "@/screens/expert/earnings";
import { BOOKING_STATUS, ReasonThen, SESSION_KIND, type SessionKind } from "./gigs";

/**
 * A provider's side of sessions, the same for an expert and a teacher — the
 * web's /expert/sessions and /teacher/guidance: what they have given free
 * against what is asked, the form that offers a time, and every time they
 * have offered with who has a seat in it. A seat is marked once its time has
 * begun; a time or a seat is taken back with a reason the family is told.
 *
 * The date and the hour are typed as the person's own wall clock, which the
 * phone knows; the server is sent the instant.
 *
 * An expert also sees the paid side (decision 0004 as amended): a seat's
 * price, allowed only past the four conditions shown as a checklist; where
 * they are paid; and their earnings. Since 17 October 2026 (seats, decision
 * 0006) the price is asked on a one-to-one as on a workshop, and a teacher
 * prices guidance once paid sessions are on and their UPI id is saved.
 */
const KEY = ["gigs", "slots"] as const;
type Job = { path: string; body?: Record<string, unknown>; done: string; reset?: boolean };

export function ProviderSessions() {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const router = useRouter();
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [kind, setKind] = useState<SessionKind>("ONE_TO_ONE");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [minutes, setMinutes] = useState("60");
  const [seats, setSeats] = useState("20");
  const [link, setLink] = useState("");
  const [price, setPrice] = useState("");
  const [priceError, setPriceError] = useState<string | null>(null);

  const query = useQuery({ queryKey: KEY, queryFn: async () => gigProviderSchema.parse(unwrap(await api().get("/api/v1/gigs/slots"))) });
  const act = useMutation({
    mutationFn: async (job: Job) => {
      const result = await api().post(job.path, job.body);
      if (!result.ok) throw new Error(errorText(result, t("common.somethingWrong")));
      return job;
    },
    onSuccess: (job) => {
      setError(null);
      setDone(job.done);
      if (job.reset) {
        setTitle("");
        setDate("");
        setTime("");
        setPrice("");
      }
      void qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (e) => {
      setDone(null);
      setError(e.message);
    },
  });
  const running = (path: string) => act.isPending && act.variables?.path === path;
  const offer = () => {
    const at = new Date([date.trim(), "T", time.trim(), ":00"].join(""));
    if (!date.trim() || !time.trim() || Number.isNaN(at.getTime())) {
      setDone(null);
      setError(t("gigs.refuseSlotTime"));
      return;
    }
    // A price is rupees, whole or with paise (TA-358): anything else ("1,500", ".", "1.5.0") is refused under the box,
    // where before it was dropped and the time offered free. A grouping comma is refused rather than guessed at.
    const typed = price.trim();
    if (typed !== "" && !/^\d+(\.\d{1,2})?$/.test(typed)) {
      setDone(null);
      setPriceError(t("gigs.refusePrice", { min: priceGate ? money(priceGate.seatPriceMinPaise, locale) : "", max: priceGate ? money(priceGate.seatPriceMaxPaise, locale) : "" }));
      return;
    }
    setPriceError(null);
    const rupees = typed === "" ? 0 : Math.round(Number(typed) * 100);
    act.mutate({ path: "/api/v1/gigs/slots", body: { kind, title, startsAt: at.toISOString(), meetingUrl: link, ...(kind === "WORKSHOP" ? { minutes: Number(minutes), seats: Number(seats) } : {}), ...(rupees > 0 ? { pricePaise: rupees } : {}) }, done: t("gigs.offered"), reset: true });
  };
  const d = query.data;
  const gate = d?.gate ?? null;
  /** The price box asks either provider's gate: an expert's four conditions or a teacher's two (seats, 17 Oct 2026). */
  const priceGate = gate ?? d?.teacherGate ?? null;
  const when = (iso: string) => formatInstant(iso, locale, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }, d?.timeZone);

  return (
    <Screen title={t("gigs.providerTitle")} description={d ? t(d.kind === "EXPERT" ? "gigs.providerIntroEXPERT" : "seats.providerIntroTEACHER") : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {error ? <Failed message={error} /> : null}
      {done ? (
        <Note tone="ok">
          <Text variant="sm" bold tone="ok" accessibilityLiveRegion="polite">
            {done}
          </Text>
        </Note>
      ) : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} planFrom={query.error} onRetry={() => void query.refetch()} /> : null}
      {d && (!d.enabled || !d.duty) ? <Empty title={t("nav.guidance")} body={t("gigs.guidanceOff")} action={<Button label={t("nav.messages")} variant="secondary" onPress={() => router.push("/(app)/messages" as never)} />} /> : null}
      {d && d.enabled && d.duty ? (
        <>
          <Note tone="accent">
            {d.kind === "EXPERT" ? (
              <>
                <Text variant="sm">{t("gigs.dutyStart", { done: d.duty.deliveredOneToOnes, workshops: d.duty.heldWorkshops, start: d.duty.startOneToOnes, startWorkshops: d.duty.startWorkshops })}</Text>
                <Text variant="sm">{t("gigs.dutyStanding", { month: d.duty.oneToOnesThisMonth, monthly: d.duty.monthlyOneToOnes, quarter: d.duty.workshopsThisQuarter, quarterly: d.duty.quarterlyWorkshops })}</Text>
              </>
            ) : (
              <Text variant="sm">{t("gigs.dutyTeacher", { done: d.duty.deliveredOneToOnes, month: d.duty.oneToOnesThisMonth, monthly: d.duty.monthlyOneToOnes })}</Text>
            )}
          </Note>

          <Card title={t("gigs.offerTitle")}>
            {d.kind === "EXPERT" ? (
              <Chips
                label={t("gigs.slotKind")}
                value={kind}
                onChange={setKind}
                options={[
                  { value: "ONE_TO_ONE", label: t("gigs.kindONE_TO_ONE") },
                  { value: "WORKSHOP", label: t("gigs.kindWORKSHOP") },
                ]}
              />
            ) : null}
            <Field label={t("gigs.slotTitle")} hint={t("gigs.slotTitleHint")} value={title} onChangeText={setTitle} maxLength={120} />
            <Field label={t("gigs.slotDate")} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" autoCapitalize="none" />
            <Field label={t("gigs.slotTime")} value={time} onChangeText={setTime} placeholder="15:00" autoCapitalize="none" />
            {kind === "WORKSHOP" ? (
              <>
                <Field label={t("gigs.slotMinutes")} value={minutes} onChangeText={setMinutes} keyboardType="number-pad" />
                <Field label={t("gigs.slotSeats")} value={seats} onChangeText={setSeats} keyboardType="number-pad" />
              </>
            ) : null}
            {priceGate ? <Field label={t("gigs.priceLabel")} hint={t("gigs.priceHint", { min: money(priceGate.seatPriceMinPaise, locale), max: money(priceGate.seatPriceMaxPaise, locale), percent: priceGate.commissionPercent })} value={price} onChangeText={(next) => { setPrice(next); setPriceError(null); }} keyboardType="decimal-pad" editable={priceGate.canCharge} error={priceError} /> : null}
            <Field label={t("gigs.slotLink")} hint={t("seats.linkHint")} value={link} onChangeText={setLink} autoCapitalize="none" keyboardType="url" maxLength={500} />
            <Button label={t("gigs.offer")} busy={running("/api/v1/gigs/slots")} onPress={offer} />
            {gate ? (
              <View style={{ gap: th.space[1], padding: th.space[3], borderRadius: th.radius.md, backgroundColor: th.surfaceMuted }}>
                <Text variant="sm" bold>
                  {t("gigs.gateTitle")}
                </Text>
                <Text variant="xs" tone="muted">
                  {t("seats.gateIntro")}
                </Text>
                <PaidGateList gate={gate} />
              </View>
            ) : null}
          </Card>

          <Card title={t("gigs.yourSlots")}>
            {d.slots.length === 0 ? (
              <Text variant="sm" tone="muted">
                {t("gigs.noSlots")}
              </Text>
            ) : (
              d.slots.map((s) => (
                <View key={s.id} style={{ gap: th.space[2], paddingVertical: th.space[2], borderTopWidth: 1, borderTopColor: th.border }}>
                  <Text variant="base" bold>
                    {s.title}
                  </Text>
                  <Text variant="xs" tone="muted">
                    {[t(SESSION_KIND[s.kind]), when(s.startsAt), t("gigs.seatsOf", { taken: s.seatsTaken, seats: s.seats }), s.pricePaise > 0 ? t("gigs.seatPrice", { amount: money(s.pricePaise, locale) }) : null].filter(Boolean).join(" · ")}
                  </Text>
                  {s.cancelled ? <Pill label={t("gigs.slotIsCancelled")} /> : null}
                  {!s.cancelled && !s.started ? <ReasonThen label={t("gigs.cancelSlot")} about={s.title} busy={running(`/api/v1/gigs/slots/${s.id}/cancel`)} onSubmit={(reason) => act.mutate({ path: `/api/v1/gigs/slots/${s.id}/cancel`, body: { reason }, done: t("gigs.slotCancelled") })} /> : null}
                  {s.bookings.map((b) => (
                    <View key={b.id} style={{ gap: th.space[2], padding: th.space[3], borderRadius: th.radius.md, backgroundColor: th.surfaceMuted }}>
                      <Text variant="sm" bold>
                        {[b.pupilName, b.schoolName].filter(Boolean).join(" · ")}
                      </Text>
                      <Text variant="xs" tone="muted">
                        {b.purpose}
                      </Text>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[1] }}>
                        {b.paid ? <Pill label={t("gigs.paidSeat")} tone="accent" /> : null}
                        <Pill label={t(BOOKING_STATUS[b.status].label)} tone={BOOKING_STATUS[b.status].tone} />
                      </View>
                      {b.status === "CONFIRMED" && s.started ? (
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
                          <Button label={t("gigs.markDelivered")} accessibilityLabel={[t("gigs.markDelivered"), b.pupilName].join(": ")} busy={running(`/api/v1/gigs/sessions/${b.id}/close`) && act.variables?.body?.outcome === "DELIVERED"} onPress={() => act.mutate({ path: `/api/v1/gigs/sessions/${b.id}/close`, body: { outcome: "DELIVERED" }, done: t("gigs.marked") })} />
                          <Button label={t("gigs.markMissed")} variant="secondary" accessibilityLabel={[t("gigs.markMissed"), b.pupilName].join(": ")} onPress={() => act.mutate({ path: `/api/v1/gigs/sessions/${b.id}/close`, body: { outcome: "MISSED" }, done: t("gigs.marked") })} />
                        </View>
                      ) : null}
                      {(b.status === "CONFIRMED" || b.status === "PENDING_CONSENT" || b.status === "PENDING_PAYMENT") && !s.started ? (
                        <ReasonThen label={t("gigs.cancelSeat")} about={b.pupilName} busy={running(`/api/v1/gigs/sessions/${b.id}/cancel`)} onSubmit={(reason) => act.mutate({ path: `/api/v1/gigs/sessions/${b.id}/cancel`, body: { reason }, done: t("gigs.slotCancelled") })} />
                      ) : null}
                      {b.rating !== null ? (
                        <Text variant="xs" tone="muted">
                          {[t("gigs.ratingGiven", { rating: b.rating }), b.feedback].filter(Boolean).join(" · ")}
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              ))
            )}
          </Card>
          {/* Sessions in series (decision 0008): offered on the web in one go; listed and taken back here. */}
          {(d.series ?? []).length > 0 ? (
            <Card title={t("gigs.yourSeries")}>
              {(d.series ?? []).map((s) => (
                <View key={s.id} style={{ gap: th.space[2], paddingVertical: th.space[2], borderTopWidth: 1, borderTopColor: th.border }}>
                  <Text variant="base" bold>
                    {s.title}
                  </Text>
                  <Text variant="xs" tone="muted">
                    {[t(SESSION_KIND[s.kind]), s.rule.mode === "DATES" ? t("gigs.seriesRuleDATES", { count: s.rule.startsAt.length }) : t("gigs.seriesRuleWEEKLY", { days: s.rule.weekdays.map((day) => t(`gigs.weekday${day}` as never)).join(", "), time: s.rule.time, until: s.rule.until }), t("gigs.seriesLine", { sessions: s.sessions, remaining: s.remaining }), s.pricePaise > 0 ? t("gigs.seatPrice", { amount: money(s.pricePaise, locale) }) : null].filter(Boolean).join(" · ")}
                  </Text>
                  {s.cancelled ? <Pill label={t("gigs.seriesIsCancelled")} /> : null}
                  {!s.cancelled && s.remaining > 0 ? <ReasonThen label={t("gigs.seriesCancel")} about={s.title} busy={running(`/api/v1/gigs/series/${s.id}/cancel`)} onSubmit={(reason) => act.mutate({ path: `/api/v1/gigs/series/${s.id}/cancel`, body: { reason }, done: t("gigs.slotCancelled") })} /> : null}
                </View>
              ))}
            </Card>
          ) : null}
          {d.kind === "EXPERT" ? (
            <>
              <GetPaidCard />
              <EarningsCard />
            </>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}
