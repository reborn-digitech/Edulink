import { useState } from "react";
import { usePrivateScreen } from "@/lib/private-screen";
import { Pressable, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { marksBatchSchema, marksGridSchema, marksSavedSchema, staffExamsSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { queueMark } from "@/lib/outbox";
import { OutboxBadge, dayLabel, throwIfRefused, useOutboxRunner, writeOrQueue } from "./support";

/**
 * The marks grid, the web's /teacher/exams: pick a class, pick a paper, type
 * a mark per pupil, save the sheet. One POST /api/v1/marks with the whole
 * sheet — replay-safe, so it goes to the outbox when the network is not there.
 * The sheet names the version it was typed on (`basedOn`: the grid's, or the
 * last save's answer), so a pupil's mark written since by anyone is kept by
 * the server rather than replaced (TA-010, TA-012); a sent sheet removes the
 * older one waiting in the outbox under the same paper (writeOrQueue).
 */
const KIND_KEY = { UNIT_TEST: "exams.kindUnitTest", MID_TERM: "exams.kindMidTerm", FINAL: "exams.kindFinal" } as const;

export function MarksGrid() {
  // Marks and report cards are a child's private record: no screenshots, no screen recording, while this screen is up.
  usePrivateScreen();
  const params = useLocalSearchParams<{ classId?: string; slotId?: string }>();
  const t = useT();
  const { locale } = useLocale();
  const th = useTheme();
  const qc = useQueryClient();
  const router = useRouter();
  const [classId, setClassId] = useState<string | null>(params.classId ?? null);
  const [slotId, setSlotId] = useState<string | null>(params.slotId ?? null);
  const [entries, setEntries] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  // The version the last save of this paper answered with, newer than the grid's until the grid is read again.
  const [savedVersion, setSavedVersion] = useState<{ tag: string; version: string } | null>(null);
  useOutboxRunner();

  const exams = useQuery({
    queryKey: ["staff", "exams"],
    queryFn: async () => staffExamsSchema.parse(unwrap(await api().get("/api/v1/staff/exams"))),
  });
  const grid = useQuery({
    queryKey: ["staff", "exams", "grid", classId, slotId],
    queryFn: async () => marksGridSchema.parse(unwrap(await api().get(`/api/v1/staff/exams/grid?classId=${classId}${slotId ? `&slotId=${slotId}` : ""}`))),
    enabled: Boolean(classId && slotId),
  });
  const tag = `marks:${classId}:${slotId}`;
  const save = useMutation({
    mutationFn: async (body: unknown) => {
      const startedAt = queueMark();
      const result = await api().post("/api/v1/marks", body);
      const outcome = throwIfRefused(await writeOrQueue(result, { url: "/api/v1/marks", body, tag, startedAt }));
      const parsed = result.ok ? marksSavedSchema.safeParse(result.data) : null;
      return { outcome, answer: parsed !== null && parsed.success ? parsed.data : null };
    },
    onSuccess: ({ outcome, answer }) => {
      if (answer?.version) setSavedVersion({ tag, version: answer.version });
      const kept = answer?.skipped ?? 0;
      // Marks someone wrote after this sheet was read stood: the typed ones over them go, so the boxes show what is saved.
      if (kept > 0) setEntries({});
      setNote(outcome.kind !== "sent" ? t("common.queuedOffline") : kept > 0 ? t("exams.savedSomeKept", { count: kept }) : t("exams.savedNote"));
      void qc.invalidateQueries({ queryKey: ["staff", "exams", "grid", classId, slotId] });
      void qc.invalidateQueries({ queryKey: ["staff", "today"] });
    },
  });

  const klass = exams.data?.classes.find((c) => c.id === classId) ?? null;
  const sheet = grid.data?.grid ?? null;
  const valueFor = (membershipId: string, server: number | null) => entries[membershipId] ?? (server === null ? "" : String(server));

  /** The later of the grid's version and the last save's answer: what this sheet was typed on. */
  const basedOn = (() => {
    const read = grid.data?.version ?? null;
    const saved = savedVersion?.tag === tag ? savedVersion.version : null;
    if (!read || !saved) return read ?? saved;
    return Date.parse(saved) > Date.parse(read) ? saved : read;
  })();

  const submit = () => {
    if (!sheet || !classId || !slotId) return;
    setNote(null);
    const parsed = marksBatchSchema.safeParse({
      slotId,
      classId,
      ...(basedOn ? { basedOn } : {}),
      entries: sheet.pupils.map((p) => {
        const raw = valueFor(p.membershipId, p.marks).trim();
        return { membershipId: p.membershipId, marks: raw === "" ? null : Number(raw) };
      }),
    });
    if (!parsed.success) {
      setFormError(t("common.checkTheForm"));
      return;
    }
    const over = parsed.data.entries.some((e) => e.marks !== null && e.marks > sheet.maxMarks);
    if (over) {
      setFormError(t("exams.gridHint", { max: sheet.maxMarks }));
      return;
    }
    setFormError(null);
    save.mutate(parsed.data);
  };

  const pick = (nextClass: string | null, nextSlot: string | null) => {
    setClassId(nextClass);
    setSlotId(nextSlot);
    setEntries({});
    setNote(null);
    setFormError(null);
  };

  return (
    <Screen title={t("exams.marksTitle")} description={t("exams.marksIntro")} refreshing={exams.isRefetching || grid.isRefetching} onRefresh={() => void Promise.all([exams.refetch(), grid.refetch()])}>
      <OutboxBadge />
      {exams.isPending ? <Loading /> : null}
      {exams.isError ? <Failed error={exams.error} onRetry={() => void exams.refetch()} /> : null}
      {exams.data && !klass ? (
        exams.data.classes.length === 0 ? (
          <Empty title={t("teacher.noClassesYet")} body={t("teacher.noClassesBody")} action={<Button label={t("nav.messages")} variant="secondary" onPress={() => router.push("/(app)/messages" as never)} />} />
        ) : (
          <Card title={t("nav.classes")}>
            {exams.data.classes.map((c) => (
              <Row key={c.id} title={c.name} caption={c.gradeLevel ?? undefined} onPress={() => pick(c.id, null)} />
            ))}
          </Card>
        )
      ) : null}
      {klass ? (
        <Card title={klass.name} action={<Button label={t("nav.classes")} variant="ghost" onPress={() => pick(null, null)} />}>
          {klass.series.length === 0 ? (
            <Empty title={t("exams.noPapersTitle")} body={t("exams.noPapersBody")} action={<Button label={t("nav.messages")} variant="secondary" onPress={() => router.push("/(app)/messages" as never)} />} />
          ) : (
            <>
              <Text variant="sm" bold>
                {t("exams.pickPaper")}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
                {klass.series.flatMap((s) =>
                  s.slots.map((slot) => {
                    const on = slot.id === slotId;
                    const label = `${slot.subject} · ${s.name} (${t(KIND_KEY[s.kind])}) · ${dayLabel(slot.dateKey, locale)}`;
                    return (
                      <Pressable
                        key={slot.id}
                        accessibilityRole="radio"
                        aria-checked={on}
                        accessibilityLabel={label}
                        accessibilityState={{ checked: on }}
                        onPress={() => pick(klass.id, slot.id)}
                        style={{ minHeight: th.tap, justifyContent: "center", paddingHorizontal: th.space[3], borderRadius: th.radius.md, borderWidth: 1, borderColor: on ? th.accent : th.border, backgroundColor: on ? th.accentSoft : th.surface }}
                      >
                        <Text variant="sm" bold={on} tone={on ? "accent" : "fg"}>
                          {label}
                        </Text>
                      </Pressable>
                    );
                  }),
                )}
              </View>
            </>
          )}
        </Card>
      ) : null}
      {klass && slotId && grid.isPending ? <Loading /> : null}
      {grid.isError ? <Failed error={grid.error} onRetry={() => void grid.refetch()} /> : null}
      {sheet ? (
        <Card title={`${sheet.subject} · ${sheet.seriesName}`}>
          <Text variant="sm" tone="muted">
            {t("exams.gridHint", { max: sheet.maxMarks })} {t("exams.blankMeansAbsent")}
          </Text>
          {grid.data?.examUnweighted ? (
            <Text variant="xs" tone="warn">
              {t("exams.unweightedNote")}
            </Text>
          ) : null}
          {sheet.pupils.length === 0 ? (
            <Empty title={t("exams.emptyRoll")} action={<Button label={t("teacher.classJoinCode")} variant="secondary" onPress={() => router.push({ pathname: "/(app)/classes/detail", params: { classId } } as never)} />} />
          ) : (
            <>
              {sheet.pupils.map((p) => (
                <Field key={p.membershipId} label={p.name} value={valueFor(p.membershipId, p.marks)} onChangeText={(v) => setEntries((prev) => ({ ...prev, [p.membershipId]: v }))} keyboardType="decimal-pad" placeholder={`/ ${sheet.maxMarks}`} />
              ))}
              {formError ? (
                <Text variant="sm" tone="danger" accessibilityRole="alert">
                  {formError}
                </Text>
              ) : null}
              {save.isError ? <Failed message={save.error.message} onRetry={submit} /> : null}
              {note ? (
                <Text variant="sm" tone="ok" accessibilityLiveRegion="polite">
                  {note}
                </Text>
              ) : null}
              <OutboxBadge tag={tag} />
              <Button label={t("exams.saveMarks")} onPress={submit} busy={save.isPending} />
            </>
          )}
        </Card>
      ) : null}
      {klass && !slotId && klass.series.length > 0 ? (
        <Text variant="sm" tone="muted">
          {t("exams.pickPaper")}
        </Text>
      ) : null}
    </Screen>
  );
}
