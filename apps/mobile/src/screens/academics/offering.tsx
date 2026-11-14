import { useState } from "react";
import { Linking, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { academicsChangedResultSchema, courseFileSchema, internalMarksResultSchema, internalSheetSchema, type CourseFile } from "@edulink/contracts";
import { Button, Card, Failed, Field, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { openFile } from "@/lib/open-file";
import { unwrap } from "@/lib/query";
import { webLinkOrNull } from "@/lib/links";
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
  // A stored file opens through a five-minute link the API signs (TA-339): the phone's browser has no token of its own.
  const [fileError, setFileError] = useState<string | null>(null);
  const openStored = (fileId: string) => {
    setFileError(null);
    void openFile(fileId, t("common.tryAgain")).then((error) => {
      if (error) setFileError(error);
    });
  };
  return (
    <>
      {fileError ? <Notice tone="danger" text={fileError} /> : null}
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
        {f.items.map((i) => {
          // Only a web link opens; a stored intent:, sms: or javascript: link opens nothing (PH-7).
          const link = webLinkOrNull(i.url);
          return (
            <Row
              key={i.id}
              title={i.title}
              caption={[t(ITEM_KEY[i.kind]!), i.coCodes.join(", ")].filter(Boolean).join(" · ")}
              onPress={link ? () => void Linking.openURL(link) : i.fileId ? () => openStored(i.fileId!) : undefined}
            />
          );
        })}
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
  // What was typed, by component and then by student (TA-154): choosing another component shows its own stored marks, and Save never writes one component's typing to another.
  const [typed, setTyped] = useState<Record<string, Record<string, string>>>({});
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const sheet = useQuery({ queryKey: ["academics", "internal", offeringId], queryFn: async () => internalSheetSchema.parse(unwrap(await api().get(`/api/v1/academics/offerings/${offeringId}/internal`))) });
  const refresh = () => void qc.invalidateQueries({ queryKey: ["academics"] });
  const save = useMutation({
    mutationFn: async (input: { id: string; max: number }) => {
      const rows = Object.entries(typed[input.id] ?? {}).filter(([, v]) => v.trim() !== "");
      // A mark that is not a mark is never sent (TA-056): Number("7..5") is NaN, which JSON writes as null, and null is absent.
      if (rows.some(([, v]) => markTypingProblem(v, input.max))) throw new Error(t("academics.markInvalid", { max: input.max }));
      const entries = rows.map(([studentMembershipId, v]) => ({ studentMembershipId, marks: /^ab$/i.test(v.trim()) ? null : Number(v.trim()) }));
      return internalMarksResultSchema.parse(unwrap(await api().post(`/api/v1/academics/offerings/${offeringId}/internal/marks`, { componentId: input.id, entries })));
    },
    onSuccess: (_r, input) => {
      setNotice({ tone: "ok", text: t("academics.marksSaved") });
      setTyped((m) => {
        const next = { ...m };
        delete next[input.id];
        return next;
      });
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
  const chosenMax = s.components.find((k) => k.id === chosen)?.maxMarks ?? 0;
  const typedHere = chosen ? (typed[chosen] ?? {}) : {};
  const typedCount = Object.values(typedHere).filter((v) => v.trim() !== "").length;
  const anyInvalid = Object.values(typedHere).some((v) => markTypingProblem(v, chosenMax));
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
              value={typedHere[st.studentMembershipId] ?? (st.marks[chosen] === undefined ? "" : st.marks[chosen] === null ? "AB" : String(st.marks[chosen]))}
              error={markTypingProblem(typedHere[st.studentMembershipId] ?? "", chosenMax) ? t("academics.markInvalid", { max: chosenMax }) : undefined}
              onChangeText={(v) => setTyped((m) => ({ ...m, [chosen]: { ...(m[chosen] ?? {}), [st.studentMembershipId]: v } }))}
            />
          ))}
          <Button label={t("academics.saveMarks")} busy={save.isPending} disabled={typedCount === 0 || anyInvalid} onPress={() => save.mutate({ id: chosen, max: chosenMax })} />
        </Card>
      ) : null}
    </View>
  );
}

/**
 * Whether typed text is not a mark the sheet can take (TA-056): blank is
 * nothing typed and AB is absent; anything else must be a number with at most
 * one decimal place, from nought to the component's maximum. "7..5", "7,5" or
 * "." are refused here rather than sent as NaN, which JSON writes as null,
 * the server's absent.
 */
export function markTypingProblem(raw: string, max: number): boolean {
  const v = raw.trim();
  if (v === "" || /^ab$/i.test(v)) return false;
  if (!/^\d+(\.\d)?$/.test(v)) return true;
  return Number(v) > max;
}
