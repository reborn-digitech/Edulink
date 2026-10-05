import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { academicsIdResultSchema, mentoringSchema, MENTOR_FLAGS } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { Chips, Notice } from "../staff/shared";
import { FLAG_KEY } from "./words";
import { formatDate } from "@/lib/dates";

/**
 * A mentor's groups on the phone (the college's academics, 4 Oct 2026) —
 * the web's /faculty/mentoring: who is in each group with the latest flag,
 * and a note on one of them with the flag NAAC counts. Forming groups is
 * the HOD's, on the web.
 */
export function MentoringScreen() {
  const t = useT();
  const qc = useQueryClient();
  const view = useQuery({ queryKey: ["academics", "mentoring"], queryFn: async () => mentoringSchema.parse(unwrap(await api().get("/api/v1/academics/mentoring"))) });
  const [student, setStudent] = useState<Record<string, string>>({});
  const [flag, setFlag] = useState<Record<string, string>>({});
  const [note, setNote] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const add = useMutation({
    mutationFn: async (input: { groupId: string; studentMembershipId: string; note: string; flag: string }) => academicsIdResultSchema.parse(unwrap(await api().post("/api/v1/academics/mentoring/notes", input))),
    onSuccess: (_d, input) => {
      setNotice({ tone: "ok", text: t("academics.noteSaved") });
      setNote((n) => ({ ...n, [input.groupId]: "" }));
      void qc.invalidateQueries({ queryKey: ["academics", "mentoring"] });
    },
    onError: (e: Error) => setNotice({ tone: "danger", text: e.message }),
  });
  return (
    <Screen title={t("academics.mentoringTitle")} description={t("academics.mentoringIntro")} refreshing={view.isRefetching} onRefresh={() => void view.refetch()}>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      {view.isPending ? <Loading /> : null}
      {view.isError ? <Failed message={view.error.message} onRetry={() => void view.refetch()} /> : null}
      {view.data && view.data.groups.length === 0 ? <Empty icon="users" title={t("academics.mentoringNone")} body={t("academics.mentoringNoneBody")} action={<Button label={t("common.retry")} variant="secondary" onPress={() => void view.refetch()} />} /> : null}
      {view.data?.groups.map((g) => {
        const who = student[g.id] ?? g.members[0]?.studentMembershipId ?? "";
        return (
          <Card key={g.id} title={g.name}>
            <Text variant="sm" tone="muted">{t("academics.mentorLine", { name: g.facultyName, n: g.members.length })}</Text>
            {g.members.map((m) => (
              <Row key={m.studentMembershipId} title={m.name} caption={m.flag !== "NONE" ? t(FLAG_KEY[m.flag]!) : undefined} />
            ))}
            {g.members.length ? (
              <>
                <Chips label={t("academics.colStudent")} value={who} onChange={(v) => setStudent((s) => ({ ...s, [g.id]: v }))} options={g.members.map((m) => ({ value: m.studentMembershipId, label: m.name }))} />
                <Chips label={t("academics.fieldFlag")} value={flag[g.id] ?? "NONE"} onChange={(v) => setFlag((f) => ({ ...f, [g.id]: v }))} options={MENTOR_FLAGS.map((f) => ({ value: f, label: t(FLAG_KEY[f]!) }))} />
                <Field label={t("academics.fieldNote")} value={note[g.id] ?? ""} onChangeText={(v) => setNote((n) => ({ ...n, [g.id]: v }))} multiline />
                <Button label={t("academics.addNote")} disabled={(note[g.id] ?? "").trim().length < 2} busy={add.isPending} onPress={() => add.mutate({ groupId: g.id, studentMembershipId: who, note: (note[g.id] ?? "").trim(), flag: flag[g.id] ?? "NONE" })} />
              </>
            ) : null}
            {g.notes.slice(0, 5).map((n) => (
              <Row key={n.id} title={n.studentName} caption={`${formatDate(n.at)} · ${n.note}`} />
            ))}
          </Card>
        );
      })}
    </Screen>
  );
}
