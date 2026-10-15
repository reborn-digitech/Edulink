import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { expertBookingsSchema, expertFreeDutySchema, expertProfileSchema } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Stat, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useSession } from "@/lib/session";
import { featuresOf } from "@/lib/nav";
import { formatInstant, Note, Pill } from "../family/shared";

/**
 * Bookings — the web's /expert: the schools that have booked one of this
 * expert's times, what is coming up first, and how many messages wait in
 * each. An expert has no school of their own, so times read in UTC, the
 * way the web shows them. While the profile is still under review (the
 * web's /expert/pending), that is said here too, because an empty list
 * with no reason looks like a broken app.
 */
const STATUS_KEY: Record<string, TranslationKey> = { CONFIRMED: "expert.statusConfirmed", CANCELLED: "expert.statusCancelled", COMPLETED: "expert.statusCompleted" };
const STATUS_TONE: Record<string, "accent" | "danger" | "muted"> = { CONFIRMED: "accent", CANCELLED: "danger", COMPLETED: "muted" };

export function ExpertHome() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const { locale } = useLocale();
  const session = useSession();
  // Expert sessions switched off on the platform (15 Oct 2026; /me's `features`): one sentence, and the profile.
  const sessionsOn = featuresOf(session.status === "signed-in" ? session.me : null).includes("EXPERT_SESSIONS");
  const query = useQuery({
    enabled: sessionsOn,
    queryKey: ["expert", "bookings"],
    queryFn: async () => expertBookingsSchema.parse(unwrap(await api().get("/api/v1/shared/expert/bookings"))),
  });
  // Standing is a second, quieter question: a refusal here changes nothing on the screen.
  const profile = useQuery({
    queryKey: ["expert", "profile"],
    queryFn: async () => expertProfileSchema.parse(unwrap(await api().get("/api/v1/shared/expert/profile"))),
  });
  // Decision 0004's free duty, from the one function that gates a price (the web's freeDutyRemaining).
  const duty = useQuery({
    enabled: sessionsOn,
    queryKey: ["expert", "free-duty"],
    queryFn: async () => expertFreeDutySchema.parse(unwrap(await api().get("/api/v1/expert/free-duty"))),
  });
  const dutyLines = duty.data
    ? [
        duty.data.oneToOnes > 0 ? (duty.data.stage.oneToOnes === "START" ? t("gigs.freeDutyStartOneToOnes", { count: duty.data.oneToOnes, start: duty.data.asked.startOneToOnes }) : t("gigs.freeDutyMonthOneToOnes", { count: duty.data.oneToOnes })) : null,
        duty.data.workshops > 0 ? (duty.data.stage.workshops === "START" ? t("gigs.freeDutyStartWorkshops", { count: duty.data.workshops, start: duty.data.asked.startWorkshops }) : t("gigs.freeDutyQuarterWorkshops", { count: duty.data.workshops })) : null,
      ].filter((line): line is string => line !== null)
    : [];
  const d = query.data;
  // "Coming up" is judged against the moment the screen opened; a pull-to-refresh keeps the same line.
  const [now] = useState(() => Date.now());
  const upcoming = d ? d.bookings.filter((b) => b.status === "CONFIRMED" && new Date(b.endsAt).getTime() >= now).sort((a, b) => a.startsAt.localeCompare(b.startsAt)) : [];
  const rest = d ? d.bookings.filter((b) => !upcoming.includes(b)).sort((a, b) => b.startsAt.localeCompare(a.startsAt)) : [];
  const unread = d ? d.bookings.reduce((sum, b) => sum + b.unread, 0) : 0;
  const held = d ? d.bookings.filter((b) => b.status === "COMPLETED").length : 0;
  const when = (iso: string) => formatInstant(iso, locale, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "UTC" });
  const statusLabel = (status: string) => (STATUS_KEY[status] ? t(STATUS_KEY[status]!) : status.toLowerCase());
  const bookingRow = (b: (typeof upcoming)[number]) => (
    <Row
      key={b.id}
      title={b.schoolName}
      caption={`${b.topic} · ${when(b.startsAt)}`}
      onPress={() => router.push({ pathname: "/(app)/booking", params: { bookingId: b.id } } as never)}
      right={
        <View style={{ alignItems: "flex-end", gap: th.space[1] }}>
          <Pill label={statusLabel(b.status)} tone={STATUS_TONE[b.status] ?? "muted"} />
          {b.unread > 0 ? <Pill label={t("expert.newCount", { count: b.unread })} tone="accent" /> : null}
        </View>
      }
    />
  );
  if (!sessionsOn) {
    return (
      <Screen title={t("expert.bookings")}>
        <Empty title={t("platformFeatures.expertNotOpen")} action={<Button label={t("nav.profile")} variant="secondary" onPress={() => router.push("/(app)/profile" as never)} />} />
      </Screen>
    );
  }
  return (
    <Screen title={t("expert.bookings")} description={t("expert.bookingsBody")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {profile.data && !profile.data.profile.published ? (
        <Note tone="warn">
          <Text variant="sm" bold>
            {t("expert.underReview")}
          </Text>
          <Text variant="xs" tone="muted">
            {t("expert.underReviewBody")}
          </Text>
          <Button label={t("nav.profile")} variant="secondary" onPress={() => router.push("/(app)/profile" as never)} />
        </Note>
      ) : null}
      {duty.data ? (
        <Card title={t("gigs.freeDutyTitle")}>
          <Text variant="xs" tone="subtle">
            {t("gigs.freeDutyBody")}
          </Text>
          {dutyLines.length === 0 ? (
            <Text variant="sm" tone="ok" bold>
              {t("gigs.freeDutyDone")}
            </Text>
          ) : (
            dutyLines.map((line) => (
              <Text key={line} variant="sm">
                {line}
              </Text>
            ))
          )}
          <Button label={t("gigs.providerTitle")} variant="secondary" onPress={() => router.push("/(app)/sessions" as never)} />
        </Card>
      ) : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
            <Stat label={t("expert.statSessionsBooked")} value={upcoming.length} tone="accent" />
            <Stat label={t("expert.statSessionsDone")} value={held} />
            <Stat label={t("nav.messages")} value={unread} tone={unread > 0 ? "warn" : "fg"} />
          </View>
          {d.bookings.length === 0 ? (
            <Empty title={t("expert.noBookings")} body={t("expert.noBookingsBody")} action={<Button label={t("expert.availabilityCta")} variant="secondary" onPress={() => router.push("/(app)/availability" as never)} />} />
          ) : (
            <>
              {upcoming.length > 0 ? (
                <Card title={t("calendar.upcoming")}>
                  <Text variant="xs" tone="subtle">
                    {t("expert.timesInUtc")}
                  </Text>
                  {upcoming.map(bookingRow)}
                </Card>
              ) : null}
              {rest.length > 0 ? <Card title={t("expert.yourBookings")}>{rest.map(bookingRow)}</Card> : null}
            </>
          )}
        </>
      ) : null}
    </Screen>
  );
}
