import { useState } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { substitutionAssignedSchema, substitutionBoardSchema, type SubstitutionLesson } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, LiveNotice, Loading, Row, Screen, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useEvents } from "@/lib/use-events";
import { Pill } from "../family/shared";
import { clock } from "../teacher/support";
import { addDaysToKey, formatDateKey } from "./shared";

/**
 * The substitution board — the web's /admin/substitutions for the office and
 * the head. One day at a time: who is away, as the staff register and the
 * approved leaves say; every lesson of theirs that day, in period order; who
 * is standing in, and who could — free that period first, then teaches the
 * subject, then the lightest day. Assigning is one POST and a reload; the
 * server decides what "already assigned" means, and says so.
 */
export const PATH = "/api/v1/office/substitutions";
export const BOARD_KEY = ["staff", "substitutions"] as const;

const REASON_KEY = { ABSENT: "substitutions.reasonAbsent", ON_LEAVE: "substitutions.reasonOnLeave" } as const;

/** "Period 2 · 09:40–10:20" — the period by its name (or its number when it has none), then the clock when the grid gives one. */
export function periodLine(t: (key: "substitutions.period") => string, lesson: { periodName: string | null; position?: number; startMinute: number | null; endMinute: number | null }): string {
  const name = lesson.periodName ?? (lesson.position !== undefined ? `${t("substitutions.period")} ${lesson.position + 1}` : t("substitutions.period"));
  return lesson.startMinute !== null && lesson.endMinute !== null ? `${name} · ${clock(lesson.startMinute)}–${clock(lesson.endMinute)}` : name;
}

export function Substitutions() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const { locale } = useLocale();
  const [date, setDate] = useState<string | null>(null);
  const query = useQuery({
    queryKey: [...BOARD_KEY, date ?? "today"],
    placeholderData: keepPreviousData,
    queryFn: async () => substitutionBoardSchema.parse(unwrap(await api().get(`${PATH}${date ? `?date=${date}` : ""}`))),
  });
  const d = query.data;
  /**
   * The board's ear: a cover named, taken away, taken up or declined by
   * anyone in the school on this day (the server publishes
   * `substitution.updated` on the school channel) re-reads the board, so the
   * office desk and the head's phone show one board. A card being worked
   * keeps its choice and its note: the re-read brings new data, not new
   * state. Back from the background, the board is re-read quietly.
   */
  const [changedAt, setChangedAt] = useState<number | null>(null);
  useEvents(
    ["substitution.updated"],
    (event) => {
      if (event.type !== "substitution.updated" || event.dateKey !== d?.dateKey) return;
      void query.refetch();
      setChangedAt(Date.now());
    },
    { enabled: !!d, onResume: () => void query.refetch() },
  );
  const dayLabel = d ? formatDateKey(d.dateKey, locale, { weekday: "short", day: "numeric", month: "short" }) : "";
  return (
    <Screen title={t("substitutions.title")} description={t("substitutions.intro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
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
      <LiveNotice stamp={changedAt}>{t("substitutions.boardChanged")}</LiveNotice>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        d.closed ? (
          <Text variant="sm" tone="warn" accessibilityLiveRegion="polite">
            {d.closedName ? t("substitutions.closedNamed", { name: d.closedName }) : t("substitutions.closedDay")}
          </Text>
        ) : d.absent.length === 0 ? (
          <Empty icon="users" title={t("substitutions.nobodyAway")} body={t("substitutions.nobodyAwayBody")} action={<Button label={t("nav.staffAttendance")} variant="secondary" onPress={() => router.push("/(app)/staff-attendance" as never)} />} />
        ) : (
          <>
            <Text variant="sm" bold accessibilityLiveRegion="polite">
              {`${t("substitutions.lessonsToCover", { count: d.lessons.length })} · ${t("substitutions.coveredOf", { covered: d.covered, total: d.lessons.length })}`}
            </Text>
            <Card title={t("substitutions.awayToday")}>
              {d.absent.map((person) => (
                <Row key={person.membershipId} title={person.name} caption={`${t(REASON_KEY[person.reason])} · ${t("substitutions.coveredOf", { covered: person.covered, total: person.lessons })}`} />
              ))}
            </Card>
            {d.lessons.map((lesson) => (
              <LessonCard key={lesson.slotId} dateKey={d.dateKey} lesson={lesson} />
            ))}
          </>
        )
      ) : null}
    </Screen>
  );
}

/**
 * One lesson to cover: its period, class, subject and room, whose it was and
 * why they are away; then the person standing in with Change and Clear, or —
 * with nobody yet, or after Change — the candidates as a radio list, a note
 * for the substitute, and Assign.
 */
