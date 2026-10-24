import { useEffect, useState, type ReactNode } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  CLINICAL_STREAMS,
  LOGBOOK_KINDS,
  clinicalDeskSchema,
  clinicalSupervisionSchema,
  familyClinicalSchema,
  streamRecordsIdSchema,
  type ClinicalPosting,
  type LogbookEntry,
  type LogbookKind,
  type LogbookQueueRow,
} from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Stat, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { listQueued, newClientId, onQueueEvent } from "@/lib/outbox";
import { useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { formatDate } from "@/lib/dates";
import { Chips, Notice } from "../staff/shared";
import { OutboxBadge, postOrQueue, todayKey, useOutboxRunner } from "../teacher/support";

/**
 * THE CLINICAL DESK ON THE PHONE (R-56, the clinical half; 10 Oct 2026).
 *
 * ClinicalDeskScreen is two screens in one, as the web's two pages: the
 * coordinator (a FACULTY or HOD holding CLINICAL_COORDINATOR), the office and
 * the head read the whole desk (GET /api/v1/duties/clinical: the sites,
 * today's postings first, the signing queue); any other FACULTY or HOD reads
 * their own side (GET /api/v1/duties/clinical/supervising: the postings they
 * supervise and the entries waiting for their signature). Signing and
 * returning are online writes — the server decides the right per entry
 * (`canSign`) and says so. Sites and postings are kept on the web.
 *
 * ClinicalLogbookScreen is the student's (GET /api/v1/family/clinical): the
 * postings, the logbook with each entry's state, a new entry (or a draft or
 * returned one corrected) queued through the outbox with a client id when
 * there is no signal, since the server writes one row per client id; the
 * hand-in is online, so it never runs ahead of an entry still in the outbox.
 */

type T = ReturnType<typeof useT>;
const KIND_KEY = (k: string) => `duties.clinical.logKind.${k}` as TranslationKey;
const STATE_KEY = (s: string) => `duties.clinical.state.${s}` as TranslationKey;
const STATE_TONE: Record<string, "ok" | "warn" | "danger" | "fg"> = { SIGNED: "ok", SUBMITTED: "warn", RETURNED: "danger", DRAFT: "fg" };

function Refused({ title, body, icon }: { title: string; body: string; icon: string }) {
  const t = useT();
  const router = useRouter();
  return (
    <Screen title={title}>
      <Empty icon={icon} title={title} body={body} action={<Button label={t("nav.more")} variant="secondary" onPress={() => router.push("/(app)/more" as never)} />} />
    </Screen>
  );
}

function useWrite<A, R>(fn: (args: A) => Promise<R>, saved: string, refetch: () => unknown) {
  const toast = useToast();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      toast.show(saved, "ok");
      void refetch();
    },
    onError: (e: Error) => toast.show(e.message, "danger"),
  });
}

function PostingRow({ p, t }: { p: Omit<ClinicalPosting, "students"> & { students?: ClinicalPosting["students"] }; t: T }) {
  const counts = p.students?.map((s) => `${s.rollNumber != null ? `${s.rollNumber} · ` : ""}${s.name}: ${t("duties.clinical.studentCounts", { signed: s.signed, waiting: s.waiting, returned: s.returned, draft: s.draft })}`);
  return <Row icon={p.current ? "firstAid" : "calendar"} title={`${p.divisionName}${p.batchName ? ` · ${t("duties.clinical.batchLine", { batch: p.batchName })}` : ""} · ${p.siteName} › ${p.departmentName}${p.current ? ` · ${t("duties.clinical.currentBadge")}` : ""}`} caption={[t("duties.clinical.postingLine", { order: p.rotationOrder, from: formatDate(p.from), to: formatDate(p.to), supervisor: p.supervisorName }), ...(counts ?? [])].join("\n")} />;
}

