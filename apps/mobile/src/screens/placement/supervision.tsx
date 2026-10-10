import { useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { INDUSTRY_GRADES, inboxPeopleSchema, internshipListSchema, internshipViewSchema, projectListSchema, projectViewSchema, type InternshipView, type ProjectView } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, SwitchRow, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useRole } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { Chips, Notice, formatDateKey } from "../staff/shared";
import { Pill } from "../family/shared";
import { DATE_KEY, ModuleOffScreen, OfflineDecisionNote, intOfTyped, todayKey, useModuleOn } from "@/screens/shared/desk";
import { INTERNSHIP_STATUS_KEY } from "./words";

/** An internship's kind, in the phone's words: the AICTE's three from placement.*, a law college's and a management one's from the stream records. */
const KIND_KEY: Record<string, TranslationKey> = { INDUSTRY: "placement.internKindINDUSTRY", RESEARCH: "placement.internKindRESEARCH", FAMILY_BUSINESS: "placement.internKindFAMILY_BUSINESS", COURT: "streamRecords.internKindCOURT", FIRM: "streamRecords.internKindFIRM", LEGAL_AID: "streamRecords.internKindLEGAL_AID", SUMMER: "streamRecords.internKindSUMMER" };

/**
 * Students' work on the phone (the parity batch, 10 Oct 2026, R-4): the
 * internships under the AICTE policy and, for the department and its guides,
 * the students' projects — the web's /placement/internships for the TPO,
 * /hod/projects for an HOD and /faculty/supervision for a faculty member, one
 * screen whose doors scope the rows (the college's for the cell and the
 * office, the department's for the HOD, a teacher's own supervisees and the
 * projects they guide). A proposed internship is approved naming its
 * supervising faculty (the people the inbox lists as FACULTY or HOD) or
 * refused with a reason; an approved one takes the industry grade, the
 * faculty visit, the viva and — the cell's or the HOD's word — the credits;
 * a project's guide records a review, the final one with the marks. Every
 * write is the web's door; each is a decision, sent live and never queued.
 * Setting up a project stays on the web.
 */
export function SupervisionScreen() {
  const t = useT();
  const role = useRole();
  const on = useModuleOn("PLACEMENT");
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const guide = role === "FACULTY" || role === "HOD";
  const title = t(role === "FACULTY" ? "placement.supervisionTitle" : role === "HOD" ? "placement.hodProjectsTitle" : "placement.tabInternships");
  const internships = useQuery({ queryKey: ["placement", "internships"], enabled: on, queryFn: async () => internshipListSchema.parse(unwrap(await api().get("/api/v1/placement/internships"))) });
  const projects = useQuery({ queryKey: ["placement", "projects"], enabled: on && guide, queryFn: async () => projectListSchema.parse(unwrap(await api().get("/api/v1/placement/projects"))) });
  // The supervisors a proposal may name: the college's teachers, as the inbox lists the people I may write to (the TPO has no other door to them).
  const people = useQuery({ queryKey: ["shared", "people"], enabled: on && Boolean(internships.data?.canDecide), queryFn: async () => inboxPeopleSchema.parse(unwrap(await api().get("/api/v1/shared/people"))) });
  if (!on) return <ModuleOffScreen title={title} module="PLACEMENT" />;
  const supervisors = (people.data?.people ?? []).filter((p): p is typeof p & { membershipId: string } => (p.role === "FACULTY" || p.role === "HOD") && p.membershipId !== null).map((p) => ({ membershipId: p.membershipId, name: p.name }));
  const list = internships.data;
  const waiting = (list?.internships ?? []).filter((i) => i.status === "PROPOSED");
  const rest = (list?.internships ?? []).filter((i) => i.status !== "PROPOSED");
  return (
    <Screen title={title} description={t(role === "FACULTY" ? "placement.supervisionIntro" : role === "HOD" ? "placement.hodProjectsIntro" : "placement.internshipsIntro")} refreshing={internships.isRefetching} onRefresh={() => void internships.refetch()}>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      {internships.isPending ? <Loading /> : null}
      {internships.isError ? <Failed message={internships.error.message} onRetry={() => void internships.refetch()} /> : null}
      {list && list.internships.length === 0 ? <Empty icon="briefcase" title={t("placement.noInternships")} body={t("deskParity.internshipsNoneBody")} action={<Button label={t("common.retry")} variant="secondary" onPress={() => void internships.refetch()} />} /> : null}
      {list ? (
        <Text variant="xs" tone="muted">
          {t("deskParity.internshipRule", { creditsMin: list.rule.creditsMin, creditsMax: list.rule.creditsMax, hoursMin: list.rule.hoursMin, hoursMax: list.rule.hoursMax })}
        </Text>
      ) : null}
      {waiting.length > 0 ? (
        <Card title={t("deskParity.internshipsWaiting", { count: waiting.length })}>
          {waiting.map((i) => (
            <InternshipCard key={i.id} item={i} canDecide={Boolean(list?.canDecide)} supervisors={supervisors} creditsMax={list?.rule.creditsMax ?? 20} onDone={setNotice} />
          ))}
        </Card>
      ) : null}
      {rest.length > 0 ? (
        <Card title={t("placement.internshipsTitle", { count: rest.length })}>
          {rest.map((i) => (
            <InternshipCard key={i.id} item={i} canDecide={Boolean(list?.canDecide)} supervisors={supervisors} creditsMax={list?.rule.creditsMax ?? 20} onDone={setNotice} />
          ))}
        </Card>
      ) : null}
      {guide ? (
        <Card title={t("placement.projectsTitle", { count: projects.data?.projects.length ?? 0 })}>
          {projects.isError ? <Failed message={projects.error.message} onRetry={() => void projects.refetch()} /> : null}
          {projects.data && projects.data.projects.length === 0 ? (
            <Text tone="muted">{t("placement.noProjects")}</Text>
          ) : null}
          {projects.data?.projects.map((p) => (
            <ProjectCard key={p.id} project={p} onDone={setNotice} />
          ))}
          <Text variant="xs" tone="muted">
            {t("deskParity.projectsSetUpOnWeb")}
          </Text>
        </Card>
      ) : null}
    </Screen>
  );
}

