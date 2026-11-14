import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { facultyStudiosSchema, studentStudiosSchema, studioJuryMarksSavedSchema, studioJurySignedSchema, studioSubmissionSavedSchema, type FacultyJury, type StudioGradeBand, type StudioStage, type StudioSubmissionStage } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Stat, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { usePrivateScreen } from "@/lib/private-screen";
import { useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { formatDateKey } from "../family/shared";

/**
 * STUDIOS AND JURIES ON THE PHONE (R-56, the studio half, 10 Oct 2026), the
 * web's /faculty/studios and /student/studios:
 *
 *   FacultyStudiosScreen  GET /api/v1/faculty/studios — the studios I teach,
 *                         coordinate or sit on a jury for, the juries ahead and
 *                         past, and for a jury I sit on and the chair has not
 *                         signed, the marks sheet: marks and a remark per
 *                         student (POST …/juries/{id}/marks), and for the chair
 *                         the signature (POST …/juries/{id}/sign). Who may do
 *                         which is the server's (canMark, canSign); the screen
 *                         draws only what it is told to.
 *   StudentStudiosScreen  GET /api/v1/family/studios — each studio's stages
 *                         with their days, my submissions, a note sent for an
 *                         open stage (POST /api/v1/family/studios/{id}/submissions;
 *                         the file goes through the web), and the signed
 *                         jury results.
 *
 * Both ask nothing of the server for a role they are not for or with
 * ACADEMICS off, and say so when the college has no architecture stream.
 */

const STAGE_KEY: Record<StudioStage, TranslationKey> = { BRIEF_ISSUED: "duties.studio.stageBRIEF_ISSUED", INTERIM_PINUP: "duties.studio.stageINTERIM_PINUP", FINAL_SUBMISSION: "duties.studio.stageFINAL_SUBMISSION", JURY: "duties.studio.stageJURY" };
const STATE_KEY: Record<"UNSET" | "AHEAD" | "TODAY" | "DONE", TranslationKey> = { UNSET: "duties.studio.stateUNSET", AHEAD: "duties.studio.stateAHEAD", TODAY: "duties.studio.stateTODAY", DONE: "duties.studio.stateDONE" };
const SUB_KEY: Record<"DRAFT" | "SUBMITTED" | "LATE", TranslationKey> = { DRAFT: "duties.studio.subDRAFT", SUBMITTED: "duties.studio.subSUBMITTED", LATE: "duties.studio.subLATE" };
const BAND_KEY: Record<StudioGradeBand, TranslationKey> = { O: "duties.studio.bandO", A_PLUS: "duties.studio.bandA_PLUS", A: "duties.studio.bandA", B_PLUS: "duties.studio.bandB_PLUS", B: "duties.studio.bandB", C: "duties.studio.bandC", P: "duties.studio.bandP", F: "duties.studio.bandF" };
const SUBMISSION_STAGES: StudioSubmissionStage[] = ["INTERIM_PINUP", "FINAL_SUBMISSION"];
const FACULTY_PATH = "/api/v1/faculty/studios";
const STUDENT_PATH = "/api/v1/family/studios";

function Refused({ title, body, icon }: { title: string; body: string; icon: string }) {
  const t = useT();
  const router = useRouter();
  return (
    <Screen title={title}>
      <Empty icon={icon} title={title} body={body} action={<Button label={t("nav.more")} variant="secondary" onPress={() => router.push("/(app)/more" as never)} />} />
    </Screen>
  );
}

function dayOf(key: string | null, locale: string, t: ReturnType<typeof useT>): string {
  return key ? formatDateKey(key, locale, { day: "numeric", month: "short", year: "numeric" }) : t("duties.studio.stateUNSET");
}

/* ------------------------------------------------------------ the faculty */

export function FacultyStudiosScreen() {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const router = useRouter();
  const session = useSession();
  const me = session.status === "signed-in" ? session.me : null;
  const role = me?.active.role ?? null;
  const reads = role === "FACULTY" || role === "HOD";
  const on = (me?.modules ?? []).includes("ACADEMICS");
  const query = useQuery({ queryKey: ["faculty", "studios"], enabled: reads && on, queryFn: async () => facultyStudiosSchema.parse(unwrap(await api().get(FACULTY_PATH))) });
  const title = t("duties.studio.facultyTitle");
  if (!reads) return <Refused title={title} body={t("duties.studio.facultyNotForYou")} icon="palette" />;
  if (!on) return <Refused title={title} body={t("duties.moduleOff")} icon="puzzle" />;
  const d = query.data;
  const ahead = d?.juries.filter((j) => !j.past) ?? [];
  const past = d?.juries.filter((j) => j.past) ?? [];
  return (
    <Screen title={title} description={t("duties.studio.facultyIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d && !d.offered ? <Text tone="muted">{t("duties.studio.notOffered")}</Text> : null}
      {d ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
          <Stat label={t("duties.studio.statStudios")} value={d.studios.length} />
          <Stat label={t("duties.studio.statJuriesAhead")} value={ahead.length} />
          <Stat label={t("duties.studio.statToSign")} value={d.juries.filter((j) => j.canSign).length} tone={d.juries.some((j) => j.canSign) ? "warn" : "ok"} />
        </View>
      ) : null}
      {d && d.studios.length === 0 ? <Empty icon="palette" title={t("duties.studio.noStudiosMine")} body={t("duties.studio.noStudiosMineBody")} action={<Button label={t("nav.more")} variant="secondary" onPress={() => router.push("/(app)/more" as never)} />} /> : null}
      {d && d.studios.length > 0 ? (
        <Card title={t("duties.studio.statStudios")}>
          {d.studios.map((s) => (
            <Row key={s.id} icon="palette" title={s.title} caption={[t("duties.studio.studioLine", { course: s.courseCode, term: s.termName, coordinator: s.coordinatorName }), ...s.stages.map((st) => `${t(STAGE_KEY[st.stage])}: ${dayOf(st.on, locale, t)} · ${t(STATE_KEY[st.state])}${st.waiting ? ` · ${t("duties.studio.waitingN", { count: st.waiting })}` : ""}`)].join("\n")} />
          ))}
        </Card>
      ) : null}
      {d ? (
        <Card title={t("duties.studio.myJuriesTitle")}>
          <Text variant="sm" tone="muted">
            {t("duties.studio.myJuriesBody")}
          </Text>
          {d.juries.length === 0 ? <Text tone="muted">{t("duties.studio.noJuriesMine")}</Text> : null}
          {[...ahead, ...past].map((j) => (
            <JuryPanel key={j.id} jury={j} onDone={() => query.refetch()} />
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}

/** One jury: the panel, and the sheet when I may mark it, the signature when I chair it. */
function JuryPanel({ jury, onDone }: { jury: FacultyJury; onDone: () => unknown }) {
  const t = useT();
  const th = useTheme();
  const toast = useToast();
  const { locale } = useLocale();
  const [marks, setMarks] = useState<Record<string, string>>(() => Object.fromEntries(jury.sheet.map((r) => [r.studentMembershipId, r.marks === null ? "" : String(r.marks)])));
  const [remarks, setRemarks] = useState<Record<string, string>>(() => Object.fromEntries(jury.sheet.map((r) => [r.studentMembershipId, r.remark])));
  const save = useMutation({
    mutationFn: async () =>
      studioJuryMarksSavedSchema.parse(
        unwrap(
          await api().post(`${FACULTY_PATH}/juries/${jury.id}/marks`, {
            entries: jury.sheet.map((r) => {
              const raw = (marks[r.studentMembershipId] ?? "").trim().replace(",", ".");
              return { studentMembershipId: r.studentMembershipId, marks: raw === "" ? null : Number(raw), remark: (remarks[r.studentMembershipId] ?? "").trim() };
            }),
          }),
        ),
      ),
    onSuccess: () => {
      toast.show(t("duties.studio.marksSaved"), "ok");
      void onDone();
    },
    onError: (e: Error) => toast.show(e.message, "danger"),
  });
  const sign = useMutation({
    mutationFn: async () => studioJurySignedSchema.parse(unwrap(await api().post(`${FACULTY_PATH}/juries/${jury.id}/sign`, {}))),
    onSuccess: (r) => {
      toast.show(t(r.changed ? "duties.studio.signed" : "duties.studio.alreadySigned"), "ok");
      void onDone();
    },
    onError: (e: Error) => toast.show(e.message, "danger"),
  });
  const ready = jury.sheet.every((r) => {
    const raw = (marks[r.studentMembershipId] ?? "").trim().replace(",", ".");
    return raw === "" || (Number.isFinite(Number(raw)) && Number(raw) >= 0 && Number(raw) <= jury.maxMarks);
  });
  const panel = jury.panel.map((p) => (p.chair ? `${p.name} ${t("duties.studio.chairSuffix")}` : p.name)).join(", ");
  return (
    <View style={{ gap: th.space[2], borderTopWidth: 1, borderTopColor: th.border, paddingTop: th.space[3] }}>
      <Row
        icon="clipboard"
        title={`${jury.studioTitle} · ${dayOf(jury.on, locale, t)}${jury.title ? ` · ${jury.title}` : ""}`}
        caption={[t("duties.studio.panelLine", { names: panel }), jury.signedAt ? t("duties.studio.signedLine", { name: jury.signedByName ?? "" }) : t("duties.studio.unsignedLine", { marked: jury.marked, students: jury.students })].join("\n")}
      />
      {jury.canMark ? (
        <View style={{ gap: th.space[2] }}>
          {jury.sheet.map((r) => (
            <View key={r.studentMembershipId} style={{ gap: th.space[1] }}>
              <Text variant="sm" bold>
                {r.name}
              </Text>
              <Field label={`${r.name}: ${t("duties.studio.colMarks", { max: jury.maxMarks })}`} value={marks[r.studentMembershipId] ?? ""} onChangeText={(v) => setMarks((m) => ({ ...m, [r.studentMembershipId]: v }))} keyboardType="decimal-pad" />
              <Field label={`${r.name}: ${t("duties.studio.colRemark")}`} value={remarks[r.studentMembershipId] ?? ""} onChangeText={(v) => setRemarks((m) => ({ ...m, [r.studentMembershipId]: v }))} maxLength={400} />
            </View>
          ))}
          <Text variant="sm" tone="muted">
            {t("duties.studio.absentHint")}
          </Text>
          <Button label={t("duties.studio.saveMarks")} variant="secondary" busy={save.isPending} disabled={!ready} onPress={() => save.mutate()} />
        </View>
      ) : (
        jury.sheet.map((r) => (
          <Row key={r.studentMembershipId} title={r.name} caption={r.entered ? (r.marks === null ? t("duties.studio.absent") : t("duties.studio.resultLine", { marks: r.marks, max: jury.maxMarks, band: r.band ? t(BAND_KEY[r.band]) : "—" })) : t("duties.studio.notEntered")} />
        ))
      )}
      {jury.canSign ? <Button label={t("duties.studio.sign")} busy={sign.isPending} onPress={() => sign.mutate()} /> : null}
    </View>
  );
}

/* ------------------------------------------------------------ the student */

export function StudentStudiosScreen() {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const session = useSession();
  usePrivateScreen();
  const me = session.status === "signed-in" ? session.me : null;
  const reads = me?.active.role === "STUDENT";
  const on = (me?.modules ?? []).includes("ACADEMICS");
  const query = useQuery({ queryKey: ["family", "studios"], enabled: reads && on, queryFn: async () => studentStudiosSchema.parse(unwrap(await api().get(STUDENT_PATH))) });
  const title = t("duties.studio.studentTitle");
  if (!reads) return <Refused title={title} body={t("duties.studio.studentNotForYou")} icon="palette" />;
  if (!on) return <Refused title={title} body={t("duties.moduleOff")} icon="puzzle" />;
  const d = query.data;
  return (
    <Screen title={title} description={t("duties.studio.studentIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d && d.studios.length === 0 ? <Empty icon="palette" title={t("duties.studio.noStudiosStudent")} body={t(d.offered ? "duties.studio.noStudiosStudentBody" : "duties.studio.notOffered")} action={<Button label={t("nav.more")} variant="secondary" onPress={() => router.push("/(app)/more" as never)} />} /> : null}
      {d?.studios.map((s) => (
        <Card key={s.id} title={s.title}>
          <Text variant="sm" tone="muted">
            {t("duties.studio.studioLine", { course: `${s.courseCode} ${s.courseName}`, term: s.termName, coordinator: s.coordinatorName })}
          </Text>
          {s.brief ? <Text variant="sm">{s.brief}</Text> : null}
          {s.stages.map((st) => (
            <Row key={st.stage} icon="calendar" title={t(STAGE_KEY[st.stage])} caption={`${dayOf(st.on, locale, t)} · ${t(STATE_KEY[st.state])}`} />
          ))}
          {SUBMISSION_STAGES.map((stage) => (
            <SubmissionNote key={stage} studioId={s.id} stage={stage} on={s.stages.find((x) => x.stage === stage)?.on ?? null} open={(s.openStages ? s.openStages.includes(stage) : s.canSubmit) && (s.stages.find((x) => x.stage === stage)?.on ?? null) !== null} mine={s.submissions.find((x) => x.stage === stage) ?? null} onDone={() => query.refetch()} />
          ))}
          <Text variant="sm" bold>
            {t("duties.studio.resultsTitle")}
          </Text>
          {s.results.length === 0 ? <Text tone="muted">{t("duties.studio.noResults")}</Text> : null}
          {s.results.map((r) => (
            <Row key={r.juryId} icon="medal" title={`${dayOf(r.on, locale, t)}${r.title ? ` · ${r.title}` : ""}`} caption={`${r.marks === null || !r.band ? t("duties.studio.absent") : t("duties.studio.resultLine", { marks: r.marks, max: s.maxMarks, band: t(BAND_KEY[r.band]) })}${r.remark ? `\n${r.remark}` : ""}`} />
          ))}
        </Card>
      ))}
    </Screen>
  );
}

/** A stage's submission: what stands, and a note sent or kept as a draft while the stage is open. */
function SubmissionNote({ studioId, stage, on, open, mine, onDone }: { studioId: string; stage: StudioSubmissionStage; on: string | null; open: boolean; mine: { state: "DRAFT" | "SUBMITTED" | "LATE"; note: string; fileName: string | null } | null; onDone: () => unknown }) {
  const t = useT();
  const th = useTheme();
  const toast = useToast();
  const { locale } = useLocale();
  const [note, setNote] = useState(mine?.note ?? "");
  const send = useMutation({
    mutationFn: async (submit: boolean) => studioSubmissionSavedSchema.parse(unwrap(await api().post(`${STUDENT_PATH}/${studioId}/submissions`, { stage, note: note.trim(), fileId: null, submit }))),
    onSuccess: (r) => {
      toast.show(t(r.state === "DRAFT" ? "duties.studio.submissionSaved" : "duties.studio.submissionSent"), "ok");
      void onDone();
    },
    onError: (e: Error) => toast.show(e.message, "danger"),
  });
  const sent = mine ? mine.state !== "DRAFT" : false;
  return (
    <View style={{ gap: th.space[2], borderTopWidth: 1, borderTopColor: th.border, paddingTop: th.space[3] }}>
      <Text variant="sm" bold>
        {t("duties.studio.submitTitle", { stage: t(STAGE_KEY[stage]) })}
      </Text>
      <Text variant="sm" tone="muted">
        {on ? t("duties.studio.dueLine", { day: dayOf(on, locale, t) }) : t("duties.studio.stageNotSet")}
        {mine ? ` · ${t(SUB_KEY[mine.state])}` : ""}
        {mine?.fileName ? ` · ${mine.fileName}` : ""}
      </Text>
      {open ? (
        <>
          <Field label={`${t(STAGE_KEY[stage])}: ${t("duties.studio.fieldNote")}`} value={note} onChangeText={setNote} multiline maxLength={1000} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
            <Button label={t("duties.studio.submit")} busy={send.isPending} onPress={() => send.mutate(true)} />
            {!sent ? <Button label={t("duties.studio.saveDraft")} variant="secondary" busy={send.isPending} onPress={() => send.mutate(false)} /> : null}
          </View>
        </>
      ) : on ? (
        <Text variant="sm" tone="muted">
          {t("duties.studio.closed")}
        </Text>
      ) : null}
    </View>
  );
}