/** One entry waiting, with the remark field and the two decisions where the reader may make them. */
function QueueRow({ e, onDone }: { e: LogbookQueueRow; onDone: () => unknown }) {
  const t = useT();
  const th = useTheme();
  const [remark, setRemark] = useState("");
  const sign = useWrite(async () => streamRecordsIdSchema.parse(unwrap(await api().post(`/api/v1/duties/clinical/logbook/${e.id}/sign`, { remark: remark.trim() }))), t("duties.clinical.signed"), onDone);
  const giveBack = useWrite(async () => streamRecordsIdSchema.parse(unwrap(await api().post(`/api/v1/duties/clinical/logbook/${e.id}/return`, { remark: remark.trim() }))), t("duties.clinical.returned"), onDone);
  const line = t("duties.clinical.queueLine", { student: e.studentName, site: e.siteName, department: e.departmentName, day: formatDate(e.on) });
  return (
    <View style={{ gap: th.space[2], paddingVertical: th.space[2], borderTopWidth: 1, borderTopColor: th.border }}>
      <Text bold>{line}</Text>
      <Text variant="sm" tone="muted">
        {[t("duties.clinical.entryLine", { kind: t(KIND_KEY(e.kind)), count: e.count }), e.note || null].filter(Boolean).join(" · ")}
      </Text>
      {e.canSign ? (
        <>
          <Field label={t("duties.clinical.fieldRemark")} value={remark} onChangeText={setRemark} maxLength={400} hint={t("duties.clinical.returnHint")} />
          <View style={{ flexDirection: "row", gap: th.space[2] }}>
            <Button label={t("duties.clinical.sign")} busy={sign.isPending} onPress={() => sign.mutate(undefined)} accessibilityLabel={`${t("duties.clinical.sign")}: ${e.studentName}`} />
            <Button label={t("duties.clinical.returnIt")} variant="secondary" busy={giveBack.isPending} disabled={remark.trim().length < 3} onPress={() => giveBack.mutate(undefined)} accessibilityLabel={`${t("duties.clinical.returnIt")}: ${e.studentName}`} />
          </View>
        </>
      ) : (
        <Text variant="sm" tone="muted">
          {t("duties.clinical.readOnlySigner")}
        </Text>
      )}
    </View>
  );
}

function Queue({ queue, onDone }: { queue: LogbookQueueRow[]; onDone: () => unknown }) {
  const t = useT();
  return (
    <Card title={t("duties.clinical.queueTitle")}>
      {queue.length === 0 ? <Text tone="muted">{t("duties.clinical.noQueue")}</Text> : null}
      {queue.map((e) => (
        <QueueRow key={e.id} e={e} onDone={onDone} />
      ))}
    </Card>
  );
}

