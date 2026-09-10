import { useState, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  okSchema,
  staffClassesSchema,
  teachingCardsGeneratedSchema,
  teachingCardsPublishedSchema,
  teachingCardsWithdrawnSchema,
  teachingReportCardsSchema,
  type TeachingGenerateCardsBody,
  type TeachingReportCards,
} from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Icon, Loading, Row, Screen, Stat, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { haptics } from "@/lib/haptics";
import { Chips } from "../staff/shared";
import { EXAM_KIND, Pill } from "../family/shared";

/**
 * Report cards, the web's /teacher/classes/[classId]/report-cards: pick the
 * papers, generate the drafts, write a remark on each, then publish — three
 * steps in the order a class teacher does them, each reversible until the
 * last. The drafts exist so somebody reads thirty cards before thirty
 * families do; publishing and withdrawing both ask first. Reached without a
 * class, it asks which one.
 */
type Assessment = TeachingReportCards["assessments"][number];
type CardRow = TeachingReportCards["cards"][number];

export function ReportCardBuilder() {
  const { classId: fromRoute } = useLocalSearchParams<{ classId?: string }>();
  const [picked, setPicked] = useState<string | null>(null);
  const classId = fromRoute || picked;
  return classId ? <Builder classId={classId} /> : <PickClass onPick={setPicked} />;
}

