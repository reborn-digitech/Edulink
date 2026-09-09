import { useRef, useState, type RefObject } from "react";
import { TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminExamsSchema, examSeriesCreatedSchema, okSchema, staffExamSheetsSchema, type AdminExams as AdminExamsData } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Stat, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useRole } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { EXAM_KIND, formatTimeRange, hhmm, Pill, type ExamKind } from "../family/shared";
import { Chips, formatDateKey, Notice, openWeb } from "./shared";

type Kind = "" | ExamKind;
type State = "" | "draft" | "published";
type Series = AdminExamsData["series"][number];
export type SeriesCreateBody = { name: string; gradeLevel: string; kind: ExamKind; termId?: string | null };
export type SlotCreateBody = { subject: string; dateKey: string; maxMarks: number };

const KINDS: ExamKind[] = ["UNIT_TEST", "MID_TERM", "FINAL"];
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

function kindLabel(t: ReturnType<typeof useT>, kind: string): string {
  const key = EXAM_KIND[kind as ExamKind];
  return key ? t(key) : kind;
}

function paperTime(start: number | null, end: number | null): string {
  if (start === null) return "—";
  return end === null ? hhmm(start) : formatTimeRange(start, end);
}

function examsQuery(kind: Kind, state: State, grade: string): string {
  const p = new URLSearchParams();
  if (kind) p.set("kind", kind);
  if (state) p.set("state", state);
  if (grade) p.set("grade", grade);
  const s = p.toString();
  return s ? `?${s}` : "";
}

/**
 * The exam office — the web's /admin/exams: one series per grade per term, a
 * dated paper per subject; publishing puts the sheet in front of pupils and
 * families, after a confirm. Creating a series and adding a paper happen
 * here; archiving, times and "even if the school is closed" are the web's.
 */
