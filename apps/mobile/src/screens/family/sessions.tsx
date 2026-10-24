import { useEffect, useRef, useState } from "react";
import { Linking, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gigCheckoutSchema, gigFamilySessionsSchema, gigJoinSchema, gigPaymentStatusSchema, type GigCheckout } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Screen, Text } from "@/components";
import { API_BASE, api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useRole } from "@/lib/session";
import { bytesApi, shareBytes } from "@/lib/download";
import { BOOKING_STATUS, PROVIDER_KIND, RECEIPT_STATUSES, SESSION_KIND, SESSIONS_KEY, type SessionPaymentStatus } from "@/screens/shared/gigs";
import { money } from "@/screens/shared/fees";
import { Chips, formatInstant, Note, openWeb, Pill } from "./shared";

/**
 * Sessions and workshops, for a pupil and for a guardian — the web's
 * /sessions: the free allowance of the school year, the seats they hold
 * (with the provider's meeting link only while one is confirmed), and the
 * times open to book. A pupil's own ask waits for a guardian, who answers it
 * here. Times are read in the school's zone.
 *
 * A PAID SEAT (decision 0004 as amended) past the allowance: the booking, or
 * a guardian's consent, hands back an order, and the pay step is the fees
 * pattern — with a real gateway the phone opens the web's sessions page on
 * the same order, where the gateway's script runs, and watches the payment
 * from here; under devbox it watches alone until /dev/payments marks it.
 *
 * SEATS (17 October 2026): a one-to-one and a teacher's guidance may be priced too; a pupil of eighteen or more pays
 * for their own seat, a pupil under eighteen never sees a Pay button ("Ask your parent" sends the ask to a guardian).
 * Join asks the join door for the room as it is pressed (GET /gigs/sessions/{bookingId}/join), so a seat cancelled
 * since the list was read is not joined.
 */
type Job = { path: string; body?: Record<string, unknown>; done: string | ((data: unknown) => string) };
/** How often and how long the phone asks after a started payment; a test shortens both. */
export const POLL = { intervalMs: 2000, maxMs: 60_000 };