export function ClinicalDeskScreen() {
  const t = useT();
  const th = useTheme();
  const session = useSession();
  const me = session.status === "signed-in" ? session.me : null;
  const role = me?.active.role ?? null;
  const teacher = role === "FACULTY" || role === "HOD";
  const holder = teacher && (me?.duties ?? []).includes("CLINICAL_COORDINATOR");
  const office = role === "ADMIN" || role === "PRINCIPAL";
  const whole = holder || office;
  const on = (me?.modules ?? []).includes("ACADEMICS");
  const desk = useQuery({ queryKey: ["duties", "clinical"], enabled: whole && on, queryFn: async () => clinicalDeskSchema.parse(unwrap(await api().get("/api/v1/duties/clinical"))) });
  const mine = useQuery({ queryKey: ["duties", "clinical", "supervising"], enabled: teacher && !holder && on, queryFn: async () => clinicalSupervisionSchema.parse(unwrap(await api().get("/api/v1/duties/clinical/supervising"))) });
  const title = t(whole ? "duties.clinical.title" : "duties.clinical.supervisingTitle");
  if (!whole && !teacher) return <Refused title={title} body={t("duties.refuseNoDuty")} icon="shield" />;
  if (!on) return <Refused title={title} body={t("duties.moduleOff")} icon="puzzle" />;
  const q = whole ? desk : mine;
  const refetch = () => void q.refetch();
  const d = desk.data;
  const s = mine.data;
  const postings = (whole ? d?.postings : s?.postings) ?? [];
  const queue = (whole ? d?.queue : s?.queue) ?? [];
  const offered = whole ? d?.offered : s?.offered;
  return (
    <Screen title={title} description={t(whole ? "duties.clinical.intro" : "duties.clinical.supervisingIntro")} refreshing={q.isRefetching} onRefresh={refetch}>
      {q.isPending ? <Loading /> : null}
      {q.isError ? <Failed message={q.error.message} onRetry={refetch} /> : null}
      {q.data ? (
        <>
          {offered === false ? <Text tone="muted">{t("duties.clinical.notOffered")}</Text> : null}
          {d ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
              <Stat label={t("duties.clinical.statSites")} value={d.summary.sites} />
              <Stat label={t("duties.clinical.statCurrent")} value={d.summary.current} />
              <Stat label={t("duties.clinical.statSigned")} value={`${d.summary.signed} / ${d.summary.entries}`} />
              <Stat label={t("duties.clinical.statWaiting")} value={d.summary.waiting} tone={d.summary.waiting > 0 ? "warn" : "ok"} />
            </View>
          ) : null}
          <Queue queue={queue} onDone={refetch} />
          <Card title={t("duties.clinical.postingsTitle")}>
            {postings.length === 0 ? <Text tone="muted">{t(whole ? "duties.clinical.noPostingsRead" : "duties.clinical.noSupervisingBody")}</Text> : null}
            {postings.map((p) => (
              <PostingRow key={p.id} p={p} t={t} />
            ))}
          </Card>
          {d ? (
            <Card title={t("duties.clinical.sitesTitle")}>
              {d.sites.length === 0 ? <Text tone="muted">{t("duties.clinical.noSites")}</Text> : null}
              {d.sites.map((site) => (
                <Row key={site.id} icon="buildings" title={`${site.name} · ${t(`duties.clinical.kind.${site.kind}` as TranslationKey)}`} caption={[site.agreementLapsed ? t(site.agreementTo ? "duties.clinical.agreementLapsed" : "duties.clinical.agreementNone") : site.agreementFrom && site.agreementTo ? t("duties.clinical.agreementLine", { from: formatDate(site.agreementFrom), to: formatDate(site.agreementTo) }) : null, t("duties.clinical.contactLine", { role: t(`duties.clinical.contact.${site.contactRole}` as TranslationKey) }), site.departments.map((dep) => [dep.name, dep.beds != null ? t("duties.clinical.bedsN", { count: dep.beds }) : null].filter(Boolean).join(" · ")).join("; ") || null].filter(Boolean).join("\n")} />
              ))}
            </Card>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

/* ------------------------------------------------------------- the student */

type Draft = { id: string | null; clientId: string; postingId: string; on: string; kind: LogbookKind; count: string; note: string };
const LOGBOOK_TAG = "clinical-logbook";

/** An entry saved offline, read back from the outbox: what the student wrote, waiting for the network (QA-15). */
type QueuedEntry = { rowId: string; clientId: string; postingId: string; on: string; kind: string; count: number; note: string };

/** The logbook's rows waiting in the outbox, live: refreshed whenever something is queued or a flush ends. */
function useQueuedEntries(): QueuedEntry[] {
  const [rows, setRows] = useState<QueuedEntry[]>([]);
  useEffect(() => {
    let alive = true;
    const refresh = () => {
      void listQueued(LOGBOOK_TAG).then((items) => {
        if (!alive) return;
        setRows(
          items.flatMap((item) => {
            try {
              const b = JSON.parse(item.body) as Partial<Record<keyof QueuedEntry, unknown>>;
              return [{ rowId: item.id, clientId: String(b.clientId ?? ""), postingId: String(b.postingId ?? ""), on: String(b.on ?? ""), kind: String(b.kind ?? "CASE"), count: Number(b.count) || 1, note: String(b.note ?? "") }];
            } catch {
              return [];
            }
          }),
        );
      });
    };
    refresh();
    const stop = onQueueEvent(refresh);
    return () => {
      alive = false;
      stop();
    };
  }, []);
  return rows;
}
const fresh = (postingId: string, today: string): Draft => ({ id: null, clientId: newClientId(), postingId, on: today, kind: "CASE", count: "1", note: "" });

function EntryRow({ e, onCorrect, onSubmitted }: { e: LogbookEntry; onCorrect: (e: LogbookEntry) => void; onSubmitted: () => unknown }) {
  const t = useT();
  const th = useTheme();
  const submit = useWrite(async () => streamRecordsIdSchema.parse(unwrap(await api().post(`/api/v1/family/clinical/logbook/${e.id}/submit`, {}))), t("duties.clinical.submitted"), onSubmitted);
  const editable = e.state === "DRAFT" || e.state === "RETURNED";
  const lines: ReactNode[] = [];
  if (e.note) lines.push(e.note);
  if (e.state === "SIGNED" && e.signedAt) lines.push(`${t("duties.clinical.signedLine", { name: e.signedByName ?? "", day: formatDate(e.signedAt) })}${e.remark ? ` — ${e.remark}` : ""}`);
  if (e.state === "RETURNED") lines.push(t("duties.clinical.returnedLine", { remark: e.remark }));
  return (
    <View style={{ gap: th.space[2], paddingVertical: th.space[2], borderTopWidth: 1, borderTopColor: th.border }}>
      <Text bold>{`${formatDate(e.on)} · ${e.siteName} › ${e.departmentName}`}</Text>
      <Text variant="sm" tone={STATE_TONE[e.state] ?? "fg"}>
        {`${t("duties.clinical.entryLine", { kind: t(KIND_KEY(e.kind)), count: e.count })} · ${t(STATE_KEY(e.state))}`}
      </Text>
      {lines.map((line, i) => (
        <Text key={i} variant="sm" tone="muted">
          {line}
        </Text>
      ))}
      {editable ? (
        <View style={{ flexDirection: "row", gap: th.space[2] }}>
          <Button label={t("duties.clinical.submit")} busy={submit.isPending} onPress={() => submit.mutate(undefined)} accessibilityLabel={`${t("duties.clinical.submit")}: ${formatDate(e.on)}`} />
          <Button label={t("duties.clinical.correct")} variant="secondary" onPress={() => onCorrect(e)} accessibilityLabel={`${t("duties.clinical.correct")}: ${formatDate(e.on)}`} />
        </View>
      ) : null}
    </View>
  );
}

export function ClinicalLogbookScreen() {
  const t = useT();
  const th = useTheme();
  const toast = useToast();
  // An entry saved offline goes when the network returns, from this screen too (QA-15), and is shown waiting meanwhile.
  useOutboxRunner();
  const queued = useQueuedEntries();
  const session = useSession();
  const me = session.status === "signed-in" ? session.me : null;
  const on = (me?.modules ?? []).includes("ACADEMICS");
  const streams = me?.streams ?? [];
  const offeredHere = streams.length === 0 || streams.some((s) => CLINICAL_STREAMS.includes(s));
  const [draft, setDraft] = useState<Draft | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const mine = useQuery({ queryKey: ["family", "clinical"], enabled: on && offeredHere, queryFn: async () => familyClinicalSchema.parse(unwrap(await api().get("/api/v1/family/clinical"))) });
  // When the outbox sends what waited, the server's list has it: read it again, so the entry moves from waiting to the logbook.
  const refetchMine = mine.refetch;
  useEffect(() => onQueueEvent((e) => void (e.type === "flushed" && e.sent > 0 ? refetchMine() : undefined)), [refetchMine]);
  const save = useMutation({
    mutationFn: async (x: Draft) => postOrQueue({ url: "/api/v1/family/clinical/logbook", tag: LOGBOOK_TAG, body: { ...(x.id ? { id: x.id } : {}), clientId: x.clientId, postingId: x.postingId, on: x.on, kind: x.kind, count: Number(x.count) || 1, note: x.note.trim() } }),
    onSuccess: (outcome) => {
      if (outcome.kind === "refused") {
        setNotice({ tone: "danger", text: outcome.message });
        return;
      }
      if (outcome.kind === "queued") setNotice({ tone: "ok", text: t("common.queuedOffline") });
      else toast.show(t("duties.clinical.entrySaved"), "ok");
      setDraft(null);
      void mine.refetch();
    },
    onError: (e: Error) => setNotice({ tone: "danger", text: e.message }),
  });
  const title = t("duties.clinical.myTitle");
  if (!on || !offeredHere) return <Refused title={title} body={t(on ? "duties.clinical.notOffered" : "duties.moduleOff")} icon="puzzle" />;
  const d = mine.data;
  // The server's own day (its clock, the college's zone), not the phone's: a posting that opens on the server's tomorrow
  // is not open yet here, whatever the device says (the clinical test turned over on 19 Oct 2026).
  const today = d?.today ?? todayKey();
  const open = (d?.postings ?? []).filter((p) => p.from <= today);
  const dayOk = draft ? /^\d{4}-\d{2}-\d{2}$/.test(draft.on) : false;
  return (
    <Screen title={title} description={t("duties.clinical.myIntro")} refreshing={mine.isRefetching} onRefresh={() => void mine.refetch()}>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      {mine.isPending ? <Loading /> : null}
      {mine.isError ? <Failed message={mine.error.message} onRetry={() => void mine.refetch()} /> : null}
      {d ? (
        <>
          {!d.offered ? <Text tone="muted">{t("duties.clinical.notOffered")}</Text> : null}
          <Text variant="sm" tone="muted">
            {t("duties.clinical.mySummary", d.summary)}
          </Text>
          <OutboxBadge tag={LOGBOOK_TAG} />
          <Card title={t("duties.clinical.myPostingsTitle")}>
            {d.postings.length === 0 ? <Text tone="muted">{t("duties.clinical.noMyPostingsBody")}</Text> : null}
            {d.postings.map((p) => (
              <Row key={p.id} icon={p.current ? "firstAid" : "calendar"} title={`${p.siteName} › ${p.departmentName}${p.current ? ` · ${t("duties.clinical.currentBadge")}` : ""}`} caption={t("duties.clinical.myPostingLine", { site: p.siteName, department: p.departmentName, from: formatDate(p.from), to: formatDate(p.to), supervisor: p.supervisorName })} />
            ))}
          </Card>
          <Card title={t("duties.clinical.logbookTitle")} action={open.length > 0 && !draft ? <Button label={t("duties.clinical.newEntryTitle")} variant="secondary" onPress={() => setDraft(fresh(open[0]!.id, today))} /> : undefined}>
            {draft ? (
              <View style={{ gap: th.space[2] }}>
                <Text bold>{t(draft.id ? "duties.clinical.correctEntryTitle" : "duties.clinical.newEntryTitle")}</Text>
                {!draft.id ? <Chips label={t("duties.clinical.fieldPosting")} value={draft.postingId} options={open.map((p) => ({ value: p.id, label: `${p.siteName} › ${p.departmentName}` }))} onChange={(postingId) => setDraft({ ...draft, postingId })} /> : null}
                <Field label={t("duties.clinical.fieldDay")} value={draft.on} onChangeText={(on) => setDraft({ ...draft, on })} placeholder="YYYY-MM-DD" autoCapitalize="none" keyboardType="numbers-and-punctuation" />
                <Chips label={t("duties.clinical.fieldEntryKind")} value={draft.kind} options={LOGBOOK_KINDS.map((k) => ({ value: k, label: t(KIND_KEY(k)) }))} onChange={(kind) => setDraft({ ...draft, kind })} />
                <Field label={t("duties.clinical.fieldCount")} value={draft.count} onChangeText={(count) => setDraft({ ...draft, count })} keyboardType="number-pad" />
                <Field label={t("duties.clinical.fieldNote")} value={draft.note} onChangeText={(note) => setDraft({ ...draft, note })} hint={t("duties.clinical.noteHint")} maxLength={1000} multiline />
                <View style={{ flexDirection: "row", gap: th.space[2] }}>
                  <Button label={t("duties.clinical.addEntry")} busy={save.isPending} disabled={!dayOk || !draft.postingId} onPress={() => save.mutate(draft)} />
                  <Button label={t("common.cancel")} variant="ghost" onPress={() => setDraft(null)} />
                </View>
              </View>
            ) : null}
            {queued.map((q) => {
              const p = d.postings.find((x) => x.id === q.postingId);
              return (
                <View key={q.rowId} accessibilityLiveRegion="polite" style={{ gap: th.space[1], paddingVertical: th.space[2], borderTopWidth: 1, borderTopColor: th.border }}>
                  <Text bold>{p ? `${formatDate(q.on)} · ${p.siteName} › ${p.departmentName}` : formatDate(q.on)}</Text>
                  <Text variant="sm" tone="warn">
                    {`${t("duties.clinical.entryLine", { kind: t(KIND_KEY(q.kind)), count: q.count })} · ${t("duties.clinical.queuedState")}`}
                  </Text>
                  {q.note ? (
                    <Text variant="sm" tone="muted">
                      {q.note}
                    </Text>
                  ) : null}
                </View>
              );
            })}
            {d.entries.length === 0 && queued.length === 0 && !draft ? <Text tone="muted">{t(open.length > 0 ? "duties.clinical.noEntriesBody" : "duties.clinical.noMyPostingsBody")}</Text> : null}
            {d.entries.map((e) => (
              <EntryRow key={e.id} e={e} onCorrect={(x) => setDraft({ id: x.id, clientId: x.clientId, postingId: x.postingId, on: x.on, kind: x.kind, count: String(x.count), note: x.note })} onSubmitted={() => mine.refetch()} />
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
