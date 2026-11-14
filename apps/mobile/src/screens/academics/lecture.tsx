import { useEffect, useRef, useState } from "react";
import { FlatList, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { lectureSheetSchema, type LectureMark } from "@edulink/contracts";
import { Button, Empty, Failed, Loading, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { newClientId, onQueueEvent } from "@/lib/outbox";
import { Chips, Notice } from "../staff/shared";
import { OutboxBadge, postOrQueue, useOutboxRunner } from "../teacher/support";
import { useSessionIfAny } from "@/lib/session";
import { MARK_KEY, clock, lectureKindLabel } from "./words";

/**
 * Marking one lecture on the phone (the college's academics, 4 Oct 2026):
 * every student registered on the offering, present unless marked otherwise.
 * The batch carries a client id minted on the device and goes through the
 * outbox when there is no signal, so a lecture marked in a basement lab is
 * kept and sent once — the server writes a clientId it has seen once only.
 * So the id belongs to one body, not to the screen (TA-011, 13 Nov 2026): a
 * save of changed marks mints its own, and only the same marks saved again
 * reuse the last one; with one id per screen the correction saved second was
 * answered as a replay and written nowhere. A batch kept offline that the
 * server refuses when the outbox sends it (a registration dropped, the sheet
 * frozen, the lecture no longer the teacher's) is said so here, and the sheet
 * is read again (TA-152): it was not written. The roster is a FlatList, so a
 * division of 120 mounts the rows on screen and not 120 rows with three
 * choices each at once (TA-456); the screen does not scroll around it.
 */
export function LectureScreen({ lectureId }: { lectureId: string }) {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const [marks, setMarks] = useState<Record<string, LectureMark>>({});
  const lastSave = useRef<{ body: string; clientId: string } | null>(null);
  const session = useSessionIfAny();
  const streams = session?.status === "signed-in" ? (session.me.streams ?? []) : [];
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  useOutboxRunner();
  const sheet = useQuery({ queryKey: ["academics", "lecture", lectureId], queryFn: async () => lectureSheetSchema.parse(unwrap(await api().get(`/api/v1/academics/lectures/${lectureId}`))) });
  const refetchSheet = sheet.refetch;
  useEffect(
    () =>
      onQueueEvent((e) => {
        if (e.type !== "rejected" || e.item.tag !== `lecture:${lectureId}`) return;
        setNotice({ tone: "danger", text: t("academics.lectureReplayRefused") });
        void refetchSheet();
      }),
    [lectureId, refetchSheet, t],
  );
  const save = useMutation({
    mutationFn: async () => {
      const s = sheet.data!;
      const entries = s.entries.map((e) => ({ studentMembershipId: e.studentMembershipId, status: marks[e.studentMembershipId] ?? e.status ?? "PRESENT" }));
      const key = `${lectureId}:${JSON.stringify(entries)}`;
      const last = lastSave.current;
      const clientId = last !== null && last.body === key ? last.clientId : newClientId();
      lastSave.current = { body: key, clientId };
      return postOrQueue({ url: `/api/v1/academics/lectures/${lectureId}/attendance`, tag: `lecture:${lectureId}`, body: { clientId, entries } });
    },
    onSuccess: (outcome) => {
      if (outcome.kind === "refused") setNotice({ tone: "danger", text: outcome.message });
      else if (outcome.kind === "queued") setNotice({ tone: "ok", text: t("common.queuedOffline") });
      else {
        setNotice({ tone: "ok", text: t("academics.lectureMarked") });
        void qc.invalidateQueries({ queryKey: ["academics"] });
      }
    },
  });
  const s = sheet.data;
  const roster = s && s.entries.length ? s.entries : [];
  const header = (
    <View style={{ gap: th.space[3], paddingBottom: roster.length ? th.space[3] : 0 }}>
      <OutboxBadge tag={`lecture:${lectureId}`} />
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      {sheet.isPending ? <Loading /> : null}
      {sheet.isError ? <Failed message={sheet.error.message} onRetry={() => void sheet.refetch()} /> : null}
      {s && s.entries.length === 0 ? <Empty icon="users" title={t("academics.noRegistered")} body={t("academics.noRegisteredBody")} action={<Button label={t("common.retry")} variant="secondary" onPress={() => void sheet.refetch()} />} /> : null}
      {s && s.entries.length ? (
        <>
          <Text variant="lg" bold accessibilityRole="header">
            {t("academics.registerTitle", { n: s.entries.length })}
          </Text>
          <Text variant="sm" tone="muted">{t("academics.registerBody", { threshold: s.threshold })}</Text>
        </>
      ) : null}
    </View>
  );
  const footer = s && s.entries.length ? (
    <View style={{ paddingTop: th.space[3], paddingBottom: th.space[8] }}>
      {s.canMark ? <Button label={t(s.lecture.marked ? "academics.saveChanges" : "academics.saveMarks")} busy={save.isPending} onPress={() => save.mutate()} /> : <Text tone="muted">{t(s.frozen ? "academics.frozenLecture" : "academics.cannotMark")}</Text>}
    </View>
  ) : null;
  return (
    <Screen
      title={s ? `${s.lecture.courseCode} · ${s.lecture.courseName}` : t("academics.markLecture")}
      description={s ? [s.lecture.dateKey, clock(s.lecture.startMinute, s.lecture.endMinute), lectureKindLabel(s.lecture.kind, t, streams), s.lecture.divisionName].filter(Boolean).join(" · ") : undefined}
      scroll={false}
      style={{ flex: 1, paddingHorizontal: th.space[4] }}
    >
      <FlatList
        data={roster}
        keyExtractor={(e) => e.studentMembershipId}
        extraData={marks}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={15}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        ItemSeparatorComponent={RowGap}
        renderItem={({ item: e }) => (
          <Chips
            label={`${e.rollNumber ?? "—"} · ${e.name}${e.percent !== null ? ` · ${e.percent}%` : ""}`}
            value={marks[e.studentMembershipId] ?? e.status ?? "PRESENT"}
            disabled={!s?.canMark}
            onChange={(next) => setMarks((m) => ({ ...m, [e.studentMembershipId]: next }))}
            options={(["PRESENT", "ABSENT", "LATE"] as const).map((v) => ({ value: v, label: t(MARK_KEY[v]) }))}
          />
        )}
      />
    </Screen>
  );
}

/** The space between two students' rows of the roster. */
function RowGap() {
  const th = useTheme();
  return <View style={{ height: th.space[3] }} />;
}
