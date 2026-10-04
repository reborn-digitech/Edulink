import { useState } from "react";
import { Linking, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { academicsChangedResultSchema, courseFileSchema, internalMarksResultSchema, internalSheetSchema, type CourseFile } from "@edulink/contracts";
import { Button, Card, Failed, Field, Loading, Row, Screen, Text } from "@/components";
import { api, API_BASE } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Chips, Notice } from "../staff/shared";
import { INTERNAL_KIND_KEY, ITEM_KEY } from "./words";

type Tab = "file" | "marks";

/**
 * One course I teach (the college's academics, 4 Oct 2026) — the web's
 * /faculty/offerings/[id]: the course file (the plan by week with what has
 * been taught, resources and papers, outcome attainment) and the internal
 * marks — a component's marks entered student by student, a colleague's
 * countersign, and for the HOD release and lock. The plan itself, the
 * components and a pasted sheet are the web's.
 */
export function OfferingScreen({ offeringId, initialTab = "file" }: { offeringId: string; initialTab?: Tab }) {
  const t = useT();
  const [tab, setTab] = useState<Tab>(initialTab);
  const file = useQuery({ queryKey: ["academics", "file", offeringId], queryFn: async () => courseFileSchema.parse(unwrap(await api().get(`/api/v1/academics/offerings/${offeringId}/course-file`))) });
  const f = file.data;
  return (
    <Screen title={f ? `${f.courseCode} · ${f.courseName}` : t("academics.offeringTitle")} description={f?.facultyName ?? undefined}>
      <Chips label={t("academics.offeringTitle")} value={tab} onChange={setTab} options={[{ value: "file", label: t("academics.tabCourseFile") }, { value: "marks", label: t("academics.tabInternal") }]} />
      {tab === "file" ? (
        <>
          {file.isPending ? <Loading /> : null}
          {file.isError ? <Failed message={file.error.message} onRetry={() => void file.refetch()} /> : null}
          {f ? <FileView f={f} /> : null}
        </>
      ) : (
        <MarksView offeringId={offeringId} />
      )}
    </Screen>
  );
}

function FileView({ f }: { f: CourseFile }) {
  const t = useT();
  return (
    <>
      <Card title={t("academics.planTitle")}>
        <Text variant="sm" tone="muted">{t("academics.coverageLine", { taught: f.taught, planned: f.plan.length, expected: f.expected, elapsed: f.termElapsedPercent })}</Text>
        {f.behind ? <Notice tone="danger" text={t("academics.behindBody")} /> : null}
        {f.plan.length === 0 ? <Text tone="muted">{t("academics.planNone")}</Text> : null}
        {f.plan.map((w) => (
          <Row key={w.week} title={`${t("academics.weekN", { n: w.week })} · ${w.topic}`} caption={[w.coCodes.join(", "), w.taughtOn ? t("academics.taughtOn", { date: w.taughtOn }) : null].filter(Boolean).join(" · ")} />
        ))}
      </Card>
      <Card title={t("academics.itemsTitle")}>
        {f.items.length === 0 ? <Text tone="muted">{t("academics.itemsNone")}</Text> : null}
        {f.items.map((i) => (
          <Row
            key={i.id}
            title={i.title}
            caption={[t(ITEM_KEY[i.kind]!), i.coCodes.join(", ")].filter(Boolean).join(" · ")}
            onPress={i.url ? () => void Linking.openURL(i.url!) : i.fileId ? () => void Linking.openURL(`${API_BASE}/api/files/${encodeURIComponent(i.fileId!)}`) : undefined}
          />
        ))}
      </Card>
      {f.attainment.cos.length ? (
        <Card title={t("academics.attainmentTitle")}>
          {f.attainment.cos.map((c) => (
            <Row key={c.code} title={c.code} caption={`${t("academics.reachedOf", { reached: c.reached, assessed: c.assessed })} · ${t("academics.colLevel")} ${c.level ?? "—"}`} />
          ))}
        </Card>
      ) : null}
    </>
  );
}

