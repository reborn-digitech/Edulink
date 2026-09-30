import { useState } from "react";
import { Linking, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gigFamilySessionsSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Screen, Text } from "@/components";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useRole } from "@/lib/session";
import { BOOKING_STATUS, PROVIDER_KIND, SESSION_KIND, SESSIONS_KEY } from "@/screens/shared/gigs";
import { Chips, formatInstant, Note, Pill } from "./shared";

/**
 * Sessions and workshops, for a pupil and for a guardian — the web's
 * /sessions: the free allowance of the school year, the seats they hold
 * (with the provider's meeting link only while one is confirmed), and the
 * times open to book. A pupil's own ask waits for a guardian, who answers it
 * here. Times are read in the school's zone.
 */
type Job = { path: string; body?: Record<string, unknown>; done: string | ((data: unknown) => string) };

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
  const byGuardian = role === "PARENT";

  const query = useQuery({ queryKey: SESSIONS_KEY, queryFn: async () => gigFamilySessionsSchema.parse(unwrap(await api().get("/api/v1/gigs/sessions"))) });
  const act = useMutation({
    mutationFn: async (job: Job) => {
      const result = await api().post(job.path, job.body);
      if (!result.ok) throw new Error(errorText(result, t("common.somethingWrong")));
      return typeof job.done === "string" ? job.done : job.done(result.data);
    },
    onSuccess: (said) => {
      setError(null);
      setDone(said);
      setAsking(null);
      setPurpose("");
      void qc.invalidateQueries({ queryKey: SESSIONS_KEY });
    },
    onError: (e) => {
      setDone(null);
      setError(e.message);
    },
  });
  const seat = (bookingId: string, tail: string) => `/api/v1/gigs/sessions/${bookingId}/${tail}`;
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
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
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
                      {[t(SESSION_KIND[b.kind]), when(b.startsAt), t("gigs.withProvider", { name: b.providerName }), b.lateCancel ? t("gigs.lateCancelNote") : null].filter(Boolean).join(" · ")}
                    </Text>
                    <Pill label={t(BOOKING_STATUS[b.status].label)} tone={BOOKING_STATUS[b.status].tone} />
                    {b.meetingUrl ? (
                      <>
                        <Button label={t("gigs.joinLink")} accessibilityLabel={[t("gigs.joinLink"), b.title].join(": ")} onPress={() => void Linking.openURL(b.meetingUrl!).catch(() => setError(t("common.somethingWrong")))} />
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
                  const verb = byGuardian ? t("gigs.bookSeat") : t("gigs.askSeat");
                  return (
                    <View key={s.id} style={{ gap: th.space[2], paddingVertical: th.space[2], borderTopWidth: 1, borderTopColor: th.border }}>
                      <Text variant="base" bold>
                        {s.title}
                      </Text>
                      <Text variant="xs" tone="muted">
                        {[t(SESSION_KIND[s.kind]), when(s.startsAt), [t("gigs.withProvider", { name: s.providerName }), `(${t(PROVIDER_KIND[s.providerKind])})`].join(" "), s.kind === "WORKSHOP" ? t("gigs.seatsLeft", { count: s.seatsLeft }) : null].filter(Boolean).join(" · ")}
                      </Text>
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