export function FamilySessions() {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const role = useRole();
  const router = useRouter();
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [asking, setAsking] = useState<string | null>(null);
  const [purpose, setPurpose] = useState("");
  const [rating, setRating] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [paying, setPaying] = useState<{ checkout: GigCheckout; startedAt: number } | null>(null);
  const [receiptBusy, setReceiptBusy] = useState<string | null>(null);
  const byGuardian = role === "PARENT";
  /** The family's receipt for a seat the company collected for: the PDF through the share sheet, as a certificate is. */
  const openReceipt = async (paymentId: string) => {
    setReceiptBusy(paymentId);
    setError(null);
    const fallback = t("common.somethingWrong");
    const got = await bytesApi.get(`/api/v1/gigs/payments/${encodeURIComponent(paymentId)}/receipt`, fallback);
    const failed = got.ok ? await shareBytes(got, `${t("gigs.rcptTitle")} ${paymentId}.pdf`, fallback) : got.error;
    if (failed) setError(failed);
    setReceiptBusy(null);
  };
  /** A paid seat's order: opened on the web when the gateway's script is needed, watched from here either way. */
  const startPaying = (checkout: GigCheckout) => {
    setPaying({ checkout, startedAt: Date.now() });
    if (checkout.transport === "razorpay") {
      const path = `/sessions?checkout=${encodeURIComponent(checkout.paymentId)}`;
      WebBrowser.openBrowserAsync(`${API_BASE}${path}`).catch(() => openWeb(path));
    }
  };

  const query = useQuery({ queryKey: SESSIONS_KEY, queryFn: async () => gigFamilySessionsSchema.parse(unwrap(await api().get("/api/v1/gigs/sessions"))) });
  const act = useMutation({
    mutationFn: async (job: Job) => {
      const result = await api().post(job.path, job.body);
      if (!result.ok) throw new Error(errorText(result, t("common.somethingWrong")));
      // A booking, a consent or a checkout that hands back an order: the pay step opens instead of a line.
      const checkout = (result.data as { checkout?: unknown } | null)?.checkout;
      if (checkout) return { checkout: gigCheckoutSchema.parse(checkout) };
      return typeof job.done === "string" ? job.done : job.done(result.data);
    },
    onSuccess: (said) => {
      setError(null);
      setAsking(null);
      setPurpose("");
      if (typeof said === "string") setDone(said);
      else {
        setDone(null);
        startPaying(said.checkout);
      }
      void qc.invalidateQueries({ queryKey: SESSIONS_KEY });
    },
    onError: (e) => {
      setDone(null);
      setError(e.message);
    },
  });
  const seat = (bookingId: string, tail: string) => `/api/v1/gigs/sessions/${bookingId}/${tail}`;
  const [joining, setJoining] = useState<string | null>(null);
  /** The room, from the join door at the moment of joining; a refusal (not yet confirmed or paid) is said as the server says it. */
  const join = async (bookingId: string) => {
    setJoining(bookingId);
    setError(null);
    const got = await api().get(seat(bookingId, "join"));
    setJoining(null);
    if (!got.ok) return setError(errorText(got, t("common.somethingWrong")));
    const link = gigJoinSchema.safeParse(got.data);
    if (!link.success) return setError(t("common.somethingWrong"));
    await Linking.openURL(link.data.meetingUrl).catch(() => setError(t("common.somethingWrong")));
  };
  const running = (path: string) => act.isPending && act.variables?.path === path;
  const d = query.data;

  return (
    <Screen title={t("gigs.sessionsTitle")} description={t("gigs.sessionsIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
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
      {paying ? (
        <PayWatch
          flow={paying}
          onDone={() => void qc.invalidateQueries({ queryKey: SESSIONS_KEY })}
          onClose={() => {
            setPaying(null);
            void qc.invalidateQueries({ queryKey: SESSIONS_KEY });
          }}
        />
      ) : null}
      {d && d.children.length === 0 ? <Empty title={t("gigs.noSeats")} body={t("gigs.sessionsIntro")} action={<Button label={t("nav.messages")} variant="secondary" onPress={() => router.push("/(app)/messages" as never)} />} /> : null}
      {d?.children.map((c) => {
        const when = (iso: string) => formatInstant(iso, locale, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }, c.timeZone);
        return (
          <View key={c.id} style={{ gap: th.space[3] }}>
            {byGuardian ? (
              <Text variant="base" bold accessibilityRole="header">
                {[c.name, c.schoolName].join(" · ")}
              </Text>
            ) : null}
            <Note tone="accent">
              <Text variant="sm">{t("gigs.allowanceLine", { oneLeft: c.allowance.ONE_TO_ONE.left, oneAllowed: c.allowance.ONE_TO_ONE.allowed, workLeft: c.allowance.WORKSHOP.left, workAllowed: c.allowance.WORKSHOP.allowed })}</Text>
            </Note>

            <Card title={t("gigs.yourSeats")}>
              {c.bookings.length === 0 ? (
                <Text variant="sm" tone="muted">
                  {t("gigs.noSeats")}
                </Text>
              ) : (
                c.bookings.map((b) => (
                  <View key={b.id} style={{ gap: th.space[2], paddingVertical: th.space[2], borderTopWidth: 1, borderTopColor: th.border }}>
                    <Text variant="base" bold>
                      {b.title}
                    </Text>
                    <Text variant="xs" tone="muted">
                      {[t(SESSION_KIND[b.kind]), when(b.startsAt), t("gigs.withProvider", { name: b.providerName }), b.lateCancel ? t("gigs.lateCancelNote") : null, b.paid ? t("gigs.paidSeat") : null].filter(Boolean).join(" · ")}
                    </Text>
                    {b.payment && b.payment.status !== "INITIATED" && b.payment.status !== "FAILED" ? (
                      <Text variant="xs" tone="muted">
                        {b.payment.status === "REFUNDED" ? t("gigs.refundLine", { amount: money(b.payment.amountPaise, locale) }) : t("gigs.paymentLine", { amount: money(b.payment.amountPaise, locale) })}
                      </Text>
                    ) : null}
                    {b.payment && RECEIPT_STATUSES.includes(b.payment.status as SessionPaymentStatus) ? <Button label={t("gigs.receiptLink")} variant="ghost" accessibilityLabel={[t("gigs.receiptLink"), b.title].join(": ")} busy={receiptBusy === b.payment.paymentId} onPress={() => void openReceipt(b.payment!.paymentId)} /> : null}
                    <Pill label={t(BOOKING_STATUS[b.status].label)} tone={BOOKING_STATUS[b.status].tone} />
                    {b.canPay ? <Button label={t("gigs.payNow", { amount: money(b.pricePaise, locale) })} accessibilityLabel={[t("gigs.payNow", { amount: money(b.pricePaise, locale) }), b.title].join(": ")} busy={running(seat(b.id, "checkout"))} onPress={() => act.mutate({ path: seat(b.id, "checkout"), done: "" })} /> : null}
                    {(b.canJoin ?? Boolean(b.meetingUrl)) ? (
                      <>
                        <Button label={t("gigs.joinLink")} accessibilityLabel={[t("gigs.joinLink"), b.title].join(": ")} busy={joining === b.id} onPress={() => void join(b.id)} />
                        <Text variant="xs" tone="muted">
                          {t("gigs.linkHint")}
                        </Text>
                      </>
                    ) : null}
                    {b.canConsent ? (
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
                        <Button label={t("gigs.consentYes")} accessibilityLabel={[t("gigs.consentYes"), b.title].join(": ")} busy={running(seat(b.id, "consent")) && act.variables?.body?.approve === true} onPress={() => act.mutate({ path: seat(b.id, "consent"), body: { approve: true }, done: t("gigs.consented") })} />
                        <Button label={t("gigs.consentNo")} variant="secondary" accessibilityLabel={[t("gigs.consentNo"), b.title].join(": ")} onPress={() => act.mutate({ path: seat(b.id, "consent"), body: { approve: false }, done: t("gigs.declined") })} />
                      </View>
                    ) : null}
                    {b.canCancel && !b.canConsent ? (
                      <>
                        <Button
                          label={t("gigs.giveUp")}
                          variant="ghost"
                          accessibilityLabel={[t("gigs.giveUp"), b.title].join(": ")}
                          busy={running(seat(b.id, "cancel"))}
                          onPress={() => act.mutate({ path: seat(b.id, "cancel"), body: { reason: "" }, done: (data) => ((data as { lateCancel?: boolean }).lateCancel ? t("gigs.givenUpLate") : t("gigs.givenUp")) })}
                        />
                        {b.status === "CONFIRMED" ? (
                          <Text variant="xs" tone="muted">
                            {t("gigs.lateWarn", { hours: d?.freeCancelHours ?? 12 })}
                          </Text>
                        ) : null}
                      </>
                    ) : null}
                    {b.canReportUnheld ? <Button label={t("gigs.reportUnheld")} variant="secondary" accessibilityLabel={[t("gigs.reportUnheld"), b.title].join(": ")} busy={running(seat(b.id, "unheld"))} onPress={() => act.mutate({ path: seat(b.id, "unheld"), done: t("gigs.reportedUnheld") })} /> : null}
                    {b.canRate ? (
                      <View style={{ gap: th.space[2] }}>
                        <Chips label={t("gigs.ratingLabel")} value={rating[b.id] ?? "5"} onChange={(v) => setRating((prev) => ({ ...prev, [b.id]: v }))} options={["1", "2", "3", "4", "5"].map((n) => ({ value: n, label: n }))} />
                        <Field label={t("gigs.feedbackLabel")} value={feedback[b.id] ?? ""} onChangeText={(v) => setFeedback((prev) => ({ ...prev, [b.id]: v }))} maxLength={500} />
                        <Button label={t("gigs.sendRating")} accessibilityLabel={[t("gigs.rate"), b.title].join(": ")} busy={running(seat(b.id, "rate"))} onPress={() => act.mutate({ path: seat(b.id, "rate"), body: { rating: Number(rating[b.id] ?? "5"), feedback: feedback[b.id] ?? "" }, done: t("gigs.rated") })} />
                      </View>
                    ) : null}
                  </View>
                ))
              )}
            </Card>

            <Card title={t("gigs.openTitle")}>
              {c.open.length === 0 ? (
                <Text variant="sm" tone="muted">
                  {t("gigs.noneOpen")}
                </Text>
              ) : (
                c.open.map((s) => {
                  const key = [c.id, s.id].join(":");
                  // A guardian, or a pupil of eighteen or more, pays for a priced seat; a pupil under eighteen asks a parent.
                  const selfPays = c.selfPays ?? byGuardian;
                  const priced = s.pricePaise > 0 && !s.freeSeat && d.paymentsOn;
                  const verb = priced ? (selfPays ? t("gigs.payNow", { amount: money(s.pricePaise, locale) }) : t("seats.askParent")) : selfPays ? t("gigs.bookSeat") : t("gigs.askSeat");
                  return (
                    <View key={s.id} style={{ gap: th.space[2], paddingVertical: th.space[2], borderTopWidth: 1, borderTopColor: th.border }}>
                      <Text variant="base" bold>
                        {s.title}
                      </Text>
                      <Text variant="xs" tone="muted">
                        {[t(SESSION_KIND[s.kind]), when(s.startsAt), [t("gigs.withProvider", { name: s.providerName }), `(${t(PROVIDER_KIND[s.providerKind])})`].join(" "), s.kind === "WORKSHOP" ? t("gigs.seatsLeft", { count: s.seatsLeft }) : null].filter(Boolean).join(" · ")}
                      </Text>
                      {s.pricePaise > 0 ? (
                        <Text variant="xs" bold>
                          {s.freeSeat ? t("gigs.seatFree") : t("gigs.seatPrice", { amount: money(s.pricePaise, locale) })}
                        </Text>
                      ) : null}
                      {priced && !selfPays ? (
                        <Text variant="xs" tone="muted">
                          {t("seats.askParentNote")}
                        </Text>
                      ) : null}
                      {s.providerHeadline ? (
                        <Text variant="xs" tone="muted">
                          {s.providerHeadline}
                        </Text>
                      ) : null}
                      {asking === key ? (
                        <>
                          <Field label={t("gigs.purposeLabel")} hint={t("gigs.purposeHint")} value={purpose} onChangeText={setPurpose} maxLength={500} multiline />
                          <Button
                            label={verb}
                            busy={running("/api/v1/gigs/sessions/book")}
                            onPress={() => act.mutate({ path: "/api/v1/gigs/sessions/book", body: { slotId: s.id, studentMembershipId: c.id, purpose }, done: (data) => ((data as { status?: string }).status === "CONFIRMED" ? t("gigs.booked") : t("gigs.asked")) })}
                          />
                        </>
                      ) : (
                        <Button
                          label={verb}
                          variant="secondary"
                          accessibilityLabel={[verb, s.title].join(": ")}
                          onPress={() => {
                            setAsking(key);
                            setPurpose("");
                          }}
                        />
                      )}
                    </View>
                  );
                })
              )}
            </Card>
          </View>
        );
      })}
    </Screen>
  );
}

const SETTLED = new Set(["PAID", "HELD", "RELEASED", "DUE", "PAID_OUT", "REFUNDED", "FAILED"]);

/** A started seat payment: the phone asks after it every few seconds until it is paid, it failed, or a minute has passed. */
function PayWatch({ flow, onDone, onClose }: { flow: { checkout: GigCheckout; startedAt: number }; onDone: () => void; onClose: () => void }) {
  const t = useT();
  const { locale } = useLocale();
  const [timedOut, setTimedOut] = useState(false);
  const status = useQuery({
    queryKey: ["gigs", "payment", flow.checkout.paymentId],
    queryFn: async () => gigPaymentStatusSchema.parse(unwrap(await api().get(`/api/v1/gigs/payments/${flow.checkout.paymentId}`))),
    staleTime: 0,
    gcTime: 0,
    refetchInterval: (q) => {
      if (q.state.data && SETTLED.has(q.state.data.status)) return false;
      if (Date.now() - flow.startedAt > POLL.maxMs) {
        setTimedOut(true);
        return false;
      }
      return POLL.intervalMs;
    },
  });
  const s = status.data;
  const paid = Boolean(s && (s.status === "PAID" || s.status === "HELD" || s.status === "DUE" || s.status === "PAID_OUT"));
  const settled = Boolean(s && SETTLED.has(s.status));
  const told = useRef(false);
  useEffect(() => {
    if (paid && !told.current) {
      told.current = true;
      onDone();
    }
  }, [paid, onDone]);
  return (
    <Card title={`${t("gigs.payTitle")} · ${money(flow.checkout.amountPaise, locale)}`}>
      {paid ? (
        <Note tone="ok">
          <Text variant="sm" bold tone="ok" accessibilityLiveRegion="polite">
            {t("gigs.payDone")}
          </Text>
        </Note>
      ) : s && settled ? (
        <Note tone="danger">
          <Text variant="sm" bold tone="danger" accessibilityLiveRegion="polite">
            {s.reason ?? t("gigs.payFailed")}
          </Text>
        </Note>
      ) : timedOut ? (
        <Note tone="warn">
          <Text variant="sm" tone="warn" accessibilityLiveRegion="polite">
            {t("gigs.payNotYet")}
          </Text>
        </Note>
      ) : (
        <Text variant="sm" tone="muted" accessibilityLiveRegion="polite">
          {s ? t("gigs.payChecking") : t("gigs.payOpening")}
        </Text>
      )}
      {flow.checkout.transport !== "razorpay" && !settled ? (
        <Note tone="accent">
          <Text variant="xs" tone="accent">
            {t("gigs.payDevbox")} /dev/payments
          </Text>
        </Note>
      ) : null}
      <Text variant="xs" tone="muted">
        {t("gigs.payeeNote")}
      </Text>
      {status.isError ? <Failed message={status.error.message} planFrom={status.error} onRetry={() => void status.refetch()} /> : null}
      <Button label={settled || timedOut ? t("common.back") : t("common.cancel")} variant="secondary" onPress={onClose} />
    </Card>
  );
}