function MarksView({ offeringId }: { offeringId: string }) {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const [componentId, setComponentId] = useState<string | null>(null);
  const [typed, setTyped] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const sheet = useQuery({ queryKey: ["academics", "internal", offeringId], queryFn: async () => internalSheetSchema.parse(unwrap(await api().get(`/api/v1/academics/offerings/${offeringId}/internal`))) });
  const refresh = () => void qc.invalidateQueries({ queryKey: ["academics"] });
  const save = useMutation({
    mutationFn: async (id: string) => {
      const entries = Object.entries(typed)
        .filter(([, v]) => v.trim() !== "")
        .map(([studentMembershipId, v]) => ({ studentMembershipId, marks: /^ab$/i.test(v.trim()) ? null : Number(v.trim()) }));
      return internalMarksResultSchema.parse(unwrap(await api().post(`/api/v1/academics/offerings/${offeringId}/internal/marks`, { componentId: id, entries })));
    },
    onSuccess: () => {
      setNotice({ tone: "ok", text: t("academics.marksSaved") });
      setTyped({});
      refresh();
    },
    onError: (e: Error) => setNotice({ tone: "danger", text: e.message }),
  });
  const act = useMutation({
    mutationFn: async (input: { what: "moderate" | "release" | "lock"; id: string }) => {
      const url = input.what === "lock" ? `/api/v1/academics/offerings/${offeringId}/internal/lock` : `/api/v1/academics/internal/components/${input.id}/${input.what}`;
      return { what: input.what, result: academicsChangedResultSchema.parse(unwrap(await api().post(url, {}))) };
    },
    onSuccess: ({ what }) => {
      setNotice({ tone: "ok", text: t(what === "moderate" ? "academics.moderated" : what === "release" ? "academics.released" : "academics.locked") });
      refresh();
    },
    onError: (e: Error) => setNotice({ tone: "danger", text: e.message }),
  });
  if (sheet.isPending) return <Loading />;
  if (sheet.isError) return <Failed message={sheet.error.message} onRetry={() => void sheet.refetch()} />;
  const s = sheet.data;
  const open = s.components.filter((k) => !k.released);
  const chosen = componentId ?? open[0]?.id ?? null;
  return (
    <View style={{ gap: th.space[3] }}>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      <Card title={t("academics.internalTitle", { max: s.internalMax })}>
        {s.locked ? <Text tone="ok">{t("academics.lockedLine", { name: s.locked.byName ?? "—" })}</Text> : null}
        {s.components.length === 0 ? <Text tone="muted">{t("academics.componentsNone")}</Text> : null}
        {s.components.map((k) => (
          <Row
            key={k.id}
            title={k.name}
            caption={[t(INTERNAL_KIND_KEY[k.kind]!), t("academics.maxWeight", { max: k.maxMarks, weight: k.weight }), k.moderated ? t("academics.countersigned", { name: k.moderatedByName ?? "—" }) : t("academics.notCountersigned"), k.released ? t("academics.releasedBadge") : null].filter(Boolean).join(" · ")}
            right={
              s.canModerate && !k.moderated ? (
                <Button label={t("academics.countersign")} variant="secondary" disabled={act.isPending} onPress={() => act.mutate({ what: "moderate", id: k.id })} />
              ) : s.canRelease && k.moderated && !k.released ? (
                <Button label={t("academics.release")} disabled={act.isPending} onPress={() => act.mutate({ what: "release", id: k.id })} />
              ) : undefined
            }
          />
        ))}
        {s.canLock && s.components.length ? <Button label={t("academics.lockMarks")} variant="secondary" disabled={act.isPending} onPress={() => act.mutate({ what: "lock", id: offeringId })} /> : null}
      </Card>
      {s.canEnter && chosen && s.students.length ? (
        <Card title={t("academics.fieldComponent")}>
          <Chips label={t("academics.fieldComponent")} value={chosen} onChange={setComponentId} options={open.map((k) => ({ value: k.id, label: `${k.name} (${k.maxMarks})` }))} />
          {s.students.map((st) => (
            <Field
              key={st.studentMembershipId}
              label={`${st.rollNumber ?? ""} ${st.name}`.trim()}
              keyboardType="decimal-pad"
              value={typed[st.studentMembershipId] ?? (st.marks[chosen] === undefined ? "" : st.marks[chosen] === null ? "AB" : String(st.marks[chosen]))}
              onChangeText={(v) => setTyped((m) => ({ ...m, [st.studentMembershipId]: v }))}
            />
          ))}
          <Button label={t("academics.saveMarks")} busy={save.isPending} onPress={() => save.mutate(chosen)} />
        </Card>
      ) : null}
    </View>
  );
}