export function AdminExams() {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const [kind, setKind] = useState<Kind>("");
  const [state, setState] = useState<State>("");
  const [grade, setGrade] = useState("");
  const [notice, setNotice] = useState<{ text: string; tone: "ok" | "danger" } | null>(null);
  /** Bumped when a series lands, so the form starts blank again — and only then. */
  const [formKey, setFormKey] = useState(0);
  const nameRef = useRef<TextInput>(null);
  const query = useQuery({
    queryKey: ["admin", "exams", kind, state, grade],
    placeholderData: keepPreviousData,
    queryFn: async () => adminExamsSchema.parse(unwrap(await api().get(`/api/v1/admin/exams${examsQuery(kind, state, grade)}`))),
  });
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin", "exams"] });
    void qc.invalidateQueries({ queryKey: ["admin", "overview"] });
  };
  const create = useMutation({
    mutationFn: async (body: SeriesCreateBody) => examSeriesCreatedSchema.parse(unwrap(await api().post("/api/v1/admin/exams", body))),
    onSuccess: (_r, body) => {
      setNotice({ tone: "ok", text: `${t("exams.createSeries")}: ${body.name}` });
      setFormKey((k) => k + 1);
      refresh();
    },
    onError: (e) => setNotice({ tone: "danger", text: e.message }),
  });
  const publish = useMutation({
    mutationFn: async (seriesId: string) => okSchema.parse(unwrap(await api().post(`/api/v1/admin/exams/${seriesId}/publish`))),
    onSuccess: () => {
      setNotice({ tone: "ok", text: t("exams.publishedHint") });
      refresh();
    },
    onError: (e) => setNotice({ tone: "danger", text: e.message }),
  });
  const addSlot = useMutation({
    mutationFn: async (input: { seriesId: string; body: SlotCreateBody }) => okSchema.parse(unwrap(await api().post(`/api/v1/admin/exams/${input.seriesId}/slots`, input.body))),
    onSuccess: (_r, input) => {
      setNotice({ tone: "ok", text: `${t("exams.addPaper")}: ${input.body.subject}` });
      refresh();
    },
    onError: (e) => setNotice({ tone: "danger", text: e.message }),
  });
  const d = query.data;
  const filtered = Boolean(kind || state || grade);
  const clear = () => {
    setKind("");
    setState("");
    setGrade("");
  };
  return (
    <Screen title={t("exams.adminTitle")} description={t("exams.adminIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
            <Stat label={t("exams.adminTitle")} value={d.total} />
            <Stat label={t("exams.published")} value={d.series.filter((s) => s.publishedAt).length} tone="ok" />
          </View>
          {d.total > 0 ? (
            <>
              <Chips label={t("exams.kindFilterLabel")} value={kind} options={[{ value: "" as Kind, label: t("exams.allKinds") }, ...KINDS.map((k) => ({ value: k as Kind, label: t(EXAM_KIND[k]) }))]} onChange={setKind} />
              <Chips
                label={t("exams.stateFilterLabel")}
                value={state}
                options={[
                  { value: "", label: t("vacancies.filterAll") },
                  { value: "draft", label: t("exams.draftLabel") },
                  { value: "published", label: t("exams.published") },
                ]}
                onChange={setState}
              />
              {d.grades.length > 0 ? <Chips label={t("exams.fieldGrade")} value={grade} options={[{ value: "", label: t("exams.allGrades") }, ...d.grades.map((g) => ({ value: g, label: t("practice.classN", { n: g }) }))]} onChange={setGrade} /> : null}
            </>
          ) : null}
          {d.series.length === 0 ? (
            <Empty
              title={filtered ? t("common.noResultsTitle") : t("exams.noneYet")}
              body={filtered ? t("common.noResultsBody") : t("exams.newSeriesHint")}
              action={filtered ? <Button label={t("common.clearAll")} variant="secondary" onPress={clear} /> : <Button label={t("exams.newSeriesTitle")} variant="secondary" onPress={() => nameRef.current?.focus()} />}
            />
          ) : (
            d.series.map((s) => <SeriesCard key={s.id} series={s} publishing={publish.isPending && publish.variables === s.id} adding={addSlot.isPending && addSlot.variables?.seriesId === s.id} onPublish={() => publish.mutate(s.id)} onAddSlot={(body) => addSlot.mutate({ seriesId: s.id, body })} />)
          )}
          <CreateSeries key={formKey} nameRef={nameRef} grades={d.grades} terms={d.terms} busy={create.isPending} onCreate={(body) => create.mutate(body)} />
        </>
      ) : null}
    </Screen>
  );
}

function SeriesCard({ series: s, publishing, adding, onPublish, onAddSlot }: { series: Series; publishing: boolean; adding: boolean; onPublish: () => void; onAddSlot: (body: SlotCreateBody) => void }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const [confirming, setConfirming] = useState(false);
  const [addingPaper, setAddingPaper] = useState(false);
  return (
    <Card title={[s.name, kindLabel(t, s.kind), t("practice.classN", { n: s.gradeLevel }), s.term?.name].filter(Boolean).join(" · ")} action={s.publishedAt ? <Pill label={t("exams.published")} tone="ok" /> : <Pill label={t("exams.draftLabel")} tone="warn" />}>
      <Text variant="xs" tone="subtle">
        {s.publishedAt ? t("exams.publishedHint") : t("exams.draftHint")}
      </Text>
      {s.slots.map((slot) => (
        <Row key={slot.id} title={slot.subject} caption={`${formatDateKey(slot.dateKey, locale)} · ${paperTime(slot.startMinute, slot.endMinute)}`} right={<Text variant="sm" tone="muted">{`${t("exams.colMaxMarks")} ${slot.maxMarks}`}</Text>} />
      ))}
      {addingPaper ? <AddPaper busy={adding} onAdd={onAddSlot} onCancel={() => setAddingPaper(false)} /> : <Button label={t("exams.addPaper")} variant="secondary" onPress={() => setAddingPaper(true)} />}
      <View style={{ flexDirection: "row", gap: th.space[2], flexWrap: "wrap" }}>
        {s.publishedAt ? null : confirming ? (
          <>
            <Button label={t("common.confirm")} busy={publishing} onPress={onPublish} style={{ flexGrow: 1 }} accessibilityLabel={`${t("exams.publish")}: ${s.name}`} />
            <Button label={t("common.cancel")} variant="ghost" onPress={() => setConfirming(false)} />
          </>
        ) : (
          <Button label={t("exams.publish")} disabled={s.slots.length === 0} onPress={() => setConfirming(true)} style={{ flexGrow: 1 }} />
        )}
        <Button label={t("exams.archive")} variant="secondary" onPress={() => openWeb("/admin/exams")} />
      </View>
    </Card>
  );
}