/** No class in the route: the teacher's own classes, one tap each. */
function PickClass({ onPick }: { onPick: (classId: string) => void }) {
  const t = useT();
  const router = useRouter();
  const query = useQuery({
    queryKey: ["staff", "classes"],
    queryFn: async () => staffClassesSchema.parse(unwrap(await api().get("/api/v1/staff/classes"))),
  });
  const d = query.data;
  return (
    <Screen title={t("teacher.reportCards")} description={t("teaching.pickClassForCards")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d && d.classes.length === 0 ? (
        <Empty title={t("teacher.noClassesYet")} icon="chalkboard" action={<Button label={t("nav.classes")} variant="secondary" onPress={() => router.push("/(app)/classes" as never)} />} />
      ) : null}
      {d && d.classes.length > 0 ? (
        <Card title={t("nav.classes")}>
          {d.classes.map((c) => (
            <Row key={c.id} icon="chalkboard" title={c.name} caption={[c.subject, t("classes.onTheRoll", { count: c.students })].filter(Boolean).join(" · ")} onPress={() => onPick(c.id)} />
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}

export function cardsPath(classId: string, title: string | null): string {
  return `/api/v1/teaching/classes/${classId}/report-cards${title ? `?title=${encodeURIComponent(title)}` : ""}`;
}

function Builder({ classId }: { classId: string }) {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const [viewTitle, setViewTitle] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [termId, setTermId] = useState("");
  const [confirming, setConfirming] = useState(false);
  const query = useQuery({
    queryKey: ["teaching", "report-cards", classId, viewTitle],
    placeholderData: keepPreviousData,
    queryFn: async () => teachingReportCardsSchema.parse(unwrap(await api().get(cardsPath(classId, viewTitle)))),
  });
  const d = query.data;
  const refresh = () => qc.invalidateQueries({ queryKey: ["teaching", "report-cards", classId] });

  const title = name ?? d?.selectedTitle ?? "Term 1";
  const generate = useMutation({
    mutationFn: async (body: TeachingGenerateCardsBody) => teachingCardsGeneratedSchema.parse(unwrap(await api().post(`/api/v1/teaching/classes/${classId}/report-cards/generate`, body))),
    onSuccess: async (result, body) => {
      const ready = t("teacher.draftsReady", { count: result.created + result.updated });
      toast.show(result.skippedPublished ? `${ready}. ${t("teacher.skippedPublished", { count: result.skippedPublished })}` : ready);
      setViewTitle(body.title);
      await refresh();
    },
  });
  const publish = useMutation({
    mutationFn: async (setTitle: string) => teachingCardsPublishedSchema.parse(unwrap(await api().post(`/api/v1/teaching/classes/${classId}/report-cards/publish`, { title: setTitle }))),
    onSuccess: async (result) => {
      toast.show(t("teacher.cardsSent", { count: result.published }));
      setConfirming(false);
      await refresh();
    },
  });
  const withdraw = useMutation({
    mutationFn: async (setTitle: string) => teachingCardsWithdrawnSchema.parse(unwrap(await api().post(`/api/v1/teaching/classes/${classId}/report-cards/withdraw`, { title: setTitle }))),
    onSuccess: async (result) => {
      toast.show(t("teacher.withdrawnCount", { count: result.withdrawn }));
      setConfirming(false);
      await refresh();
    },
  });

  // The schedule is the menu: papers under the exam they were scheduled in, one switch per exam.
  const bySeries = new Map<string, { name: string; kind: Assessment["seriesKind"]; papers: Assessment[] }>();
  for (const a of d?.assessments ?? []) {
    const group = bySeries.get(a.seriesId) ?? { name: a.seriesName, kind: a.seriesKind, papers: [] };
    group.papers.push(a);
    bySeries.set(a.seriesId, group);
  }
  const toggle = (id: string) => setPicked((now) => (now.includes(id) ? now.filter((x) => x !== id) : [...now, id]));
  const toggleSeries = (ids: string[]) => setPicked((now) => (ids.every((id) => now.includes(id)) ? now.filter((id) => !ids.includes(id)) : [...now, ...ids.filter((id) => !now.includes(id))]));
  const chooseTerm = (id: string) => {
    setTermId(id);
    const term = d?.terms.find((x) => x.id === id);
    if (term) {
      setName(term.name);
      setPicked((d?.assessments ?? []).filter((a) => a.termId === id).map((a) => a.assignmentId));
    }
  };
  const build = () => generate.mutate({ title: title.trim(), assignmentIds: picked, termId: termId || null });

  const cards = d?.cards ?? [];
  const drafts = cards.filter((c) => c.status === "DRAFT").length;
  const published = cards.length - drafts;
  const selected = d?.selectedTitle ?? null;
  const setWrite = drafts > 0 ? publish : withdraw;

  return (
    <Screen title={t("teacher.reportCards")} description={d?.class.heading} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          {d.titles.length > 1 && selected ? (
            <Chips
              label={t("teacher.reports")}
              value={selected}
              options={d.titles.map((x) => ({ value: x, label: x }))}
              onChange={(next) => {
                setConfirming(false);
                setViewTitle(next);
              }}
            />
          ) : null}

          <Card title={t("teacher.builderStepOne")}>
            <Text variant="xs" tone="muted">
              {t("teacher.builderPickExplainer")}
            </Text>
            {d.assessments.length === 0 ? (
              <Empty title={t("exams.noPapersTitle")} body={t("teacher.noPublishedWork")} action={<Button label={t("nav.exams")} variant="secondary" onPress={() => router.push("/(app)/exams" as never)} />} />
            ) : (
              [...bySeries.entries()].map(([seriesId, group]) => {
                const ids = group.papers.map((p) => p.assignmentId);
                const on = ids.filter((id) => picked.includes(id)).length;
                return (
                  <View key={seriesId} style={{ gap: th.space[1], borderWidth: 1, borderColor: th.border, borderRadius: th.radius.md, padding: th.space[2] }}>
                    <Check title={group.name} caption={`${t(EXAM_KIND[group.kind])} · ${t("teacher.papersN", { count: ids.length })}`} checked={on === ids.length} mixed={on > 0 && on < ids.length} onPress={() => toggleSeries(ids)} />
                    {group.papers.map((p) => (
                      <Check
                        key={p.assignmentId}
                        inset
                        title={p.subject}
                        caption={t("teacher.markedOf", { marked: p.gradedCount, total: p.classSize })}
                        checked={picked.includes(p.assignmentId)}
                        onPress={() => toggle(p.assignmentId)}
                        right={p.gradedCount === 0 ? <Pill label={t("teacher.unmarked")} tone="warn" /> : undefined}
                      />
                    ))}
                  </View>
                );
              })
            )}
          </Card>

          <Card title={t("teacher.builderStepTwo")}>
            {d.terms.length > 0 ? (
              <>
                <Chips
                  label={t("terms.cardTerm")}
                  value={termId}
                  options={[{ value: "", label: t("terms.cardNoTerm") }, ...d.terms.map((x) => ({ value: x.id, label: `${x.name} · ${t("terms.inTerm", { count: d.assessments.filter((a) => a.termId === x.id).length })}` }))]}
                  onChange={chooseTerm}
                />
                <Text variant="xs" tone="subtle">
                  {t("terms.builderTermHint")}
                </Text>
              </>
            ) : null}
            <Field label={t("teacher.reportName")} value={title} onChangeText={setName} editable={termId === ""} maxLength={120} />
            {generate.isError ? <Failed message={generate.error.message} onRetry={build} /> : null}
            <Button label={t("teacher.generateForClass")} icon={<Icon name="star" size={18} color={th.accentFg} weight="bold" />} busy={generate.isPending} disabled={picked.length === 0 || title.trim().length < 2} onPress={build} />
          </Card>

          {cards.length > 0 && selected ? (
            <Card title={t("teaching.builderStepThree", { title: selected })}>
              <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
                <Stat label={t("teacher.draft")} value={drafts} tone={drafts > 0 ? "warn" : "fg"} />
                <Stat label={t("teacher.published")} value={published} tone={published > 0 ? "ok" : "fg"} />
              </View>
              <Text variant="xs" tone="muted">
                {t("teaching.familiesSeeNothing")}
              </Text>
              {setWrite.isError ? <Failed message={setWrite.error.message} onRetry={() => setWrite.mutate(selected)} /> : null}
              {confirming ? (
                <View style={{ gap: th.space[2], padding: th.space[3], borderRadius: th.radius.md, backgroundColor: drafts > 0 ? th.accentSoft : th.warnSoft }}>
                  <Text variant="sm" bold tone={drafts > 0 ? "accent" : "warn"}>
                    {drafts > 0 ? t("teaching.publishCardsConfirm", { count: drafts }) : t("teaching.withdrawCardsConfirm")}
                  </Text>
                  <View style={{ flexDirection: "row", gap: th.space[2], flexWrap: "wrap" }}>
                    <Button label={t("common.cancel")} variant="secondary" disabled={setWrite.isPending} onPress={() => setConfirming(false)} style={{ flexGrow: 1 }} />
                    <Button label={drafts > 0 ? t("common.confirm") : t("teacher.withdrawAll")} variant={drafts > 0 ? "primary" : "danger"} busy={setWrite.isPending} onPress={() => setWrite.mutate(selected)} style={{ flexGrow: 1 }} />
                  </View>
                </View>
              ) : drafts > 0 ? (
                <Button label={t("teacher.publishAllCount", { count: drafts })} icon={<Icon name="paperPlane" size={18} color={th.accentFg} weight="bold" />} onPress={() => setConfirming(true)} />
              ) : (
                <Button label={t("teacher.withdrawAll")} variant="secondary" onPress={() => setConfirming(true)} />
              )}
              {cards.map((card) => (
                <CardEditor key={card.id} card={card} classId={classId} onSaved={refresh} />
              ))}
            </Card>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

/** One pupil's card: the figures, the status, and on a draft the class teacher's remark with its own save. */
function CardEditor({ card, classId, onSaved }: { card: CardRow; classId: string; onSaved: () => Promise<unknown> }) {
  const t = useT();
  const th = useTheme();
  const toast = useToast();
  const [remark, setRemark] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: async (text: string) => okSchema.parse(unwrap(await api().post(`/api/v1/teaching/classes/${classId}/report-cards/remark`, { cardId: card.id, remark: text }))),
    onSuccess: async () => {
      toast.show(t("teaching.remarkSaved"));
      await onSaved();
      setRemark(null);
    },
  });
  const percent = card.overallPercentMilli === null ? t("teacher.noMarksYetShort") : `${(card.overallPercentMilli / 1000).toFixed(1)}%`;
  const days = card.attendanceTotal > 0 ? ` · ${t("teaching.daysPresent", { present: card.attendancePresent, total: card.attendanceTotal })}` : "";
  const draft = card.status === "DRAFT";
  const text = remark ?? card.remark ?? "";
  const changed = remark !== null && remark.trim() !== (card.remark ?? "").trim();
  return (
    <View style={{ gap: th.space[2], borderTopWidth: 1, borderColor: th.border, paddingTop: th.space[2] }}>
      <Row title={card.studentName} caption={`${percent}${days}`} right={<Pill label={draft ? t("teacher.draft") : t("teacher.published")} tone={draft ? "warn" : "ok"} />} />
      {draft ? (
        <>
          <Field
            label={t("teaching.remarkFor", { name: card.studentName })}
            value={text}
            onChangeText={setRemark}
            placeholder={t("teacher.remarkPlaceholder")}
            maxLength={2000}
            multiline
            style={{ minHeight: th.space[12] * 2, textAlignVertical: "top", paddingTop: th.space[3] }}
          />
          {save.isError ? <Failed message={save.error.message} onRetry={() => save.mutate(text)} /> : null}
          {changed ? <Button label={t("teaching.saveRemark")} variant="secondary" busy={save.isPending} onPress={() => save.mutate(text)} /> : null}
        </>
      ) : card.remark ? (
        <Text variant="sm" tone="muted">
          {card.remark}
        </Text>
      ) : null}
    </View>
  );
}

/** A named checkbox at the tap height: a whole exam, or one paper under it. */
function Check({ title, caption, checked, mixed, inset, right, onPress }: { title: string; caption: string; checked: boolean; mixed?: boolean; inset?: boolean; right?: ReactNode; onPress: () => void }) {
  const th = useTheme();
  const on = checked || mixed;
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={`${title}, ${caption}`}
      accessibilityState={{ checked: mixed ? "mixed" : checked }}
      aria-checked={mixed ? "mixed" : checked}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={({ pressed }) => ({ minHeight: th.tap, flexDirection: "row", alignItems: "center", gap: th.space[3], paddingLeft: inset ? th.space[6] : th.space[1], opacity: pressed ? 0.7 : 1 })}
    >
      <View style={{ width: th.space[6], height: th.space[6], borderRadius: th.radius.sm, borderWidth: 2, borderColor: on ? th.accent : th.border, backgroundColor: checked ? th.accent : th.surface, alignItems: "center", justifyContent: "center" }}>
        {checked ? <Icon name="check" size={16} color={th.accentFg} weight="bold" /> : mixed ? <View style={{ width: th.space[3], height: 2, backgroundColor: th.accent }} /> : null}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant={inset ? "sm" : "base"} bold>
          {title}
        </Text>
        <Text variant="xs" tone="muted">
          {caption}
        </Text>
      </View>
      {right}
    </Pressable>
  );
}
