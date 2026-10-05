import { useState, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  corpsDeskSchema,
  examSquadDeskSchema,
  labDeskSchema,
  LESSON_GRADES,
  practicalSheetSchema,
  researchDeskSchema,
  RESEARCH_KINDS,
  streamRecordsCountSchema,
  streamRecordsIdSchema,
  teachingPracticeDeskSchema,
  type CorpsCode,
  type CorpsDesk,
  type DutyCode,
  type RoleCode,
  type SchoolModuleCode,
  type TeachingPracticeDesk,
} from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Stat, SwitchRow, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { usePrivateScreen } from "@/lib/private-screen";
import { useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { Chips, MultiChips } from "../staff/shared";
import { formatDateKey } from "../family/shared";
import { todayKey } from "../teacher/support";
import { formatDate, formatDateTime } from "@/lib/dates";

/**
 * THE DUTIES' DESKS ON THE PHONE (5 Oct 2026), the web's /duties/<x> pages and
 * the practical record: the lab in-charge's desk, teaching practice, the NSS
 * and NCC units, the research dean's read and the exam flying squad, each
 * guarded as AntiRaggingScreen is (duties.tsx) — a FACULTY or HOD holding the
 * duty, or the office and the head (and the exam controller for the squad),
 * while the duty's module is on — and the practical record a course's teacher
 * keeps and signs. Every write is one POST through useMutation, a toast and a
 * refetch; the server decides who may write and says so in the answer
 * (canWrite, canSign, canObserve, canEdit), so the phone only draws the forms
 * it is told to.
 */

type T = ReturnType<typeof useT>;

/** Who reads a desk: the readers by role, or a FACULTY or HOD holding the duty (any FACULTY or HOD when `duty` is null). */
function useDeskGuard(duty: DutyCode | null, module: SchoolModuleCode, readers: readonly RoleCode[]) {
  const session = useSession();
  const me = session.status === "signed-in" ? session.me : null;
  const role = me?.active.role ?? null;
  const teacher = role === "FACULTY" || role === "HOD";
  const holder = teacher && (duty === null || (me?.duties ?? []).includes(duty));
  const holds = holder || (role !== null && readers.includes(role));
  const on = (me?.modules ?? []).includes(module);
  return { holds, on, holder };
}

/** The refusal in place of a desk: who it is for, or that the module is off. Nothing is asked of the server. */
function Refused({ title, body, icon }: { title: string; body: string; icon: string }) {
  const t = useT();
  const router = useRouter();
  return (
    <Screen title={title}>
      <Empty icon={icon} title={title} body={body} action={<Button label={t("nav.more")} variant="secondary" onPress={() => router.push("/(app)/more" as never)} />} />
    </Screen>
  );
}

function refusal(guard: { holds: boolean; on: boolean }, title: string, t: T, notHeld: TranslationKey = "duties.refuseNoDuty", icon = "shield"): ReactNode {
  if (!guard.holds) return <Refused title={title} body={t(notHeld)} icon={icon} />;
  if (!guard.on) return <Refused title={title} body={t("duties.moduleOff")} icon="puzzle" />;
  return null;
}

function StatRow({ children }: { children: ReactNode }) {
  const th = useTheme();
  return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>{children}</View>;
}

/** A row that ticks on and off: a checkbox at least the tap height. */
function Tick({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  const th = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      aria-checked={on}
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
      onPress={onToggle}
      style={({ pressed }) => ({ minHeight: th.tap, flexDirection: "row", alignItems: "center", gap: th.space[2], paddingHorizontal: th.space[3], borderRadius: th.radius.md, borderWidth: 1, borderColor: on ? th.accent : th.border, backgroundColor: on ? th.accentSoft : th.surface, opacity: pressed ? 0.8 : 1 })}
    >
      <Text variant="sm" bold={on} tone={on ? "accent" : "fg"} style={{ flex: 1 }}>
        {label}
      </Text>
    </Pressable>
  );
}

function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

/** A write's mutation: the server's sentence as a danger toast, the saved sentence and a refetch on success. */
function useWrite<A, R>(fn: (args: A) => Promise<R>, saved: (r: R) => string, refetch: () => unknown) {
  const toast = useToast();
  return useMutation({
    mutationFn: fn,
    onSuccess: (r: R) => {
      toast.show(saved(r), "ok");
      void refetch();
    },
    onError: (e: Error) => toast.show(e.message, "danger"),
  });
}

/** "2026-10-05T09:30:00Z" as the reader's day and time on the device's clock; the ISO text if it cannot be read. */
function when(iso: string, _locale?: string): string {
  return formatDateTime(iso);
}

/* ----------------------------------------------------------- sign rows */

/** Unsigned practical-record rows, ticked by default, and one action that signs the ticked ones. */
function SignRows({ rows, line, onSigned }: { rows: { id: string }[]; line: (row: { id: string }) => string; onSigned: () => unknown }) {
  const t = useT();
  const th = useTheme();
  const [off, setOff] = useState<string[]>([]);
  const ticked = rows.map((r) => r.id).filter((id) => !off.includes(id));
  const sign = useWrite(
    async (recordIds: string[]) => streamRecordsCountSchema.parse(unwrap(await api().post("/api/v1/stream-records/practicals/sign", { recordIds }))),
    (r) => t(r.count > 0 ? "streamRecords.practicalSigned" : "streamRecords.nothingToSign"),
    onSigned,
  );
  return (
    <View style={{ gap: th.space[2] }}>
      {rows.map((r) => (
        <Tick key={r.id} label={line(r)} on={ticked.includes(r.id)} onToggle={() => setOff((o) => toggle(o, r.id))} />
      ))}
      <Button label={t("streamRecords.practicals.sign")} variant="secondary" busy={sign.isPending} disabled={ticked.length === 0} onPress={() => sign.mutate(ticked)} />
    </View>
  );
}

/* --------------------------------------------------------------- the lab */

/** The lab in-charge's desk: GET /api/v1/duties/lab. The labs and their stock, the batch rosters, the rows to sign (a holder signs them here), the breakage log. */
export function LabDeskScreen() {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const guard = useDeskGuard("LAB_INCHARGE", "ACADEMICS", ["ADMIN", "PRINCIPAL"]);
  const desk = useQuery({ queryKey: ["duties", "lab"], enabled: guard.holds && guard.on, queryFn: async () => labDeskSchema.parse(unwrap(await api().get("/api/v1/duties/lab"))) });
  const title = t("duties.lab.title");
  const refused = refusal(guard, title, t);
  if (refused) return refused;
  const d = desk.data;
  return (
    <Screen title={title} description={t("duties.lab.intro")} refreshing={desk.isRefetching} onRefresh={() => void desk.refetch()}>
      {desk.isPending ? <Loading /> : null}
      {desk.isError ? <Failed message={desk.error.message} onRetry={() => void desk.refetch()} /> : null}
      {d ? (
        <>
          <StatRow>
            <Stat label={t("duties.lab.statLabs")} value={d.labs.length} />
            <Stat label={t("duties.lab.statBatches")} value={d.divisions.reduce((a, x) => a + x.batches.length, 0)} />
            <Stat label={t("duties.lab.statToSign")} value={d.toSign.length} tone={d.toSign.length ? "warn" : "ok"} />
            <Stat label={t("duties.lab.statBreakages")} value={d.breakages.length} />
          </StatRow>
          <Card title={t("duties.lab.labsTitle")}>
            <Text variant="sm" tone="muted">
              {t(d.inventoryOn ? "duties.lab.labsBody" : "duties.lab.labsNoStores")}
            </Text>
            {d.labs.length === 0 ? <Text tone="muted">{t("duties.lab.noLabsBody")}</Text> : null}
            {d.labs.map((lab) => (
              <Row
                key={lab.roomId}
                icon="lightbulb"
                title={`${lab.name} · ${t("duties.lab.seats", { count: lab.capacity })}`}
                caption={
                  d.inventoryOn
                    ? [...lab.stock.map((s) => t("duties.lab.stockLine", { name: s.itemName, code: s.itemCode, quantity: s.quantity, unit: s.unit })), ...lab.assets.map((a) => t("duties.lab.assetLine", { tag: a.tagNumber, name: a.name }))].join("\n") || t("duties.lab.nothingKept")
                    : undefined
                }
              />
            ))}
          </Card>
          <Card title={t("duties.lab.batchesTitle")}>
            {d.divisions.length === 0 ? <Text tone="muted">{t("duties.lab.noBatches")}</Text> : null}
            {d.divisions.map((div) => (
              <Row
                key={div.divisionId}
                icon="users"
                title={div.name}
                caption={[
                  div.batches.map((b) => t("duties.lab.batchLine", { name: b.name, names: b.members.map((m) => m.name).join(", ") || "—" })).join("\n") || t("streamRecords.batches.none"),
                  // The day a re-split made now takes effect (R-24, risks batch 5 Oct 2026); absent from a read that does not carry it.
                  typeof div.changesFrom === "string" ? t("riskDecisions.labChangesFrom", { date: formatDateKey(div.changesFrom, locale) }) : div.changesFrom === null ? t("riskDecisions.labChangesFromStart") : null,
                ]
                  .filter(Boolean)
                  .join("\n")}
              />
            ))}
          </Card>
          <Card title={t("duties.lab.signTitle")}>
            <Text variant="sm" tone="muted">
              {t("duties.lab.signBody")}
            </Text>
            {d.toSign.length === 0 ? <Text tone="muted">{t("duties.lab.nothingToSign")}</Text> : null}
            {d.toSign.length > 0 && guard.holder ? (
              <SignRows rows={d.toSign} line={(row) => labSignLine(t, d.toSign.find((x) => x.id === row.id)!)} onSigned={() => desk.refetch()} />
            ) : null}
            {d.toSign.length > 0 && !guard.holder ? d.toSign.map((r) => <Row key={r.id} title={labSignLine(t, r)} />) : null}
            {guard.holder ? <Button label={t("duties.lab.openRecord")} variant="ghost" onPress={() => router.push("/(app)/practicals" as never)} /> : null}
          </Card>
          <Card title={t("duties.lab.breakageTitle")}>
            <Text variant="sm" tone="muted">
              {t(d.inventoryOn ? "duties.lab.breakageBody" : "duties.lab.breakageNoStores")}
            </Text>
            {d.inventoryOn && d.breakages.length === 0 ? <Text tone="muted">{t("duties.lab.noBreakages")}</Text> : null}
            {d.breakages.map((b) => (
              <Row key={b.id} title={`${b.itemName} (${b.itemCode}) · ${b.quantity}`} caption={[formatDate(b.at), b.location, b.note, b.byName].filter(Boolean).join(" · ")} />
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

function labSignLine(t: T, r: { courseCode: string; experimentNo: number; title: string; studentName: string; performedOn: string }): string {
  return t("duties.lab.signLine", { course: r.courseCode, n: r.experimentNo, title: r.title, student: r.studentName, day: formatDate(r.performedOn) });
}

/* ------------------------------------------------- the practical record */

/** The practical record: GET /api/v1/stream-records/practicals. The courses with practicals as chips, one course's record by student, a form for the next experiment (canWrite) and the rows to sign (canSign). */
export function PracticalsScreen() {
  const t = useT();
  const router = useRouter();
  const guard = useDeskGuard(null, "ACADEMICS", ["ADMIN", "PRINCIPAL"]);
  const [offeringId, setOfferingId] = useState<string | null>(null);
  const sheet = useQuery({
    queryKey: ["stream-records", "practicals", offeringId ?? "first"],
    enabled: guard.holds && guard.on,
    queryFn: async () => practicalSheetSchema.parse(unwrap(await api().get(`/api/v1/stream-records/practicals${offeringId ? `?offeringId=${offeringId}` : ""}`))),
  });
  const title = t("streamRecords.practicals.title");
  const refused = refusal(guard, title, t, "streamRecords.refuseNotYourOffering", "clipboard");
  if (refused) return refused;
  const s = sheet.data;
  const offering = s?.offerings.find((o) => o.offeringId === s.offeringId) ?? null;
  const experiments = s ? [...new Set(s.records.map((r) => r.experimentNo))].sort((a, b) => a - b) : [];
  const unsigned = s ? s.records.filter((r) => !r.signed) : [];
  return (
    <Screen title={title} description={t("streamRecords.practicals.intro")} refreshing={sheet.isRefetching} onRefresh={() => void sheet.refetch()}>
      {sheet.isPending ? <Loading /> : null}
      {sheet.isError ? <Failed message={sheet.error.message} onRetry={() => void sheet.refetch()} /> : null}
      {s && s.offerings.length === 0 ? (
        <Empty icon="clipboard" title={t("streamRecords.practicals.noneTitle")} body={t("streamRecords.practicals.noneBody")} action={<Button label={t("streamRecords.practicals.noneAction")} variant="secondary" onPress={() => router.push("/(app)" as never)} />} />
      ) : null}
      {s && s.offerings.length > 0 ? (
        <Card title={t("streamRecords.practicals.offeringsTitle")}>
          <Chips label={t("streamRecords.practicals.offeringsBody")} value={s.offeringId ?? ""} options={s.offerings.map((o) => ({ value: o.offeringId, label: [o.courseCode, o.divisionName].filter(Boolean).join(" · ") }))} onChange={setOfferingId} />
        </Card>
      ) : null}
      {s && offering ? (
        <Card title={`${offering.courseCode} · ${offering.courseName}`}>
          <Text variant="sm" tone="muted">
            {t("streamRecords.practicals.sheetBody", { faculty: offering.facultyName ?? "—", students: s.students.length, experiments: experiments.length })}
          </Text>
          {s.students.length === 0 ? <Text tone="muted">{t("streamRecords.practicals.noStudents")}</Text> : null}
          {s.students.map((st) => {
            const rows = s.records.filter((r) => r.studentMembershipId === st.studentMembershipId).sort((a, b) => a.experimentNo - b.experimentNo);
            return (
              <Row
                key={st.studentMembershipId}
                title={[st.rollNumber ?? "—", st.name, st.batchName ? t("streamRecords.batchN", { name: st.batchName }) : null].filter(Boolean).join(" · ")}
                caption={rows.map((r) => `${t("streamRecords.practicals.expN", { n: r.experimentNo })}: ${r.marks ?? "✓"}${r.signed ? ` · ${t("streamRecords.practicals.signedBy", { name: r.signedByName ?? "" })}` : ""}`).join("\n") || undefined}
              />
            );
          })}
        </Card>
      ) : null}
      {s && offering && s.canWrite && s.students.length > 0 ? <ExperimentForm key={offering.offeringId} offeringId={offering.offeringId} students={s.students} nextNo={(experiments[experiments.length - 1] ?? 0) + 1} onSaved={() => sheet.refetch()} /> : null}
      {s && offering && s.canSign && unsigned.length > 0 ? (
        <Card title={t("streamRecords.practicals.signTitle")}>
          <Text variant="sm" tone="muted">
            {t("streamRecords.practicals.signBody", { count: unsigned.length })}
          </Text>
          <SignRows
            rows={unsigned}
            line={(row) => {
              const r = unsigned.find((x) => x.id === row.id)!;
              return t("streamRecords.practicals.signLine", { n: r.experimentNo, title: r.title, student: r.studentName, day: formatDate(r.performedOn) });
            }}
            onSigned={() => sheet.refetch()}
          />
        </Card>
      ) : null}
    </Screen>
  );
}

function ExperimentForm({ offeringId, students, nextNo, onSaved }: { offeringId: string; students: { studentMembershipId: string; name: string }[]; nextNo: number; onSaved: () => unknown }) {
  const t = useT();
  const th = useTheme();
  const [no, setNo] = useState(String(nextNo));
  const [title, setTitle] = useState("");
  const [day, setDay] = useState(todayKey());
  const [off, setOff] = useState<string[]>([]);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const ticked = students.filter((s) => !off.includes(s.studentMembershipId));
  const marksBad = (id: string) => {
    const m = (marks[id] ?? "").trim();
    return m !== "" && !(/^\d{1,3}$/.test(m) && Number(m) <= 100);
  };
  const noBad = !/^\d{1,3}$/.test(no.trim()) || Number(no) < 1 || Number(no) > 200;
  const ready = !noBad && title.trim().length >= 2 && /^\d{4}-\d{2}-\d{2}$/.test(day) && ticked.length > 0 && !ticked.some((s) => marksBad(s.studentMembershipId));
  const save = useWrite(
    async () =>
      streamRecordsCountSchema.parse(
        unwrap(
          await api().post("/api/v1/stream-records/practicals", {
            offeringId,
            experimentNo: Number(no),
            title: title.trim(),
            performedOn: day,
            entries: ticked.map((s) => {
              const m = (marks[s.studentMembershipId] ?? "").trim();
              return { studentMembershipId: s.studentMembershipId, marks: m === "" ? null : Number(m) };
            }),
          }),
        ),
      ),
    () => t("streamRecords.practicalSaved"),
    onSaved,
  );
  return (
    <Card title={t("streamRecords.practicals.addTitle")}>
      <Text variant="sm" tone="muted">
        {t("streamRecords.practicals.addBody")}
      </Text>
      <Field label={t("streamRecords.practicals.fieldNo")} value={no} onChangeText={setNo} keyboardType="number-pad" maxLength={3} />
      <Field label={t("streamRecords.practicals.fieldTitle")} value={title} onChangeText={setTitle} maxLength={160} />
      <Field label={t("streamRecords.practicals.fieldDay")} value={day} onChangeText={setDay} placeholder="YYYY-MM-DD" autoCapitalize="none" keyboardType="numbers-and-punctuation" />
      <Text variant="xs" tone="subtle" bold>
        {t("streamRecords.practicals.fieldStudents")}
      </Text>
      {ticked.length === 0 ? <Text tone="warn">{t("streamRecords.chooseStudents")}</Text> : null}
      {students.map((s) => {
        const on = !off.includes(s.studentMembershipId);
        return (
          <View key={s.studentMembershipId} style={{ gap: th.space[1] }}>
            <Tick label={s.name} on={on} onToggle={() => setOff((o) => toggle(o, s.studentMembershipId))} />
            {on ? <Field label={t("streamRecords.practicals.marksFor", { name: s.name })} value={marks[s.studentMembershipId] ?? ""} onChangeText={(v) => setMarks((m) => ({ ...m, [s.studentMembershipId]: v }))} keyboardType="number-pad" maxLength={3} error={marksBad(s.studentMembershipId) ? t("streamRecords.refuseMarks") : null} /> : null}
          </View>
        );
      })}
      <Button label={t("streamRecords.practicals.save")} busy={save.isPending} disabled={!ready} onPress={() => save.mutate(undefined)} />
    </Card>
  );
}

/* --------------------------------------------------- teaching practice */

/** The teaching-practice coordinator's desk: GET /api/v1/duties/teaching-practice. Practice schools, postings with the lessons watched; the coordinator records a watched lesson on a posting. */
export function TeachingPracticeScreen() {
  const t = useT();
  const guard = useDeskGuard("PRACTICE_TEACHING_COORDINATOR", "ACADEMICS", ["ADMIN", "PRINCIPAL"]);
  const desk = useQuery({ queryKey: ["duties", "teaching-practice"], enabled: guard.holds && guard.on, queryFn: async () => teachingPracticeDeskSchema.parse(unwrap(await api().get("/api/v1/duties/teaching-practice"))) });
  const title = t("duties.teachingPractice.title");
  const refused = refusal(guard, title, t);
  if (refused) return refused;
  const d = desk.data;
  const today = todayKey();
  return (
    <Screen title={title} description={d ? t("duties.teachingPractice.intro", { weeks: d.summary.minimumWeeks }) : undefined} refreshing={desk.isRefetching} onRefresh={() => void desk.refetch()}>
      {desk.isPending ? <Loading /> : null}
      {desk.isError ? <Failed message={desk.error.message} onRetry={() => void desk.refetch()} /> : null}
      {d ? (
        <>
          {!d.offered ? <Text tone="muted">{t("duties.teachingPractice.notOffered")}</Text> : null}
          <StatRow>
            <Stat label={t("streamRecords.statPracticeSchools")} value={d.summary.practiceSchools} />
            <Stat label={t("streamRecords.statPostings")} value={d.summary.postings} />
            <Stat label={t("streamRecords.statObserved")} value={`${d.summary.lessonsObserved} / ${d.summary.lessonsPlanned}`} />
            <Stat label={t("streamRecords.statMeetingNcte")} value={`${d.summary.meetingMinimum} / ${d.summary.students}`} tone={d.summary.meetingMinimum < d.summary.students ? "warn" : "ok"} />
          </StatRow>
          <Card title={t("duties.teachingPractice.schoolsTitle")}>
            {d.schools.length === 0 ? <Text tone="muted">{t("duties.teachingPractice.noSchools")}</Text> : null}
            {d.schools.map((s) => (
              <Row key={s.id} icon="buildings" title={s.name} caption={[s.udise ? t("duties.teachingPractice.udiseLine", { udise: s.udise }) : null, s.contact || null, t("duties.teachingPractice.postingsN", { count: s.postings })].filter(Boolean).join(" · ")} />
            ))}
          </Card>
          <Card title={t("duties.teachingPractice.postingsTitle")}>
            <Text variant="sm" tone="muted">
              {t("duties.teachingPractice.postingsBody")}
            </Text>
            {d.postings.length === 0 ? <Text tone="muted">{t(d.canManage ? "duties.teachingPractice.noPostingsBody" : "duties.teachingPractice.noPostingsRead")}</Text> : null}
            {d.postings.map((p) => (
              <Posting key={p.id} posting={p} canObserve={d.canObserve && p.from <= today} today={today} onSaved={() => desk.refetch()} />
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

function Posting({ posting: p, canObserve, today, onSaved }: { posting: TeachingPracticeDesk["postings"][number]; canObserve: boolean; today: string; onSaved: () => unknown }) {
  const t = useT();
  const th = useTheme();
  const [day, setDay] = useState(today < p.to ? today : p.to);
  const [grade, setGrade] = useState<(typeof LESSON_GRADES)[number]>("B");
  const [note, setNote] = useState("");
  const observe = useWrite(
    async () => streamRecordsIdSchema.parse(unwrap(await api().post(`/api/v1/duties/teaching-practice/postings/${p.id}/observations`, { at: day, grade, note: note.trim() }))),
    () => t("duties.teachingPractice.observationSaved"),
    () => {
      setNote("");
      return onSaved();
    },
  );
  return (
    <View style={{ gap: th.space[2], paddingVertical: th.space[2], borderTopWidth: 1, borderTopColor: th.border }}>
      <Text bold>{`${p.studentName} · ${p.practiceSchoolName}`}</Text>
      <Text variant="sm" tone="muted">
        {t("duties.teachingPractice.spanLine", { from: formatDate(p.from), to: formatDate(p.to), weeks: p.weeks, planned: p.lessonsPlanned, observed: p.observations.length })}
      </Text>
      {p.observations.map((o) => (
        <Text key={o.id} variant="sm">
          {[t("duties.teachingPractice.observationLine", { day: formatDate(o.at), observer: o.observerName }), t("duties.teachingPractice.gradeN", { grade: o.grade }), o.note || null].filter(Boolean).join(" · ")}
        </Text>
      ))}
      {canObserve ? (
        <>
          <Field label={t("duties.teachingPractice.fieldLessonDay")} value={day} onChangeText={setDay} placeholder="YYYY-MM-DD" autoCapitalize="none" keyboardType="numbers-and-punctuation" />
          <Chips label={t("duties.teachingPractice.fieldGrade")} value={grade} options={LESSON_GRADES.map((g) => ({ value: g, label: g }))} onChange={setGrade} />
          <Field label={t("duties.teachingPractice.fieldNote")} value={note} onChangeText={setNote} maxLength={1000} multiline />
          <Button label={t("duties.teachingPractice.observe")} variant="secondary" busy={observe.isPending} disabled={!/^\d{4}-\d{2}-\d{2}$/.test(day)} onPress={() => observe.mutate(undefined)} accessibilityLabel={`${t("duties.teachingPractice.observe")}: ${p.studentName}`} />
        </>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------ NSS / NCC */

const CORPS_META: Record<CorpsCode, { duty: DutyCode; title: TranslationKey; intro: TranslationKey; icon: string }> = {
  NSS: { duty: "NSS_OFFICER", title: "duties.corps.nssTitle", intro: "duties.corps.nssIntro", icon: "handHeart" },
  NCC: { duty: "NCC_OFFICER", title: "duties.corps.nccTitle", intro: "duties.corps.nccIntro", icon: "flag" },
};

/** The NSS or NCC officer's desk: GET /api/v1/duties/nss or /ncc. The enrolled with this year's hours, the activities; the officer records an activity with its hours, camp and who took part. */
export function CorpsScreen({ corps }: { corps: CorpsCode }) {
  const t = useT();
  const meta = CORPS_META[corps];
  const guard = useDeskGuard(meta.duty, "IQAC", ["ADMIN", "PRINCIPAL"]);
  const desk = useQuery({
    queryKey: ["duties", "corps", corps],
    enabled: guard.holds && guard.on,
    queryFn: async () => corpsDeskSchema.parse(unwrap(corps === "NSS" ? await api().get("/api/v1/duties/nss") : await api().get("/api/v1/duties/ncc"))),
  });
  const title = t(meta.title);
  const refused = refusal(guard, title, t);
  if (refused) return refused;
  const d = desk.data;
  return (
    <Screen title={title} description={d ? t(meta.intro, { hours: d.hoursPerYear }) : undefined} refreshing={desk.isRefetching} onRefresh={() => void desk.refetch()}>
      {desk.isPending ? <Loading /> : null}
      {desk.isError ? <Failed message={desk.error.message} onRetry={() => void desk.refetch()} /> : null}
      {d ? (
        <>
          <StatRow>
            <Stat label={t("duties.corps.statEnrolled")} value={d.enrolled.length} />
            <Stat label={t("duties.corps.statActivities")} value={d.summary.activities} />
            <Stat label={t("duties.corps.statHours")} value={d.summary.hours} />
            <Stat label={t("duties.corps.statCamps")} value={d.summary.camps} />
          </StatRow>
          <Card title={t("duties.corps.enrolledTitle")}>
            <Text variant="sm" tone="muted">
              {t("duties.corps.enrolledBody", { hours: d.hoursPerYear })}
            </Text>
            {d.enrolled.length === 0 ? <Text tone="muted">{t(d.canEdit ? "duties.corps.noneEnrolledBody" : "duties.corps.noneEnrolledRead")}</Text> : null}
            {d.enrolled.map((e) => (
              <Row key={e.studentMembershipId} icon="user" title={e.name} caption={[e.unit || null, e.enrolledOn, `${t("duties.corps.colHours")}: ${e.hours}`, e.hours >= d.hoursPerYear ? t("duties.corps.metHours") : null].filter(Boolean).join(" · ")} />
            ))}
          </Card>
          <Card title={t("duties.corps.activitiesTitle")}>
            <Text variant="sm" tone="muted">
              {t("duties.corps.activitiesBody")}
            </Text>
            {d.activities.length === 0 ? <Text tone="muted">{t("duties.corps.noActivities")}</Text> : null}
            {d.activities.map((a) => (
              <Row key={a.id} icon={meta.icon} title={a.title} caption={[t("duties.corps.activityLine", { day: a.at, hours: a.hours, count: a.participants }), a.camp ? t("duties.corps.camp") : null].filter(Boolean).join(" · ")} />
            ))}
          </Card>
          {d.canEdit && d.enrolled.length > 0 ? <ActivityForm corps={corps} enrolled={d.enrolled} onSaved={() => desk.refetch()} /> : null}
        </>
      ) : null}
    </Screen>
  );
}

function ActivityForm({ corps, enrolled, onSaved }: { corps: CorpsCode; enrolled: CorpsDesk["enrolled"]; onSaved: () => unknown }) {
  const t = useT();
  const [title, setTitle] = useState("");
  const [day, setDay] = useState(todayKey());
  const [hours, setHours] = useState("4");
  const [camp, setCamp] = useState(false);
  const [off, setOff] = useState<string[]>([]);
  const participants = enrolled.map((e) => e.studentMembershipId).filter((id) => !off.includes(id));
  const h = Number(hours.trim().replace(",", "."));
  const hoursBad = !/^\d+([.,]\d+)?$/.test(hours.trim()) || h < 0.5 || h > 240;
  const ready = title.trim().length >= 2 && /^\d{4}-\d{2}-\d{2}$/.test(day) && !hoursBad;
  const save = useWrite(
    async () => {
      const body = { title: title.trim(), at: day, hours: h, camp, participantMembershipIds: participants };
      return streamRecordsIdSchema.parse(unwrap(corps === "NSS" ? await api().post("/api/v1/duties/nss/activities", body) : await api().post("/api/v1/duties/ncc/activities", body)));
    },
    () => t("duties.corps.activitySaved"),
    () => {
      setTitle("");
      return onSaved();
    },
  );
  return (
    <Card title={t("duties.corps.addActivity")}>
      <Field label={t("duties.corps.fieldTitle")} value={title} onChangeText={setTitle} maxLength={160} />
      <Field label={t("duties.corps.fieldDay")} value={day} onChangeText={setDay} placeholder="YYYY-MM-DD" autoCapitalize="none" keyboardType="numbers-and-punctuation" />
      <Field label={t("duties.corps.fieldHours")} value={hours} onChangeText={setHours} keyboardType="decimal-pad" maxLength={5} error={hoursBad ? t("duties.corps.refuseHours") : null} />
      <SwitchRow label={t("duties.corps.fieldCamp")} value={camp} onChange={setCamp} />
      <MultiChips label={t("duties.corps.fieldParticipants")} values={participants} options={enrolled.map((e) => ({ value: e.studentMembershipId, label: e.name }))} onToggle={(id) => setOff((o) => toggle(o, id))} />
      <Button label={t("duties.corps.addActivity")} busy={save.isPending} disabled={!ready} onPress={() => save.mutate(undefined)} />
    </Card>
  );
}

/* ------------------------------------------------------- the research dean */

/** The research dean's read: GET /api/v1/duties/research. The figures, each teacher's research and API-score inputs, the register by year. */
export function ResearchDeskScreen() {
  const t = useT();
  const guard = useDeskGuard("RESEARCH_DEAN", "IQAC", ["ADMIN", "PRINCIPAL"]);
  const desk = useQuery({ queryKey: ["duties", "research"], enabled: guard.holds && guard.on, queryFn: async () => researchDeskSchema.parse(unwrap(await api().get("/api/v1/duties/research"))) });
  const title = t("duties.research.title");
  const refused = refusal(guard, title, t);
  if (refused) return refused;
  const d = desk.data;
  const kind = (k: string) => ((RESEARCH_KINDS as readonly string[]).includes(k) ? t(`iqac.researchKind.${k}` as TranslationKey) : k);
  return (
    <Screen title={title} description={t("duties.research.intro")} refreshing={desk.isRefetching} onRefresh={() => void desk.refetch()}>
      {desk.isPending ? <Loading /> : null}
      {desk.isError ? <Failed message={desk.error.message} onRetry={() => void desk.refetch()} /> : null}
      {d ? (
        <>
          <StatRow>
            <Stat label={t("duties.research.statItems")} value={d.items.length} />
            <Stat label={t("duties.research.statPublications")} value={d.perFaculty.reduce((a, f) => a + f.publications, 0)} />
            <Stat label={t("duties.research.statProjects")} value={d.perFaculty.reduce((a, f) => a + f.projects, 0)} />
            <Stat label={t("duties.research.statLakhs")} value={Math.round(d.perFaculty.reduce((a, f) => a + f.amountLakhs, 0) * 100) / 100} />
          </StatRow>
          <Card title={t("duties.research.facultyTitle")}>
            <Text variant="sm" tone="muted">
              {t(d.perFaculty.some((f) => f.apiScoreInputs !== null) ? "duties.research.facultyBody" : "duties.research.facultyBodyDuty")}
            </Text>
            {d.perFaculty.length === 0 ? <Text tone="muted">{t("duties.research.noFaculty")}</Text> : null}
            {d.perFaculty.map((f) => (
              <Row
                key={f.membershipId}
                icon="medal"
                title={f.apiScore === null ? f.name : `${f.name} · ${t("duties.research.colApi")} ${f.apiScore}`}
                caption={[
                  `${t("duties.research.colPublications")} ${f.publications}`,
                  `${t("duties.research.colBooks")} ${f.books}`,
                  `${t("duties.research.colProjects")} ${f.projects}`,
                  t("duties.research.lakhsN", { lakhs: f.amountLakhs }),
                  // The API score is the office's and the head's (A3-S-11): null to the duty's holder.
                  ...(f.apiScoreInputs
                    ? [`${t("duties.research.colTeaching")} ${f.apiScoreInputs.teaching}`, `${t("duties.research.colResearch")} ${f.apiScoreInputs.research}`, `${t("duties.research.colService")} ${f.apiScoreInputs.service}`]
                    : []),
                ].join(" · ")}
              />
            ))}
          </Card>
          <Card title={t("duties.research.registerTitle")}>
            <Text variant="sm" tone="muted">
              {t("duties.research.registerBody")}
            </Text>
            {d.byYear.map((y) => (
              <Text key={y.year} variant="sm">
                {t("duties.research.yearLine", { year: y.year, publications: y.publications, projects: y.projects, lakhs: y.amountLakhs })}
              </Text>
            ))}
            {d.items.length === 0 ? <Text tone="muted">{t("duties.research.noItemsBody")}</Text> : null}
            {d.items.map((i) => (
              <Row key={i.id} title={i.title} caption={[kind(i.kind), String(i.year), i.facultyName, i.amountLakhs !== null ? t("duties.research.lakhsN", { lakhs: i.amountLakhs }) : null].filter(Boolean).join(" · ")} />
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

/* ------------------------------------------------------- the flying squad */

/** The exam flying squad's desk: GET /api/v1/duties/exam-squad. Papers and halls, the visits, the cases; a squad member logs a visit. */
export function ExamSquadScreen() {
  // No screenshots while it is up (A3-S-12, audit of 5 Oct 2026): the flying squad's malpractice cases, by student.
  usePrivateScreen();
  const t = useT();
  const { locale } = useLocale();
  const guard = useDeskGuard("EXAM_SQUAD", "EXAMS", ["ADMIN", "PRINCIPAL", "EXAM_CONTROLLER"]);
  const desk = useQuery({ queryKey: ["duties", "exam-squad"], enabled: guard.holds && guard.on, queryFn: async () => examSquadDeskSchema.parse(unwrap(await api().get("/api/v1/duties/exam-squad"))) });
  const title = t("duties.examSquad.title");
  const refused = refusal(guard, title, t);
  if (refused) return refused;
  const d = desk.data;
  const halls = d ? d.papers.flatMap((p) => (p.halls.length ? p.halls.map((h) => ({ value: `${p.scheduleId}|${h.id}`, label: `${p.courseCode} · ${h.name} · ${when(p.at, locale)}` })) : [{ value: `${p.scheduleId}|`, label: `${p.courseCode} · ${when(p.at, locale)}` }])) : [];
  return (
    <Screen title={title} description={t("duties.examSquad.intro")} refreshing={desk.isRefetching} onRefresh={() => void desk.refetch()}>
      {desk.isPending ? <Loading /> : null}
      {desk.isError ? <Failed message={desk.error.message} onRetry={() => void desk.refetch()} /> : null}
      {d ? (
        <>
          <StatRow>
            <Stat label={t("duties.examSquad.statPapers")} value={d.papers.length} />
            <Stat label={t("duties.examSquad.statVisits")} value={d.visits.length} />
            <Stat label={t("duties.examSquad.statFlagged")} value={d.visits.filter((v) => v.flagged).length} tone={d.visits.some((v) => v.flagged) ? "warn" : "fg"} />
            <Stat label={t("duties.examSquad.statOpenCases")} value={d.cases.filter((c) => !c.decided).length} />
          </StatRow>
          <Card title={t("duties.examSquad.papersTitle")}>
            <Text variant="sm" tone="muted">
              {t("duties.examSquad.papersBody")}
            </Text>
            {d.papers.length === 0 ? <Text tone="muted">{t("duties.examSquad.noPapersBody")}</Text> : null}
            {d.papers.map((p) => (
              <Row key={p.scheduleId} icon="clipboard" title={`${p.courseCode} · ${p.courseName}`} caption={t("duties.examSquad.paperLine", { session: p.sessionName, when: when(p.at, locale), halls: p.halls.map((h) => h.name).join(", ") || "—", visits: p.visits })} />
            ))}
          </Card>
          {guard.holder && halls.length > 0 ? <VisitForm halls={halls} onSaved={() => desk.refetch()} /> : null}
          <Card title={t("duties.examSquad.visitsTitle")}>
            {d.visits.length === 0 ? <Text tone="muted">{t("duties.examSquad.noVisits")}</Text> : null}
            {d.visits.map((v) => (
              <Row key={v.id} icon="eye" title={t("duties.examSquad.visitLine", { course: v.courseCode, hall: v.hallName ?? "—", when: when(v.at, locale), by: v.byName })} caption={[v.flagged ? t("duties.examSquad.flagged") : t("duties.examSquad.clear"), v.members || null, v.note || null].filter(Boolean).join(" · ")} />
            ))}
          </Card>
          <Card title={t("duties.examSquad.casesTitle")}>
            <Text variant="sm" tone="muted">
              {t("duties.examSquad.casesBody")}
            </Text>
            {d.cases.length === 0 ? <Text tone="muted">{t("duties.examSquad.noCases")}</Text> : null}
            {d.cases.map((c) => (
              <Row key={c.id} icon="warning" title={t("duties.examSquad.caseLine", { course: c.courseCode, session: c.sessionName, day: formatDate(c.reportedOn), student: c.studentName })} caption={c.decided ? t("duties.examSquad.decided") : t("duties.examSquad.pending")} />
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

function VisitForm({ halls, onSaved }: { halls: { value: string; label: string }[]; onSaved: () => unknown }) {
  const t = useT();
  const [hall, setHall] = useState(halls[0]!.value);
  const [members, setMembers] = useState("");
  const [note, setNote] = useState("");
  const [flagged, setFlagged] = useState(false);
  const needNote = flagged && note.trim().length === 0;
  const save = useWrite(
    async () => {
      const [scheduleId, roomId] = hall.split("|");
      return streamRecordsIdSchema.parse(unwrap(await api().post("/api/v1/duties/exam-squad/visits", { scheduleId, examRoomId: roomId ? roomId : null, members: members.trim(), flagged, note: note.trim() })));
    },
    () => t("duties.examSquad.visitSaved"),
    () => {
      setNote("");
      setFlagged(false);
      return onSaved();
    },
  );
  return (
    <Card title={t("duties.examSquad.logVisit")}>
      <Chips label={t("duties.examSquad.fieldHall")} value={hall} options={halls} onChange={setHall} />
      <Field label={t("duties.examSquad.fieldMembers")} value={members} onChangeText={setMembers} maxLength={300} />
      <Field label={t("duties.examSquad.fieldNote")} value={note} onChangeText={setNote} maxLength={1000} multiline error={needNote ? t("duties.examSquad.refuseNeedNote") : null} />
      <SwitchRow label={t("duties.examSquad.fieldFlagged")} value={flagged} onChange={setFlagged} />
      <Button label={t("duties.examSquad.logVisit")} busy={save.isPending} disabled={needNote} onPress={() => save.mutate(undefined)} />
    </Card>
  );
}