function AddPaper({ busy, onAdd, onCancel }: { busy: boolean; onAdd: (body: SlotCreateBody) => void; onCancel: () => void }) {
  const t = useT();
  const th = useTheme();
  const [subject, setSubject] = useState("");
  const [dateKey, setDateKey] = useState("");
  const [maxMarks, setMaxMarks] = useState("80");
  const marks = Number(maxMarks);
  const validDate = DATE_KEY.test(dateKey);
  const validMarks = Number.isFinite(marks) && marks > 0 && marks <= 1000;
  return (
    <View style={{ backgroundColor: th.surfaceMuted, borderRadius: th.radius.md, padding: th.space[3], gap: th.space[3] }}>
      <Text variant="sm" bold>
        {t("exams.addPaper")}
      </Text>
      <Field label={t("exams.colSubject")} value={subject} onChangeText={setSubject} maxLength={80} />
      <Field label={t("exams.colDay")} value={dateKey} onChangeText={setDateKey} hint="YYYY-MM-DD" error={dateKey && !validDate ? t("leaveKind.giveBothDates") : null} autoCapitalize="none" keyboardType="numbers-and-punctuation" />
      <Field label={t("exams.colMaxMarks")} value={maxMarks} onChangeText={setMaxMarks} keyboardType="decimal-pad" />
      <View style={{ flexDirection: "row", gap: th.space[2] }}>
        <Button label={t("exams.addPaper")} busy={busy} disabled={!subject.trim() || !validDate || !validMarks} onPress={() => onAdd({ subject: subject.trim(), dateKey, maxMarks: marks })} style={{ flexGrow: 1 }} />
        <Button label={t("common.cancel")} variant="ghost" onPress={onCancel} />
      </View>
    </View>
  );
}

function CreateSeries({ nameRef, grades, terms, busy, onCreate }: { nameRef: RefObject<TextInput | null>; grades: string[]; terms: AdminExamsData["terms"]; busy: boolean; onCreate: (body: SeriesCreateBody) => void }) {
  const t = useT();
  const [name, setName] = useState("");
  const [grade, setGrade] = useState(grades[0] ?? "");
  const [kind, setKind] = useState<ExamKind>("UNIT_TEST");
  const [termId, setTermId] = useState(terms.find((x) => x.current)?.id ?? "");
  return (
    <Card title={t("exams.newSeriesTitle")}>
      <Text variant="xs" tone="subtle">
        {t("exams.newSeriesHint")}
      </Text>
      <Field ref={nameRef} label={t("exams.fieldName")} value={name} onChangeText={setName} placeholder={t("exams.namePlaceholder")} maxLength={120} />
      {grades.length > 0 ? <Chips label={t("exams.fieldGrade")} value={grade} options={grades.map((g) => ({ value: g, label: t("practice.classN", { n: g }) }))} onChange={setGrade} /> : <Field label={t("exams.fieldGrade")} value={grade} onChangeText={setGrade} maxLength={20} />}
      <Chips label={t("exams.fieldKind")} value={kind} options={KINDS.map((k) => ({ value: k, label: t(EXAM_KIND[k]) }))} onChange={setKind} />
      {terms.length > 0 ? <Chips label={t("terms.examTerm")} value={termId} options={[{ value: "", label: t("terms.examNoTerm") }, ...terms.map((x) => ({ value: x.id, label: x.name }))]} onChange={setTermId} /> : null}
      <Button label={t("exams.createSeries")} busy={busy} disabled={name.trim().length < 2 || !grade.trim()} onPress={() => onCreate({ name: name.trim(), gradeLevel: grade.trim(), kind, termId: termId || null })} />
    </Card>
  );
}

