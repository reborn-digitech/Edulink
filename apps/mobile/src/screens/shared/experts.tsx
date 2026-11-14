import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { expertBookedSchema, staffExpertsSchema, type StaffExperts } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Text } from "@/components";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Chips } from "../staff/shared";
import { formatInstant, Pill } from "../family/shared";

type Offering = "" | "SESSIONS" | "MENTORING" | "BOTH";
type Expert = StaffExperts["experts"][number];

/** The web's EXPERT_OFFERING_META: keys, not words. */
const OFFERING: Record<Exclude<Offering, "">, TranslationKey> = { SESSIONS: "expert.offeringSessions", MENTORING: "expert.offeringMentoring", BOTH: "expert.offeringBoth" };

/** `?q=&offering=&specialism=` — the server filters, as the web page does from its URL. */
export function expertsQuery(q: string, offering: Offering, specialism: string): string {
  const parts: string[] = [];
  if (q) parts.push(`q=${encodeURIComponent(q)}`);
  if (offering) parts.push(`offering=${offering}`);
  if (specialism) parts.push(`specialism=${encodeURIComponent(specialism)}`);
  return parts.length ? `?${parts.join("&")}` : "";
}

/**
 * Experts — the web's /experts marketplace for a school's staff: this
 * school's live bookings first, then the listed experts with their free
 * times, and a booking that asks for the topic before the claim, because the
 * topic is the only thing telling the expert what the meeting is for.
 * A booking's conversation is the web's.
 */
export function Experts() {
  const t = useT();
  const qc = useQueryClient();
  const router = useRouter();
  const { locale } = useLocale();
  const [typed, setTyped] = useState("");
  const [q, setQ] = useState("");
  const [offering, setOffering] = useState<Offering>("");
  const [specialism, setSpecialism] = useState("");
  const [openSlot, setOpenSlot] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [error, setError] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["staff", "experts", q, offering, specialism],
    placeholderData: keepPreviousData,
    queryFn: async () => staffExpertsSchema.parse(unwrap(await api().get(`/api/v1/staff/experts${expertsQuery(q, offering, specialism)}`))),
  });
  const book = useMutation({
    mutationFn: async (body: { slotId: string; topic: string }) => {
      const result = await api().post("/api/v1/staff/experts/book", body);
      if (!result.ok) throw new Error(errorText(result, t("expert.couldNotBook")));
      return expertBookedSchema.parse(result.data);
    },
    onSuccess: () => {
      setError(null);
      setOpenSlot(null);
      setTopic("");
      void qc.invalidateQueries({ queryKey: ["staff", "experts"] });
    },
    onError: (e) => setError(e.message),
  });
  const d = query.data;
  const live = d?.bookings.filter((b) => b.status !== "CANCELLED") ?? [];
  const narrowed = Boolean(q || offering || specialism);
  const clear = () => {
    setTyped("");
    setQ("");
    setOffering("");
    setSpecialism("");
  };
  // In UTC, the clock an expert's window is stored, offered and printed in on the web and on the expert's own screen
  // (TA-277); the device's zone printed the same slot five and a half hours from the web's list.
  const when = (iso: string) => formatInstant(iso, locale, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }, "UTC");
  const until = (iso: string) => formatInstant(iso, locale, { hour: "numeric", minute: "2-digit" }, "UTC");
  return (
    <Screen title={t("feature.experts")} description={t("expert.marketplaceBody")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {error ? <Failed message={error} /> : null}
      {live.length > 0 ? (
        <Card title={t("expert.yourBookings")}>
          {live.map((b) => (
            <Row key={b.id} title={b.expertName} caption={`${b.topic} · ${when(b.startsAt)}`} right={b.unread > 0 ? <Pill tone="accent" label={t("expert.newCount", { count: b.unread })} /> : null} onPress={() => router.push({ pathname: "/(app)/booking", params: { bookingId: b.id } } as never)} />
          ))}
        </Card>
      ) : null}
      <Field label={t("common.searchLabel")} placeholder={t("expert.searchPlaceholder")} value={typed} onChangeText={setTyped} onSubmitEditing={() => setQ(typed.trim())} returnKeyType="search" autoCapitalize="none" />
      <Chips
        label={t("expert.offeringFilter")}
        value={offering}
        options={[{ value: "" as Offering, label: t("vacancies.filterAll") }, ...(Object.keys(OFFERING) as Exclude<Offering, "">[]).map((k) => ({ value: k as Offering, label: t(OFFERING[k]) }))]}
        onChange={setOffering}
      />
      {d && d.specialisms.length > 1 ? <Chips label={t("expert.specialismFilter")} value={specialism} options={[{ value: "", label: t("expert.allSpecialisms") }, ...d.specialisms.map((s) => ({ value: s, label: s }))]} onChange={setSpecialism} /> : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} planFrom={query.error} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        d.experts.length === 0 ? (
          narrowed ? (
            <Empty title={t("common.noResultsTitle")} body={t("common.noResultsBody")} action={<Button label={t("people.clearFilters")} variant="secondary" onPress={clear} />} />
          ) : (
            <Empty title={t("expert.noneListed")} body={t("expert.noneListedBody")} action={<Button label={t("nav.mentoring")} variant="secondary" onPress={() => router.push("/(app)/mentoring" as never)} />} />
          )
        ) : (
          <>
            <Text variant="xs" bold tone="muted" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
              {t("expert.availableExperts")}
            </Text>
            {d.experts.map((expert) => (
              <ExpertCard
                key={expert.id}
                expert={expert}
                openSlot={openSlot}
                topic={topic}
                busy={book.isPending ? (book.variables?.slotId ?? null) : null}
                onOpen={(slotId) => {
                  setOpenSlot(slotId);
                  setTopic("");
                }}
                onTopic={setTopic}
                onBook={(slotId) => book.mutate({ slotId, topic: topic.trim() })}
                when={when}
                until={until}
              />
            ))}
          </>
        )
      ) : null}
    </Screen>
  );
}

