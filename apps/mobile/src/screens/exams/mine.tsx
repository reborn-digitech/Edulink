import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { examActionResultSchema, familyChildrenSchema, myExamsSchema } from "@edulink/contracts";
import { formatPaise } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { bytesApi, shareBytes } from "@/lib/download";
import { useLocale, useT } from "@/lib/i18n";
import { useRole, useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { Notice } from "../staff/shared";
import { ChildSwitcher, childQuery, formatInstant } from "../family/shared";
import { BACKLOG_KEY, CLASS_KEY, CREDIT_KEY, DOC_KIND_KEY, FORM_STATUS_KEY, RESULT_KEY, REVAL_KIND_KEY, REVAL_OUTCOME_KEY, marks } from "./words";
import { formatDate } from "@/lib/dates";
import { demandStatusLabel } from "../shared/fees";

/**
 * A college student's exams on the phone (module EXAMS, 4 Oct 2026) — the
 * web's /student/exams, and for a guardian /parent/results read-only (a
 * minor's always, an adult's under the RESULTS grant): the form with its fee
 * and no-dues to submit, backlogs to add, the hall ticket and grade cards to
 * the share sheet, the seats, each published result with photocopy and
 * revaluation while the window is open, backlogs and the credit statement.
 */
export function CollegeExamsScreen() {
  const t = useT();
  const { locale } = useLocale();
  const th = useTheme();
  const role = useRole();
  const router = useRouter();
  const session = useSession();
  const qc = useQueryClient();
  const parent = role === "PARENT";
  const [childId, setChildId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const children = useQuery({ queryKey: ["family", "children"], enabled: parent, queryFn: async () => familyChildrenSchema.parse(unwrap(await api().get("/api/v1/family/children"))) });
  const mine = useQuery({ queryKey: ["exam-cell", "mine", childId], queryFn: async () => myExamsSchema.parse(unwrap(await api().get(`/api/v1/exam-cell/mine${childQuery(childId)}`))) });
  const done = (text: string) => {
    setNotice({ tone: "ok", text });
    void qc.invalidateQueries({ queryKey: ["exam-cell"] });
  };
  const failed = (e: Error) => setNotice({ tone: "danger", text: e.message });
  const submit = useMutation({ mutationFn: async (formId: string) => examActionResultSchema.parse(unwrap(await api().post(`/api/v1/exam-cell/forms/${formId}/submit`, {}))), onSuccess: () => done(t("examCell.formSubmitted")), onError: failed });
  const backlog = useMutation({ mutationFn: async (v: { sessionId: string; courseId: string }) => examActionResultSchema.parse(unwrap(await api().post("/api/v1/exam-cell/mine/backlogs", v))), onSuccess: () => done(t("examCell.backlogAdded")), onError: failed });
  const reval = useMutation({ mutationFn: async (v: { sessionId: string; courseId: string; kind: "PHOTOCOPY" | "REVAL" }) => examActionResultSchema.parse(unwrap(await api().post("/api/v1/exam-cell/mine/revaluations", v))), onSuccess: (r) => done(t(r.count === 0 ? "examCell.revalAskedNoFee" : "examCell.revalAsked")), onError: failed });
  const share = async (key: string, path: string, fileName: string) => {
    setBusy(key);
    setNotice(null);
    const fallback = t("common.somethingWrong");
    const got = await bytesApi.get(path, fallback);
    const error = got.ok ? await shareBytes(got, fileName, fallback) : got.error;
    setBusy(null);
    if (error) setNotice({ tone: "danger", text: error });
  };
  const more = <Button label={t("nav.more")} variant="secondary" onPress={() => router.push("/(app)/more" as never)} />;
  const offHere = session.status === "signed-in" && !parent && !(session.me.modules ?? []).includes("EXAMS");
  if (offHere) {
    return (
      <Screen title={t("examCell.mineTitle")}>
        <Empty icon="puzzle" title={t("modules.offTitle", { module: t("modules.examsName") })} body={t("modules.offBodyCollege", { module: t("modules.examsName") })} action={more} />
      </Screen>
    );
  }
  const d = mine.data;
  const money = (p: number) => formatPaise(p, locale, { always: true });
  const nothing = d && d.forms.length === 0 && d.results.length === 0 && d.tickets.length === 0;
  return (
    <Screen title={parent ? t("examCell.parentTitle") : t("examCell.mineTitle")} description={d ? t("examCell.mineIntro", { name: d.name }) : undefined} refreshing={mine.isRefetching} onRefresh={() => void mine.refetch()}>
      {parent ? <ChildSwitcher pupils={children.data?.children ?? []} selectedId={childId} onSelect={setChildId} /> : null}
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      {mine.isPending ? <Loading /> : null}
      {mine.isError ? <Failed message={mine.error.message} onRetry={() => void mine.refetch()} /> : null}
      {nothing ? <Empty icon="clipboard" title={t("examCell.mineNothing")} body={t("examCell.mineNothingBody")} action={more} /> : null}
      {d?.forms.map((f) => (
        <Card key={f.id} title={t("examCell.formFor", { session: f.sessionName })}>
          <Text bold>{t(FORM_STATUS_KEY[f.status]!)}</Text>
          <Text variant="sm" tone="muted">
            {f.windowOpen ? t("examCell.windowOpenUntil", { date: f.closesAt ? formatInstant(f.closesAt, locale) : "—" }) : t("examCell.windowShut")}
          </Text>
          {f.courses.map((c) => (
            <Row key={c.courseId} title={`${c.code} ${c.name}`} caption={c.kind === "BACKLOG" ? t("examCell.kindBACKLOG") : undefined} />
          ))}
          {f.status !== "DRAFT" && !f.moneyWithheld ? <Text>{[t("examCell.feeLine", { fee: money(f.feePaise + f.lateFeePaise) }), f.demandStatus ? demandStatusLabel(t, f.demandStatus) : null].filter(Boolean).join(" · ")}</Text> : null}
          {f.eligibilityNote ? <Text tone="danger">{f.eligibilityNote}</Text> : null}
          {f.noDuesLines.some((l) => !l.cleared) ? <Text tone="danger">{t("examCell.noDuesPending", { desks: f.noDuesLines.filter((l) => !l.cleared).map((l) => l.desk).join(", ") })}</Text> : null}
          {f.refusalReason ? <Text tone="danger">{f.refusalReason}</Text> : null}
          {d.canAct && f.status === "DRAFT" && f.windowOpen ? <Button label={t("examCell.submitForm")} busy={submit.isPending} onPress={() => submit.mutate(f.id)} /> : null}
          {d.canAct
            ? f.backlogsToAdd.map((b) => <Button key={b.courseId} variant="secondary" label={t("examCell.addBacklog", { course: b.code })} busy={backlog.isPending} onPress={() => backlog.mutate({ sessionId: f.sessionId, courseId: b.courseId })} />)
            : null}
        </Card>
      ))}
      {d && (d.tickets.length > 0 || d.seating.length > 0) ? (
        <Card title={t("examCell.ticketsAndSeats")}>
          {d.tickets.map((x) => (
            <Row key={x.id} title={t("examCell.hallTicketNo", { number: x.number })} caption={x.sessionName} right={<Button variant="secondary" label={t("examCell.download")} accessibilityLabel={t("examCell.hallTicketNo", { number: x.number })} busy={busy === x.id} onPress={() => void share(x.id, `/api/v1/exam-cell/hall-tickets/${x.id}/pdf`, `hall-ticket-${x.number}.pdf`)} />} />
          ))}
          {d.seating.map((s) => (
            <Row key={`${s.courseCode}-${s.at}`} title={`${s.courseCode} ${s.courseName}`} caption={`${formatInstant(s.at, locale)} · ${s.roomName} · ${t("examCell.seatNo", { seat: s.seatNo })}`} />
          ))}
        </Card>
      ) : null}
      {d && d.results.length > 0 ? (
        <Card title={t("examCell.standingTitle")}>
          <Text>{t("examCell.standingLine", { cgpa: d.cgpa?.toFixed(2) ?? "—", credits: d.creditsEarned })}</Text>
        </Card>
      ) : null}
      {d?.results.map((r) => (
        <Card key={r.sessionId} title={r.underCorrection.length ? `${r.sessionName} · ${t("examCell.underCorrection")}` : r.sessionName}>
          {r.underCorrection.length ? <Text tone="warn">{t("examCell.underCorrectionNote", { courses: r.result.courses.filter((c) => r.underCorrection.includes(c.courseId)).map((c) => c.code).join(", ") })}</Text> : null}
          <Text bold>
            {[`${t("examCell.sgpaLabel")} ${r.result.sgpa?.toFixed(2) ?? "—"}`, t(RESULT_KEY[r.result.status]!), r.result.cls ? t(CLASS_KEY[r.result.cls]!) : null].filter(Boolean).join(" · ")}
          </Text>
          {r.result.courses.map((c) => (
            <View key={c.courseId} style={{ gap: th.space[1] }}>
              <Row title={`${c.code} ${c.name}`} caption={`${c.grade} (${c.points}) · ${marks(c.totalMilli)} / ${marks(c.maxMilli)} · ${t(RESULT_KEY[c.status]!)}`} />
              {d.canAct && r.revaluationOpenUntil ? (
                <View style={{ flexDirection: "row", gap: th.space[2] }}>
                  {(["PHOTOCOPY", "REVAL"] as const).map((kind) => (
                    <Button key={kind} variant="ghost" label={t(REVAL_KIND_KEY[kind]!)} accessibilityLabel={`${t(REVAL_KIND_KEY[kind]!)}: ${c.code}`} busy={reval.isPending} onPress={() => reval.mutate({ sessionId: r.sessionId, courseId: c.courseId, kind })} />
                  ))}
                </View>
              ) : null}
            </View>
          ))}
        </Card>
      ))}
      {d && d.documents.length > 0 ? (
        <Card title={t("examCell.documentsTitle")}>
          {d.documents.map((x) => (
            <Row key={x.id} title={t(DOC_KIND_KEY[x.kind]!)} caption={x.serial} right={<Button variant="secondary" label={t("examCell.download")} accessibilityLabel={`${t(DOC_KIND_KEY[x.kind]!)} ${x.serial}`} busy={busy === x.id} onPress={() => void share(x.id, `/api/v1/exam-cell/documents/${x.id}/pdf`, `${x.serial.replace(/[^\w-]+/g, "-")}.pdf`)} />} />
          ))}
        </Card>
      ) : null}
      {d && d.revaluations.length > 0 ? (
        <Card title={t("examCell.revaluationsTitle")}>
          {d.revaluations.map((r) => (
            <Row key={r.id} title={`${r.courseCode} · ${t(REVAL_KIND_KEY[r.kind]!)}`} caption={r.correction ? t("examCell.underCorrection") : r.outcome ? t(REVAL_OUTCOME_KEY[r.outcome]!) : t("examCell.waitingDecision")} />
          ))}
        </Card>
      ) : null}
      {d && d.backlogs.length > 0 ? (
        <Card title={t("examCell.backlogsTitle")}>
          {d.backlogs.map((b) => (
            <Row key={b.id} title={`${b.courseCode} ${b.courseName}`} caption={`${t(BACKLOG_KEY[b.status]!)} · ${t("examCell.lastDay", { date: formatDate(b.lastDay) })}`} />
          ))}
        </Card>
      ) : null}
      {d && d.credits.length > 0 ? (
        <Card title={t("examCell.creditStatement")}>
          {d.credits.map((c) => (
            <Row key={c.id} title={c.termName} caption={`${t("examCell.creditsN", { count: c.credits })} · ${t(CREDIT_KEY[c.status]!)}`} />
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}