/**
 * The head's exams — the web's /exams for staff: every published date sheet,
 * and the classes whose report cards may be built, with how many are out.
 * Building a card is the class teacher's page on the web.
 */
export function PrincipalExams() {
  const t = useT();
  const th = useTheme();
  const role = useRole();
  const router = useRouter();
  const { locale } = useLocale();
  const [tab, setTab] = useState<"sheet" | "cards">("sheet");
  const query = useQuery({
    queryKey: ["staff", "exams", "sheets"],
    queryFn: async () => staffExamSheetsSchema.parse(unwrap(await api().get("/api/v1/staff/exams/sheets"))),
  });
  const d = query.data;
  const multiSchool = d ? new Set(d.sheets.map((s) => s.schoolName)).size > 1 : false;
  return (
    <Screen title={t("nav.exams")} description={t("exams.sheetIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
            <Stat label={t("exams.tabDateSheet")} value={d.sheets.length} />
            <Stat label={t("exams.tabCards")} value={d.classes.reduce((n, c) => n + c.publishedCards, 0)} tone="ok" />
          </View>
          <Chips
            label={t("nav.exams")}
            value={tab}
            options={[
              { value: "sheet", label: t("exams.tabDateSheet") },
              { value: "cards", label: t("exams.tabCards") },
            ]}
            onChange={setTab}
          />
          {tab === "sheet" ? (
            d.sheets.length === 0 ? (
              <Empty title={t("exams.sheetEmptyTitle")} body={t("exams.sheetEmptyBody")} action={role === "ADMIN" ? <Button label={t("exams.scheduleExams")} variant="secondary" onPress={() => openWeb("/admin/exams")} /> : <Button label={t("nav.classes")} variant="secondary" onPress={() => router.push("/(app)/classes" as never)} />} />
            ) : (
              d.sheets.map((sheet) => (
                <Card key={sheet.id} title={`${sheet.name} · ${t("practice.classN", { n: sheet.gradeLevel })}`} action={<Text variant="xs" tone="muted">{[t(EXAM_KIND[sheet.kind]), multiSchool ? sheet.schoolName : null].filter(Boolean).join(" · ")}</Text>}>
                  {sheet.slots.map((slot) => (
                    <Row key={slot.id} title={slot.subject} caption={`${formatDateKey(slot.dateKey, locale)} · ${paperTime(slot.startMinute, slot.endMinute)}`} right={<Text variant="sm" tone="muted">{`${t("exams.colMaxMarks")} ${slot.maxMarks}`}</Text>} />
                  ))}
                </Card>
              ))
            )
          ) : d.classes.length === 0 ? (
            <Empty title={t("exams.noClassesForCards")} body={t("exams.noClassesForCardsBody")} action={<Button label={t("nav.classes")} variant="secondary" onPress={() => router.push("/(app)/classes" as never)} />} />
          ) : (
            <Card title={t("exams.tabCards")}>
              {d.classes.map((klass) => (
                <Row key={klass.id} title={klass.name} caption={klass.publishedCards === 1 ? t("exams.cardsIssuedOne") : t("exams.cardsIssuedMany", { count: klass.publishedCards })} onPress={() => openWeb(`/teacher/classes/${klass.id}/report-cards`)} />
              ))}
            </Card>
          )}
        </>
      ) : null}
    </Screen>
  );
}