function LessonCard({ dateKey, lesson }: { dateKey: string; lesson: SubstitutionLesson }) {
  const t = useT();
  const th = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const [changing, setChanging] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const reload = () => void qc.invalidateQueries({ queryKey: BOARD_KEY });
  const assign = useMutation({
    mutationFn: async (input: { substituteMembershipId: string; name: string; note?: string }) => ({
      ...substitutionAssignedSchema.parse(unwrap(await api().post(PATH, { dateKey, slotId: lesson.slotId, substituteMembershipId: input.substituteMembershipId, ...(input.note ? { note: input.note } : {}), replacing: lesson.substitute?.membershipId ?? null }))),
      name: input.name,
    }),
    onSuccess: (r) => {
      toast.show(r.changed ? t("substitutions.assignDone", { name: r.name, subject: lesson.subject, className: lesson.className }) : t("substitutions.unchanged"), r.changed ? "ok" : "info");
      setChanging(false);
      setPicked(null);
      setNote("");
      reload();
    },
    // Somebody else named meanwhile is a 409 naming them (QA-16): said, and the board drawn again to show who.
    onError: (e) => {
      toast.show(e.message, "danger");
      reload();
    },
  });
  const clear = useMutation({
    mutationFn: async () => substitutionAssignedSchema.parse(unwrap(await api().post(`${PATH}/clear`, { dateKey, slotId: lesson.slotId }))),
    onSuccess: () => {
      toast.show(t("substitutions.clearDone"), "ok");
      setChanging(false);
      reload();
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const busy = assign.isPending || clear.isPending;
  const choosing = !lesson.substitute || changing;
  const candidate = lesson.candidates.find((c) => c.membershipId === picked) ?? null;
  const title = `${lesson.subject} · ${lesson.className}`;
  return (
    <Card title={title} action={<Pill label={lesson.substitute ? t("substitutions.covered") : t("substitutions.uncovered")} tone={lesson.substitute ? "ok" : "warn"} />}>
      <Text variant="sm" tone="muted">
        {[periodLine(t, lesson), lesson.room].filter(Boolean).join(" · ")}
      </Text>
      <Text variant="sm" tone="muted">
        {`${t("substitutions.absentTeacher")}: ${lesson.absentName} · ${t(REASON_KEY[lesson.absentReason])}`}
      </Text>
      {lesson.substitute ? (
        <View style={{ gap: th.space[1] }}>
          <Text variant="base" bold>
            {`${t("substitutions.substitute")}: ${lesson.substitute.name}`}
          </Text>
          {lesson.substitute.note ? (
            <Text variant="xs" tone="muted">
              {`${t("staffAttendance.note")}: ${lesson.substitute.note}`}
            </Text>
          ) : null}
        </View>
      ) : (
        <Text variant="base" bold tone="warn">
          {`${t("substitutions.substitute")}: ${t("substitutions.noSubstitute")}`}
        </Text>
      )}
      {lesson.substitute && !changing ? (
        <View style={{ flexDirection: "row", gap: th.space[2] }}>
          <Button label={t("substitutions.change")} variant="secondary" disabled={busy} onPress={() => setChanging(true)} accessibilityLabel={`${t("substitutions.change")}: ${title}`} />
          <Button label={t("substitutions.clear")} variant="ghost" busy={clear.isPending} disabled={assign.isPending} onPress={() => clear.mutate()} accessibilityLabel={`${t("substitutions.clear")}: ${title}`} />
        </View>
      ) : null}
      {choosing ? (
        <View style={{ gap: th.space[3] }}>
          <View accessibilityRole="radiogroup" accessibilityLabel={`${t("substitutions.choose")}: ${title}`} style={{ gap: th.space[1] }}>
            <Text variant="xs" tone="subtle" bold>
              {t("substitutions.choose")}
            </Text>
            {lesson.candidates.map((c) => {
              const on = c.membershipId === picked;
              const caption = [c.free ? t("substitutions.candidateFree") : t("substitutions.candidateBusy"), c.teachesSubject ? t("substitutions.teachesSubject", { subject: lesson.subject }) : null, t("substitutions.load", { count: c.load })].filter(Boolean).join(" · ");
              return (
                <Pressable
                  key={c.membershipId}
                  accessibilityRole="radio"
                  aria-checked={on}
                  accessibilityLabel={c.name}
                  accessibilityHint={caption}
                  accessibilityState={{ checked: on, disabled: busy }}
                  disabled={busy}
                  onPress={() => setPicked(c.membershipId)}
                  style={({ pressed }) => ({ minHeight: th.tap, flexDirection: "row", alignItems: "center", gap: th.space[3], paddingHorizontal: th.space[3], paddingVertical: th.space[2], borderRadius: th.radius.md, borderWidth: 1, borderColor: on ? th.accent : th.border, backgroundColor: on ? th.accentSoft : th.surface, opacity: pressed ? 0.8 : 1 })}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="base" bold={on} tone={on ? "accent" : "fg"}>
                      {c.name}
                    </Text>
                    <Text variant="xs" tone="muted">
                      {caption}
                    </Text>
                  </View>
                  <Pill label={c.free ? t("substitutions.candidateFree") : t("substitutions.candidateBusy")} tone={c.free ? "ok" : "warn"} />
                </Pressable>
              );
            })}
          </View>
          <Field label={t("substitutions.note")} value={note} onChangeText={setNote} placeholder={t("substitutions.notePlaceholder")} maxLength={200} />
          <View style={{ flexDirection: "row", gap: th.space[2] }}>
            <Button
              label={t("substitutions.assign")}
              busy={assign.isPending}
              disabled={!candidate || clear.isPending}
              onPress={() => candidate && assign.mutate({ substituteMembershipId: candidate.membershipId, name: candidate.name, note: note.trim() || undefined })}
              accessibilityLabel={`${t("substitutions.assign")}: ${title}`}
            />
            {lesson.substitute ? <Button label={t("common.cancel")} variant="ghost" disabled={busy} onPress={() => setChanging(false)} /> : null}
          </View>
        </View>
      ) : null}
    </Card>
  );
}
