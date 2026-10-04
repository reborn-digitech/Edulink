import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { lectureSheetSchema, type LectureMark } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { newClientId } from "@/lib/outbox";
import { Chips, Notice } from "../staff/shared";
import { OutboxBadge, postOrQueue, useOutboxRunner } from "../teacher/support";
import { LECTURE_KIND_KEY, MARK_KEY, clock } from "./words";

/**
 * Marking one lecture on the phone (the college's academics, 4 Oct 2026):
 * every student registered on the offering, present unless marked otherwise.
 * The batch carries a client id minted on the device and goes through the
 * outbox when there is no signal, so a lecture marked in a basement lab is
 * kept and sent once — the server writes a clientId it has seen once only.
 */
export function LectureScreen({ lectureId }: { lectureId: string }) {
  const t = useT();
  const qc = useQueryClient();
  const [marks, setMarks] = useState<Record<string, LectureMark>>({});
  const [clientId] = useState(() => newClientId());
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  useOutboxRunner();
  const sheet = useQuery({ queryKey: ["academics", "lecture", lectureId], queryFn: async () => lectureSheetSchema.parse(unwrap(await api().get(`/api/v1/academics/lectures/${lectureId}`))) });
  const save = useMutation({
    mutationFn: async () => {
      const s = sheet.data!;
      return postOrQueue({ url: `/api/v1/academics/lectures/${lectureId}/attendance`, tag: `lecture:${lectureId}`, body: { clientId, entries: s.entries.map((e) => ({ studentMembershipId: e.studentMembershipId, status: marks[e.studentMembershipId] ?? e.status ?? "PRESENT" })) } });
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
  return (
    <Screen title={s ? `${s.lecture.courseCode} · ${s.lecture.courseName}` : t("academics.markLecture")} description={s ? [s.lecture.dateKey, clock(s.lecture.startMinute, s.lecture.endMinute), t(LECTURE_KIND_KEY[s.lecture.kind]!), s.lecture.divisionName].filter(Boolean).join(" · ") : undefined}>
      <OutboxBadge tag={`lecture:${lectureId}`} />
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      {sheet.isPending ? <Loading /> : null}
      {sheet.isError ? <Failed message={sheet.error.message} onRetry={() => void sheet.refetch()} /> : null}
      {s && s.entries.length === 0 ? <Empty icon="users" title={t("academics.noRegistered")} body={t("academics.noRegisteredBody")} action={<Button label={t("common.retry")} variant="secondary" onPress={() => void sheet.refetch()} />} /> : null}
      {s && s.entries.length ? (
        <Card title={t("academics.registerTitle", { n: s.entries.length })}>
          <Text variant="sm" tone="muted">{t("academics.registerBody", { threshold: s.threshold })}</Text>
          {s.entries.map((e) => (
            <Chips
              key={e.studentMembershipId}
              label={`${e.rollNumber ?? "—"} · ${e.name}${e.percent !== null ? ` · ${e.percent}%` : ""}`}
              value={marks[e.studentMembershipId] ?? e.status ?? "PRESENT"}
              disabled={!s.canMark}
              onChange={(next) => setMarks((m) => ({ ...m, [e.studentMembershipId]: next }))}
              options={(["PRESENT", "ABSENT", "LATE"] as const).map((v) => ({ value: v, label: t(MARK_KEY[v]) }))}
            />
          ))}
          {s.canMark ? <Button label={t(s.lecture.marked ? "academics.saveChanges" : "academics.saveMarks")} busy={save.isPending} onPress={() => save.mutate()} /> : <Text tone="muted">{t("academics.cannotMark")}</Text>}
        </Card>
      ) : null}
    </Screen>
  );
}