type Done = (notice: { tone: "ok" | "danger"; text: string }) => void;

/** One internship: its facts, then the decision or the evaluation it is waiting for. */
function InternshipCard({ item, canDecide, supervisors, creditsMax, onDone }: { item: InternshipView; canDecide: boolean; supervisors: { membershipId: string; name: string }[]; creditsMax: number; onDone: Done }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const qc = useQueryClient();
  const role = useRole();
  const [mode, setMode] = useState<"none" | "approve" | "refuse" | "evaluate">("none");
  const [picked, setPicked] = useState<string | null>(item.facultyMembershipId);
  // The people load after the card draws: until the TPO picks one, the first teacher listed is the supervisor named.
  const supervisor = picked ?? supervisors[0]?.membershipId ?? "";
  const setSupervisor = (next: string) => setPicked(next);
  const [reason, setReason] = useState("");
  const [grade, setGrade] = useState<string>(item.industryGrade ?? "");
  const [visit, setVisit] = useState(item.facultyVisitAt?.slice(0, 10) ?? "");
  const [viva, setViva] = useState(item.vivaMarks === null ? "" : String(item.vivaMarks));
  const [credits, setCredits] = useState("");
  const [error, setError] = useState<string | null>(null);
  const settle = (text: string) => {
    setMode("none");
    setError(null);
    onDone({ tone: "ok", text });
    void qc.invalidateQueries({ queryKey: ["placement"] });
  };
  const decide = useMutation({
    mutationFn: async (approve: boolean) => internshipViewSchema.parse(unwrap(await api().post(`/api/v1/placement/internships/${item.id}/decide`, approve ? { approve: true, facultyMembershipId: supervisor || null, reason: "" } : { approve: false, facultyMembershipId: null, reason: reason.trim() }))),
    onSuccess: (r) => settle(t(r.status === "REFUSED" ? "placement.internshipRefused" : "placement.internshipApproved")),
    onError: (e: Error) => setError(e.message),
  });
  const evaluate = useMutation({
    mutationFn: async () => {
      const vivaN = viva.trim() === "" ? null : intOfTyped(viva);
      const creditsN = credits.trim() === "" ? null : intOfTyped(credits);
      if (viva.trim() !== "" && (vivaN === null || vivaN < 0 || vivaN > 100)) throw new Error(t("deskParity.checkViva"));
      if (visit.trim() !== "" && !DATE_KEY.test(visit.trim())) throw new Error(t("deskParity.checkDate"));
      if (credits.trim() !== "" && (creditsN === null || creditsN < 1 || creditsN > creditsMax)) throw new Error(t("deskParity.checkCredits", { max: creditsMax }));
      return internshipViewSchema.parse(unwrap(await api().post(`/api/v1/placement/internships/${item.id}/evaluate`, { industryGrade: grade || null, facultyVisitOn: visit.trim() || null, vivaMarks: vivaN, ...(canDecide && creditsN !== null ? { credits: creditsN } : {}) })));
    },
    onSuccess: (r) => settle(r.status === "CREDITED" && r.credits !== null ? t("placement.internshipCredited", { credits: r.credits }) : t("placement.internshipEvaluated")),
    onError: (e: Error) => setError(e.message),
  });
  const facts = [
    item.companyName,
    t(KIND_KEY[item.kind] ?? "placement.internKindINDUSTRY"),
    `${formatDateKey(item.from, locale)} – ${formatDateKey(item.to, locale)}`,
    t("placement.hoursN", { hours: item.hours }),
    t("placement.windowN", { semester: item.windowSemester }),
    item.facultyName ? `${t("placement.fieldSupervisor")}: ${item.facultyName}` : null,
    t("placement.diaryN", { count: item.diary.length }),
    item.hasReport ? t("placement.report") : t("deskParity.reportMissing"),
    item.needsDeclaration ? (item.hasDeclaration ? t("placement.declaration") : t("placement.declarationMissing")) : null,
    item.industryGrade ? t("placement.gradeIs", { grade: item.industryGrade }) : null,
    item.vivaMarks === null ? null : `${t("placement.fieldViva")} ${item.vivaMarks}`,
    item.credits === null ? null : t("placement.creditsIs", { credits: item.credits }),
  ]
    .filter(Boolean)
    .join(" · ");
  const evaluable = (role === "TPO" || role === "HOD" || role === "FACULTY") && (item.status === "APPROVED" || item.status === "SUBMITTED" || item.status === "EVALUATED");
  return (
    <View style={{ gap: th.space[2], paddingVertical: th.space[2], borderTopWidth: 1, borderColor: th.border }}>
      <Row title={item.studentName} caption={facts} right={<Pill label={t(INTERNSHIP_STATUS_KEY[item.status]!)} tone={item.status === "REFUSED" ? "danger" : item.status === "CREDITED" ? "ok" : item.status === "PROPOSED" ? "warn" : "accent"} />} />
      {error ? (
        <Text variant="sm" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      {item.status === "PROPOSED" && canDecide && mode === "none" ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
          <Button label={t("placement.approve")} accessibilityLabel={`${t("placement.approve")}: ${item.studentName}`} onPress={() => setMode("approve")} />
          <Button label={t("collegeOffice.refuse")} accessibilityLabel={`${t("collegeOffice.refuse")}: ${item.studentName}`} variant="secondary" onPress={() => setMode("refuse")} />
        </View>
      ) : null}
      {mode === "approve" ? (
        <>
          {supervisors.length > 0 ? <Chips label={t("placement.fieldSupervisor")} value={supervisor} options={supervisors.map((s) => ({ value: s.membershipId, label: s.name }))} onChange={setSupervisor} /> : <Text variant="sm" tone="warn">{t("deskParity.noSupervisors")}</Text>}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
            <Button label={t("placement.approve")} disabled={!supervisor || decide.isPending} busy={decide.isPending} onPress={() => decide.mutate(true)} />
            <Button label={t("common.cancel")} variant="secondary" disabled={decide.isPending} onPress={() => setMode("none")} />
          </View>
        </>
      ) : null}
      {mode === "refuse" ? (
        <>
          <Field label={t("placement.fieldReason")} value={reason} onChangeText={setReason} maxLength={500} multiline />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
            <Button label={t("collegeOffice.refuse")} variant="danger" disabled={reason.trim().length < 3 || decide.isPending} busy={decide.isPending} onPress={() => decide.mutate(false)} />
            <Button label={t("common.cancel")} variant="secondary" disabled={decide.isPending} onPress={() => setMode("none")} />
          </View>
        </>
      ) : null}
      {evaluable && mode === "none" ? <Button label={t("deskParity.evaluate")} accessibilityLabel={`${t("deskParity.evaluate")}: ${item.studentName}`} variant="secondary" onPress={() => setMode("evaluate")} /> : null}
      {mode === "evaluate" ? (
        <>
          <Chips label={t("placement.fieldGrade")} value={grade} options={[{ value: "", label: "—" }, ...INDUSTRY_GRADES.map((g) => ({ value: g, label: g }))]} onChange={setGrade} />
          <Field label={t("placement.fieldVisit")} hint={t("deskParity.dateHint")} value={visit} onChangeText={setVisit} placeholder={todayKey()} autoCapitalize="none" autoCorrect={false} maxLength={10} />
          <Field label={t("placement.fieldViva")} value={viva} onChangeText={setViva} keyboardType="number-pad" maxLength={3} />
          {canDecide ? <Field label={t("placement.fieldCredits")} hint={t("deskParity.creditsHint", { max: creditsMax })} value={credits} onChangeText={setCredits} keyboardType="number-pad" maxLength={2} /> : null}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
            <Button label={t("common.save")} disabled={evaluate.isPending} busy={evaluate.isPending} onPress={() => evaluate.mutate()} />
            <Button label={t("common.cancel")} variant="secondary" disabled={evaluate.isPending} onPress={() => setMode("none")} />
          </View>
        </>
      ) : null}
      {mode !== "none" ? <OfflineDecisionNote /> : null}
    </View>
  );
}

/** One project: its guide, students and reviews; the guide records the next review here. */
function ProjectCard({ project, onDone }: { project: ProjectView; onDone: Done }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [on, setOn] = useState(todayKey());
  const [note, setNote] = useState("");
  const [marks, setMarks] = useState("");
  const [final, setFinal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const review = useMutation({
    mutationFn: async () => {
      if (!DATE_KEY.test(on.trim())) throw new Error(t("deskParity.checkDate"));
      const m = marks.trim() === "" ? null : Number(marks.trim());
      if (m !== null && (!Number.isFinite(m) || m < 0 || m > 100)) throw new Error(t("deskParity.checkMarks"));
      return projectViewSchema.parse(unwrap(await api().post(`/api/v1/placement/projects/${project.id}/review`, { on: on.trim(), note: note.trim(), marks: m, final })));
    },
    onSuccess: () => {
      setOpen(false);
      setNote("");
      setMarks("");
      setFinal(false);
      setError(null);
      onDone({ tone: "ok", text: t("deskParity.reviewSaved") });
      void qc.invalidateQueries({ queryKey: ["placement"] });
    },
    onError: (e: Error) => setError(e.message),
  });
  const last = project.reviews.length ? project.reviews[project.reviews.length - 1]! : null;
  return (
    <View style={{ gap: th.space[2], paddingVertical: th.space[2], borderTopWidth: 1, borderColor: th.border }}>
      <Row title={project.title} caption={[`${t("placement.fieldGuide")}: ${project.guideName}`, project.students.map((s) => s.name).join(", "), t("deskParity.reviewsN", { count: project.reviews.length }), last ? `${formatDateKey(last.on, locale)}: ${last.note}` : null, project.marks === null ? null : t("placement.marksIs", { marks: project.marks })].filter(Boolean).join(" · ")} />
      {error ? (
        <Text variant="sm" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      {project.marks === null && !open ? <Button label={t("deskParity.recordReview")} accessibilityLabel={`${t("deskParity.recordReview")}: ${project.title}`} variant="secondary" onPress={() => setOpen(true)} /> : null}
      {open ? (
        <>
          <Field label={t("placement.fieldDay")} hint={t("deskParity.dateHint")} value={on} onChangeText={setOn} autoCapitalize="none" autoCorrect={false} maxLength={10} />
          <Field label={t("placement.fieldReview")} value={note} onChangeText={setNote} maxLength={2000} multiline />
          <Field label={t("placement.fieldMarks")} value={marks} onChangeText={setMarks} keyboardType="number-pad" maxLength={3} />
          <SwitchRow label={t("placement.fieldFinal")} value={final} onChange={setFinal} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
            <Button label={t("common.save")} disabled={note.trim().length < 3 || review.isPending} busy={review.isPending} onPress={() => review.mutate()} />
            <Button label={t("common.cancel")} variant="secondary" disabled={review.isPending} onPress={() => setOpen(false)} />
          </View>
          <OfflineDecisionNote />
        </>
      ) : null}
    </View>
  );
}