function ExpertCard({ expert, openSlot, topic, busy, onOpen, onTopic, onBook, when, until }: { expert: Expert; openSlot: string | null; topic: string; busy: string | null; onOpen: (slotId: string | null) => void; onTopic: (text: string) => void; onBook: (slotId: string) => void; when: (iso: string) => string; until: (iso: string) => string }) {
  const t = useT();
  const th = useTheme();
  const mentoring = expert.offering === "SESSIONS" ? null : expert.mentoringOpen ? (expert.mentorCapacity === null ? t("expert.takingMentees") : t("expert.upToAtATime", { count: expert.mentorCapacity })) : t("expert.notTakingMentees");
  return (
    <Card
      title={expert.name}
      action={
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[1], justifyContent: "flex-end" }}>
          {expert.verified ? <Pill tone="ok" label={t("expert.verified")} /> : null}
          {/* Families' ratings, computed on the server from three on; "New" before that. */}
          <Pill tone={expert.rating ? "accent" : "muted"} label={expert.rating ? t("expert.ratingLine", { average: expert.rating.average.toFixed(1), count: expert.rating.count }) : t("expert.ratingNew")} />
        </View>
      }
    >
      {expert.organisation ? (
        <Text variant="xs" tone="muted">
          {expert.organisation}
        </Text>
      ) : null}
      <Text variant="base">{expert.headline}</Text>
      {expert.bio ? (
        <Text variant="sm" tone="muted" numberOfLines={3}>
          {expert.bio}
        </Text>
      ) : null}
      {expert.specialisms.length > 0 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[1] }}>
          {expert.specialisms.map((s) => (
            <Pill key={s} label={s} />
          ))}
        </View>
      ) : null}
      <Text variant="xs" bold tone="muted">
        {[t(OFFERING[expert.offering]), mentoring].filter(Boolean).join(" · ")}
      </Text>
      {expert.offering === "MENTORING" ? (
        <Text variant="xs" tone="muted">
          {t("expert.mentoringOnly")}
        </Text>
      ) : expert.openSlots.length === 0 ? (
        <Text variant="xs" tone="muted">
          {t("expert.noFreeTimes")}
        </Text>
      ) : (
        expert.openSlots.map((slot) => {
          const open = openSlot === slot.id;
          return (
            <View key={slot.id} style={{ gap: th.space[2], padding: th.space[3], borderRadius: th.radius.md, borderWidth: 1, borderColor: th.border }}>
              <Text variant="sm" bold>
                {`${when(slot.startsAt)} – ${until(slot.endsAt)}`}
              </Text>
              {slot.note ? (
                <Text variant="xs" tone="muted">
                  {slot.note}
                </Text>
              ) : null}
              {open ? (
                <>
                  <Field label={t("expert.bookTopic", { name: expert.name })} value={topic} onChangeText={onTopic} autoFocus />
                  <View style={{ flexDirection: "row", gap: th.space[2] }}>
                    <Button label={t("expert.confirmBooking")} disabled={topic.trim().length < 3} busy={busy === slot.id} onPress={() => onBook(slot.id)} style={{ flex: 1 }} />
                    <Button label={t("common.cancel")} variant="ghost" onPress={() => onOpen(null)} />
                  </View>
                </>
              ) : (
                <Button label={t("expert.book")} variant="secondary" onPress={() => onOpen(slot.id)} />
              )}
            </View>
          );
        })
      )}
    </Card>
  );
}
