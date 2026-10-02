import { useEffect, useRef, useState } from "react";
import { View, type TextInput } from "react-native";
import { useRouter } from "expo-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  operatorAuditSchema,
  operatorContentTeamSchema,
  operatorDashboardSchema,
  operatorExpertsSchema,
  operatorOverviewSchema,
  type OperatorDashboard,
  type OperatorExpertStandingBody,
  type OperatorExperts,
  type OperatorJob,
  type OperatorOverview,
} from "@edulink/contracts";
import { formatPaise, type TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Stat, SwitchRow, Text, useToast } from "@/components";
import { api, errorText } from "@/lib/api";
import { openFile } from "@/lib/open-file";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { Chips, openWeb } from "../staff/shared";
import { Note, Pill, relativeTime } from "../family/shared";

type Section = "schools" | "jobs" | "experts" | "team" | "log";
type SchoolState = "live" | "noadmin" | "unverified" | "removed" | "all";
type JobTone = "running" | "overdue" | "failed" | "ok";

/** How long the search waits after the last keystroke before it asks the server. */
const SEARCH_DEBOUNCE_MS = 300;
/** The server log's page: the endpoint's default, which is the web's page too. */
const AUDIT_PAGE = 50;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function operatorOverviewPath(q: string, state: SchoolState): string {
  const parts: string[] = [];
  if (q) parts.push(`q=${encodeURIComponent(q)}`);
  if (state !== "live") parts.push(`state=${state}`);
  return `/api/v1/operator/overview${parts.length ? `?${parts.join("&")}` : ""}`;
}

/** The web's /root/audit filters: an action or a family ("superuser."), a search, a UTC date range, live accounts only, a page. */
export type AuditFilter = { action: string; q: string; from: string; to: string; live: boolean };
const NO_FILTER: AuditFilter = { action: "", q: "", from: "", to: "", live: false };

export function operatorAuditPath(f: AuditFilter, page: number): string {
  const parts: string[] = [];
  if (f.action) parts.push(`action=${encodeURIComponent(f.action)}`);
  if (f.q) parts.push(`q=${encodeURIComponent(f.q)}`);
  if (f.from) parts.push(`from=${f.from}`);
  if (f.to) parts.push(`to=${f.to}`);
  if (f.live) parts.push("live=1");
  if (page > 1) parts.push(`page=${page}`);
  return `/api/v1/operator/audit${parts.length ? `?${parts.join("&")}` : ""}`;
}

function jobTone(job: OperatorJob): JobTone {
  if (job.running) return "running";
  if (job.overdue) return "overdue";
  if (job.lastFailed) return "failed";
  return "ok";
}

/** A write's refusal as an Error carrying the server's sentence. */
async function send(call: Promise<{ ok: true } | { ok: false; error: string }>, fallback: string): Promise<void> {
  const result = await call;
  if (!result.ok) throw new Error(errorText(result, fallback));
}

/**
 * The web's /root on a phone: the server's schools (each opens its own page
 * here; adding one is here too), its scheduled jobs, the expert queue with
 * its list / take-off / identity-checked decisions, the content team with
 * appoint and dismiss, and the server log under the web's filters — one
 * section at a time behind the chips. Erasing a school is the one thing
 * left to the web, from that school's page.
 */
export function OperatorHome() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const session = useSession();
  const [section, setSection] = useState<Section>("schools");
  const [typed, setTyped] = useState("");
  const [q, setQ] = useState("");
  const [state, setState] = useState<SchoolState>("live");
  useEffect(() => {
    const timer = setTimeout(() => setQ(typed.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [typed]);
  const query = useQuery({
    queryKey: ["operator", "overview", q, state],
    placeholderData: keepPreviousData,
    queryFn: async () => operatorOverviewSchema.parse(unwrap(await api().get(operatorOverviewPath(q, state)))),
  });
  /** The dashboard (2026-10-02): the tiles and the schools due within a week, a read of its own so the list above is not held up by it. */
  const dashboard = useQuery({
    queryKey: ["operator", "dashboard"],
    queryFn: async () => operatorDashboardSchema.parse(unwrap(await api().get("/api/v1/operator/dashboard"))),
  });
  const d = query.data;
  const name = session.me ? (session.me.user.preferredName ?? session.me.user.name) : "";
  const addSchool = () => router.push("/(app)/operator-new-school" as never);
  const openSchool = (schoolId: string) => router.push({ pathname: "/(app)/operator-school", params: { schoolId } } as never);
  return (
    <Screen title={t("root.serverAdministration")} description={t("root.operatorIntro")} refreshing={query.isRefetching} onRefresh={() => void qc.invalidateQueries({ queryKey: ["operator"] })}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: th.space[2], flexWrap: "wrap" }}>
        <Text variant="lg" bold style={{ flexShrink: 1 }}>
          {name}
        </Text>
        <Pill label={t("root.serverBadge")} tone="accent" />
      </View>
      {d ? (
        <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
          <Stat label={t("root.stateLive")} value={d.counts.live} />
          <Stat label={t("root.stateNoAdmin")} value={d.counts.noAdmin} tone={d.counts.noAdmin > 0 ? "warn" : "fg"} />
          <Stat label={t("root.stateUnverified")} value={d.counts.unverified} tone={d.counts.unverified > 0 ? "warn" : "fg"} />
          <Stat label={t("root.removedBadge")} value={d.counts.removed} />
          <Stat label={t("root.contentTeam")} value={d.counts.appAdmins} />
          <Stat label={t("expert.waitingForYou")} value={d.counts.expertsWaiting} tone={d.counts.expertsWaiting > 0 ? "accent" : "fg"} />
        </View>
      ) : null}
      <Chips
        label={t("shell.mainNav")}
        value={section}
        options={[
          { value: "schools", label: t("root.schools") },
          { value: "jobs", label: t("root.jobs") },
          { value: "experts", label: t("root.experts") },
          { value: "team", label: t("root.contentTeam") },
          { value: "log", label: t("root.serverLog") },
        ]}
        onChange={setSection}
      />
      {section === "schools" ? (
        <>
          {dashboard.isError ? <Failed message={dashboard.error.message} onRetry={() => void dashboard.refetch()} /> : null}
          {dashboard.data ? <Dashboard d={dashboard.data} onOpen={openSchool} /> : null}
          <Field label={t("common.searchLabel")} placeholder={t("root.searchPlaceholder")} value={typed} onChangeText={setTyped} returnKeyType="search" autoCapitalize="none" autoCorrect={false} />
          <Chips
            label={t("root.stateFilter")}
            value={state}
            options={[
              { value: "live", label: t("root.stateLive") },
              { value: "noadmin", label: t("root.stateNoAdmin") },
              { value: "unverified", label: t("root.stateUnverified") },
              { value: "removed", label: t("root.removedBadge") },
              { value: "all", label: t("vacancies.filterAll") },
            ]}
            onChange={setState}
          />
        </>
      ) : null}
      {(section === "schools" || section === "jobs") && query.isPending ? <Loading /> : null}
      {(section === "schools" || section === "jobs") && query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d && section === "schools" ? (
        <Schools
          d={d}
          narrowed={Boolean(q || state !== "live")}
          onOpen={openSchool}
          onAdd={addSchool}
          onClear={() => {
            setTyped("");
            setQ("");
            setState("live");
          }}
        />
      ) : null}
      {d && section === "jobs" ? (
        <>
          <Button label={t("root.metrics")} variant="secondary" onPress={() => router.push("/(app)/operator-metrics" as never)} />
          <Button label={t("gigs.opPayoutsTitle")} variant="secondary" onPress={() => router.push("/(app)/operator-payouts" as never)} />
          <Jobs jobs={d.jobs} onRefresh={() => void query.refetch()} />
        </>
      ) : null}
      {section === "experts" ? <Experts /> : null}
      {section === "team" ? <Team /> : null}
      {section === "log" ? <Log onAdd={addSchool} /> : null}
      <Button label={t("shell.signOut")} variant="ghost" onPress={() => void session.signOut()} />
    </Screen>
  );
}

/**
 * The web's dashboard tiles and its due-soon list: schools live, on trial,
 * due within thirty days, past due and suspended; pupils, this month's
 * texts and storage against the caps, jobs overdue, and what the partners
 * are owed this month (recorded only — nothing is collected here). The
 * guided onboarding stays on the web, where one form takes everything;
 * the note says so and opens it.
 */
function Dashboard({ d, onOpen }: { d: OperatorDashboard; onOpen: (schoolId: string) => void }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const ofCap = (used: number, cap: number | null, unit = "") => (cap === null ? `${used}${unit}` : t("root.tileOfCap", { used: `${used}${unit}`, cap: `${cap}${unit}` }));
  const dueLine = (days: number) => (days === 0 ? t("root.subscriptionDueToday") : days > 0 ? t("root.subscriptionDueIn", { days }) : t("root.subscriptionOverdue", { days: -days }));
  const statusKey = (status: string | null) => (status ? t(`root.status${status}` as TranslationKey) : t("root.subscriptionNotRecorded"));
  return (
    <>
      <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
        <Stat label={t("root.tileTrial")} value={d.tiles.trial} />
        <Stat label={t("root.tileDueSoon")} value={d.tiles.dueSoon} tone={d.tiles.dueSoon > 0 ? "warn" : "fg"} />
        <Stat label={t("root.tilePastDue")} value={d.tiles.pastDue} tone={d.tiles.pastDue > 0 ? "danger" : "fg"} />
        <Stat label={t("root.tileSuspended")} value={d.tiles.suspended} />
        <Stat label={t("root.tilePupils")} value={d.tiles.pupils} />
        <Stat label={t("root.tileMessages")} value={ofCap(d.tiles.messages, d.tiles.messageCap)} tone={d.tiles.messageCap !== null && d.tiles.messages > d.tiles.messageCap ? "danger" : "fg"} />
        <Stat label={t("root.tileStorage")} value={ofCap(d.tiles.storageMb, d.tiles.storageCapMb, " MB")} tone={d.tiles.storageCapMb !== null && d.tiles.storageMb > d.tiles.storageCapMb ? "danger" : "fg"} />
        <Stat label={t("root.tileJobsOverdue")} value={d.tiles.jobsOverdue} tone={d.tiles.jobsOverdue > 0 ? "danger" : "ok"} />
        <Stat label={t("root.tileOwed")} value={formatPaise(d.tiles.owedThisMonthPaise, locale)} tone="accent" />
      </View>
      <Text variant="xs" tone="subtle">
        {t("root.tilesNote")}
      </Text>
      <Card title={t("root.dueSoonTitle")}>
        {d.dueSoon.length === 0 ? (
          <Text variant="sm" tone="muted">
            {t("root.dueSoonNone")}
          </Text>
        ) : (
          d.dueSoon.map((s) => (
            <Row
              key={s.id}
              icon="receipt"
              title={s.name}
              caption={`${s.dueAt} · ${dueLine(s.daysToDue)}`}
              right={<Pill label={statusKey(s.status)} tone={s.daysToDue < 0 ? "danger" : "warn"} />}
              onPress={() => onOpen(s.id)}
            />
          ))
        )}
      </Card>
      <Note tone="accent">
        <Text variant="sm">{t("root.onboardOnWeb")}</Text>
        <Button label={t("root.onboardCta")} variant="secondary" onPress={() => openWeb("/root/onboard")} />
      </Note>
    </>
  );
}

function Schools({ d, narrowed, onOpen, onAdd, onClear }: { d: OperatorOverview; narrowed: boolean; onOpen: (schoolId: string) => void; onAdd: () => void; onClear: () => void }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  if (d.schools.length === 0 && !narrowed) {
    return <Empty icon="buildings" title={t("root.noSchoolsYet")} body={t("root.addFirstOne")} action={<Button label={t("root.addSchool")} onPress={onAdd} />} />;
  }
  return (
    <>
      {d.schools.length === 0 ? (
        <Empty title={t("common.noResultsTitle")} body={t("common.noResultsBody")} action={<Button label={t("common.clearAll")} variant="secondary" onPress={onClear} />} />
      ) : (
        <Card title={t("root.schools")}>
          {d.schools.map((s) => (
            <Row
              key={s.id}
              icon="buildings"
              title={s.name}
              caption={[
                [s.city, s.country].filter(Boolean).join(", ") || t("root.noAddress"),
                s.removedAt ? null : `${t("root.joinCode")} ${s.code}`,
                s.removedAt ? t("root.removedAgo", { when: relativeTime(s.removedAt, locale) }) : t("root.joinedAgo", { when: relativeTime(s.createdAt, locale) }),
              ]
                .filter(Boolean)
                .join(" · ")}
              right={
                s.removedAt ? (
                  <Pill label={t("root.removedBadge")} tone="danger" />
                ) : !s.verifiedAt || s.pendingAdminInvites > 0 ? (
                  // A school that registered itself is often both: not yet checked, and its admin still to accept.
                  <View style={{ alignItems: "flex-end", gap: th.space[1] }}>
                    {!s.verifiedAt ? <Pill label={t("root.stateUnverified")} tone="warn" /> : null}
                    {s.pendingAdminInvites > 0 ? (
                      <Pill label={s.pendingAdminInvites === 1 ? t("root.invitesPendingOne") : t("root.invitesPendingMany", { count: s.pendingAdminInvites })} tone="warn" />
                    ) : null}
                  </View>
                ) : null
              }
              onPress={() => onOpen(s.id)}
            />
          ))}
        </Card>
      )}
      <Button label={t("root.addSchool")} onPress={onAdd} />
    </>
  );
}

function Jobs({ jobs, onRefresh }: { jobs: OperatorJob[]; onRefresh: () => void }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  if (jobs.length === 0) {
    return <Empty icon="clock" title={t("root.jobs")} body={t("root.jobsHow")} action={<Button label={t("ui.refresh")} variant="secondary" onPress={onRefresh} />} />;
  }
  const overdue = jobs.filter((j) => j.overdue).length;
  const failed = jobs.filter((j) => !j.overdue && j.lastFailed).length;
  const onTime = jobs.length - overdue - failed;
  const headline =
    overdue === 0 && failed > 0
      ? failed === 1
        ? t("root.jobsFailedOne")
        : t("root.jobsFailedMany", { count: failed })
      : overdue === 0
        ? t("root.jobsAllRunning")
        : overdue === 1
          ? t("root.jobsOverdueOne")
          : t("root.jobsOverdueMany", { count: overdue });
  const pillFor = (tone: JobTone) =>
    tone === "running" ? (
      <Pill label={t("root.jobRunning")} tone="accent" />
    ) : tone === "overdue" ? (
      <Pill label={t("root.jobOverdue")} tone="danger" />
    ) : tone === "failed" ? (
      <Pill label={t("root.jobFailedLast")} tone="warn" />
    ) : (
      <Pill label={t("root.jobOnTime")} tone="ok" />
    );
  return (
    <>
      <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
        <Stat label={t("root.jobOnTime")} value={onTime} tone="ok" />
        <Stat label={t("root.jobOverdue")} value={overdue} tone={overdue > 0 ? "danger" : "fg"} />
        <Stat label={t("root.jobFailedLast")} value={failed} tone={failed > 0 ? "warn" : "fg"} />
      </View>
      <Text variant="sm" tone="muted">
        {headline}
      </Text>
      {jobs.map((job) => {
        const tone = jobTone(job);
        return (
          <Card key={job.name} title={job.name} action={pillFor(tone)}>
            <Text variant="sm" tone="muted">
              {t(job.describeKey as TranslationKey)}
            </Text>
            <Text variant="xs" tone="subtle">
              {`${t("root.jobSchedule")}: ${job.schedule}`}
            </Text>
            <Text variant="xs" tone="subtle">
              {`${t("root.jobLastRun")}: ${job.lastRun ? `${relativeTime(job.lastRun.startedAt, locale)} · ${job.lastRun.ok === null ? t("root.jobRunning") : job.lastRun.ok ? t("root.jobOk") : t("root.jobFailed")}` : t("root.jobNever")}`}
            </Text>
            {job.lastRun && job.lastRun.summary && job.lastRun.summary !== "{}" ? (
              <Text variant="xs" tone="subtle">
                {`${t("root.jobCountedLabel")}: ${countedLine(job.lastRun.summary)}`}
              </Text>
            ) : null}
            <Text variant="xs" tone="subtle">
              {`${t("root.jobLastSuccess")}: ${job.lastSuccessAt ? relativeTime(job.lastSuccessAt, locale) : t("root.jobNever")}`}
            </Text>
            {job.lastRun?.error ? (
              <Note tone="danger">
                <Text variant="sm" tone="danger" bold>
                  {`${t("root.jobErrorLabel")}: ${job.lastRun.error}`}
                </Text>
              </Note>
            ) : null}
          </Card>
        );
      })}
    </>
  );
}

/* ------------------------------------------------------------------------- */
/* The expert queue                                                           */
/* ------------------------------------------------------------------------- */

type Expert = OperatorExperts["items"][number];
/** One decision about an expert: what it sets, what the button says, what the confirm asks, what the toast says after. */
type Standing = { next: OperatorExpertStandingBody; label: string; ask: string; done: string; tone: "accent" | "danger" };

const OFFERING: Record<string, TranslationKey> = { SESSIONS: "expert.offeringSessions", MENTORING: "expert.offeringMentoring", BOTH: "expert.offeringBoth" };

/**
 * The web's curation row: published ("may schools find them") and verified
 * ("has a human checked who they are") are two decisions, and verify is only
 * offered alongside listing — a badge on somebody nobody can see has no reader.
 */
function standingsFor(t: (key: TranslationKey, vars?: Record<string, string | number>) => string, e: Expert): Standing[] {
  const name = e.name;
  if (e.publishedAt !== null) {
    return [
      { next: { published: false, verified: false }, label: t("expert.takeOffList"), ask: t("expert.confirmTakeOff", { name }), done: t("expert.offListToast", { name }), tone: "danger" },
      ...(e.verifiedAt === null
        ? [{ next: { published: true, verified: true }, label: t("expert.markIdentityChecked"), ask: t("expert.confirmCheck", { name }), done: t("expert.markedCheckedToast"), tone: "accent" as const }]
        : []),
    ];
  }
  return [
    { next: { published: true, verified: false }, label: t("expert.listThem"), ask: t("expert.confirmList", { name }), done: t("expert.nowListedToast", { name }), tone: "accent" },
    { next: { published: true, verified: true }, label: t("expert.listAndCheck"), ask: t("expert.confirmListAndCheck", { name }), done: t("expert.listedAndCheckedToast", { name }), tone: "accent" },
  ];
}

const KYC_KEY: Record<Expert["kyc"]["status"], TranslationKey> = { NONE: "expert.kycStatusNONE", SUBMITTED: "expert.kycStatusSUBMITTED", VERIFIED: "expert.kycStatusVERIFIED", REJECTED: "expert.kycStatusREJECTED" };
const KYC_TONE: Record<Expert["kyc"]["status"], "muted" | "warn" | "ok" | "danger"> = { NONE: "muted", SUBMITTED: "warn", VERIFIED: "ok", REJECTED: "danger" };

/**
 * The web's KYC column: where an expert's papers stand, the papers
 * themselves (opened through a five-minute link, never a stored URL), and
 * the decision — verify, or reject with the reason the expert reads.
 */
function Kyc({ e }: { e: Expert }) {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [mode, setMode] = useState<"idle" | "verify" | "reject">("idle");
  const [reason, setReason] = useState("");
  const decide = useMutation({
    mutationFn: (decision: "VERIFIED" | "REJECTED") => send(api().post(`/api/v1/operator/experts/${e.profileId}/kyc`, { decision, note: reason }), t("root.didNotWork")),
    onSuccess: (_done, decision) => {
      setMode("idle");
      setReason("");
      toast.show(decision === "VERIFIED" ? t("expert.kycVerifiedToast", { name: e.name }) : t("expert.kycRejectedToast", { name: e.name }));
      void qc.invalidateQueries({ queryKey: ["operator", "experts"] });
      void qc.invalidateQueries({ queryKey: ["operator", "audit"] });
    },
    onError: (err) => toast.show(err.message, "danger"),
  });
  const k = e.kyc;
  return (
    <View style={{ gap: th.space[2], padding: th.space[3], borderRadius: th.radius.md, backgroundColor: th.surfaceMuted }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: th.space[2] }}>
        <Text variant="sm" bold>
          {t("expert.kycColumn")}
        </Text>
        <Pill label={t(KYC_KEY[k.status])} tone={KYC_TONE[k.status]} />
      </View>
      {k.note ? (
        <Text variant="sm" tone="muted">
          {k.note}
        </Text>
      ) : null}
      {k.documents.length === 0 ? (
        <Text variant="xs" tone="muted">
          {t("expert.kycNoPapers")}
        </Text>
      ) : (
        k.documents.map((doc, i) => (
          <Row
            key={doc.fileId}
            icon="paperclip"
            title={t("expert.kycOpenDocument", { n: i + 1 })}
            caption={doc.mime}
            onPress={() => {
              void openFile(doc.fileId, t("common.tryAgain")).then((error) => {
                if (error) toast.show(error, "danger");
              });
            }}
          />
        ))
      )}
      {k.documents.length > 0 && k.status !== "VERIFIED" && mode === "idle" ? (
        <View style={{ flexDirection: "row", gap: th.space[2], flexWrap: "wrap" }}>
          <Button label={t("expert.kycVerify")} accessibilityLabel={`${t("expert.kycVerify")}: ${e.name}`} onPress={() => setMode("verify")} style={{ flexGrow: 1 }} />
          <Button label={t("expert.kycReject")} accessibilityLabel={`${t("expert.kycReject")}: ${e.name}`} variant="secondary" onPress={() => setMode("reject")} style={{ flexGrow: 1 }} />
        </View>
      ) : null}
      {mode === "verify" ? (
        <Note tone="accent">
          <Text variant="sm" bold tone="accent">
            {t("expert.kycConfirmVerify", { name: e.name })}
          </Text>
          <View style={{ flexDirection: "row", gap: th.space[2] }}>
            <Button label={t("common.confirm")} busy={decide.isPending} onPress={() => decide.mutate("VERIFIED")} style={{ flexGrow: 1 }} />
            <Button label={t("common.keep")} variant="secondary" onPress={() => setMode("idle")} style={{ flexGrow: 1 }} />
          </View>
        </Note>
      ) : null}
      {mode === "reject" ? (
        <Note tone="danger">
          <Text variant="sm" bold tone="danger">
            {t("expert.kycConfirmReject", { name: e.name })}
          </Text>
          <Field label={t("expert.kycRejectReason")} value={reason} onChangeText={setReason} multiline maxLength={1000} />
          <View style={{ flexDirection: "row", gap: th.space[2] }}>
            <Button label={t("common.confirm")} variant="danger" busy={decide.isPending} disabled={reason.trim().length === 0} onPress={() => decide.mutate("REJECTED")} style={{ flexGrow: 1 }} />
            <Button label={t("common.keep")} variant="secondary" onPress={() => setMode("idle")} style={{ flexGrow: 1 }} />
          </View>
        </Note>
      ) : null}
    </View>
  );
}

function Experts() {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [confirming, setConfirming] = useState<{ profileId: string; index: number } | null>(null);
  const query = useQuery({
    queryKey: ["operator", "experts"],
    queryFn: async () => operatorExpertsSchema.parse(unwrap(await api().get("/api/v1/operator/experts"))),
  });
  const standing = useMutation({
    mutationFn: (input: { profileId: string; choice: Standing }) => send(api().post(`/api/v1/operator/experts/${input.profileId}/standing`, input.choice.next), t("root.didNotWork")),
    onSuccess: (_done, input) => {
      setConfirming(null);
      toast.show(input.choice.done);
      void qc.invalidateQueries({ queryKey: ["operator", "experts"] });
      void qc.invalidateQueries({ queryKey: ["operator", "overview"] });
      void qc.invalidateQueries({ queryKey: ["operator", "audit"] });
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  if (query.isPending) return <Loading />;
  if (query.isError) return <Failed message={query.error.message} onRetry={() => void query.refetch()} />;
  const items = query.data.items;
  if (items.length === 0) {
    return <Empty icon="star" title={t("expert.curationEmpty")} body={t("expert.curationEmptyBody")} action={<Button label={t("ui.refresh")} variant="secondary" onPress={() => void query.refetch()} />} />;
  }
  const waiting = items.filter((e) => e.publishedAt === null).length;
  return (
    <>
      <Text variant="sm" tone="muted">
        {t("expert.curationCount", { waiting, listed: items.length - waiting })}
      </Text>
      {items.map((e) => {
        const published = e.publishedAt !== null;
        const choices = standingsFor(t, e);
        const open = confirming?.profileId === e.profileId ? choices[confirming.index] : undefined;
        const offering = OFFERING[e.offering] ? t(OFFERING[e.offering]!) : e.offering;
        return (
          <Card key={e.profileId} title={e.name} action={published ? <Pill label={t("expert.listed")} tone="ok" /> : <Pill label={t("expert.waiting")} tone="warn" />}>
            <Text variant="sm" tone="muted">
              {[e.headline || t("expert.noHeadline"), e.organisation].filter(Boolean).join(" · ")}
            </Text>
            {e.email ? (
              <Text variant="xs" tone="subtle">
                {e.email}
              </Text>
            ) : null}
            <Text variant="sm">{[offering, e.mentorCapacity !== null ? t("expert.capacityAndActive", { cap: e.mentorCapacity, active: e.activeMentorships }) : null].filter(Boolean).join(" · ")}</Text>
            {e.specialisms.length > 0 ? (
              <Text variant="xs" tone="muted">
                {e.specialisms.join(", ")}
              </Text>
            ) : null}
            {e.verifiedAt !== null ? <Pill label={t("expert.identityChecked")} tone="accent" /> : null}
            <Kyc e={e} />
            {open ? (
              <Note tone={open.tone}>
                <Text variant="sm" bold tone={open.tone}>
                  {open.ask}
                </Text>
                <View style={{ flexDirection: "row", gap: th.space[2] }}>
                  <Button label={t("common.confirm")} variant={open.tone === "danger" ? "danger" : "primary"} busy={standing.isPending} onPress={() => standing.mutate({ profileId: e.profileId, choice: open })} style={{ flexGrow: 1 }} />
                  <Button label={t("common.keep")} variant="secondary" onPress={() => setConfirming(null)} style={{ flexGrow: 1 }} />
                </View>
              </Note>
            ) : (
              <View style={{ flexDirection: "row", gap: th.space[2], flexWrap: "wrap" }}>
                {choices.map((c, index) => (
                  <Button
                    key={c.label}
                    label={c.label}
                    accessibilityLabel={`${c.label}: ${e.name}`}
                    variant={index === 0 ? (published ? "secondary" : "primary") : published ? "ghost" : "secondary"}
                    onPress={() => setConfirming({ profileId: e.profileId, index })}
                    style={{ flexGrow: 1 }}
                  />
                ))}
              </View>
            )}
            {published ? (
              <Text variant="xs" tone="muted">
                {t("expert.takeOffNote")}
              </Text>
            ) : null}
          </Card>
        );
      })}
    </>
  );
}

/* ------------------------------------------------------------------------- */
/* The content team                                                           */
/* ------------------------------------------------------------------------- */

/**
 * The web's /root/content-team: a list and a flag. Appoint by email, to an
 * account that already exists — the refusal "register first" stays under the
 * field, where it can be read. Dismissing takes only the flag, so a plain
 * confirm is proportionate.
 */
function Team() {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const router = useRouter();
  const toast = useToast();
  const emailField = useRef<TextInput>(null);
  const [email, setEmail] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["operator", "content-team"],
    queryFn: async () => operatorContentTeamSchema.parse(unwrap(await api().get("/api/v1/operator/content-team"))),
  });
  const changed = () => {
    void qc.invalidateQueries({ queryKey: ["operator", "content-team"] });
    void qc.invalidateQueries({ queryKey: ["operator", "overview"] });
    void qc.invalidateQueries({ queryKey: ["operator", "audit"] });
  };
  const appoint = useMutation({
    mutationFn: (address: string) => send(api().post("/api/v1/operator/content-team", { email: address }), t("root.didNotWork")),
    onSuccess: () => {
      setEmail("");
      toast.show(t("root.contentTeamAppointed"));
      changed();
    },
  });
  const dismiss = useMutation({
    mutationFn: (userId: string) => send(api().request("DELETE", `/api/v1/operator/content-team/${userId}`), t("root.didNotWork")),
    onSuccess: () => {
      setConfirming(null);
      toast.show(t("root.contentTeamDismissed"));
      changed();
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const members = query.data?.items ?? [];
  return (
    <>
      <Text variant="sm" tone="muted">
        {t("root.contentTeamIntro")}
      </Text>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {query.data && members.length === 0 ? (
        <Empty icon="users" title={t("root.contentTeamNobody")} body={t("root.contentTeamAppointHint")} action={<Button label={t("root.contentTeamAppoint")} variant="secondary" onPress={() => emailField.current?.focus()} />} />
      ) : null}
      {members.length > 0 ? (
        <Card title={t("root.contentTeam")}>
          {members.map((m) => (
            <View key={m.id} style={{ gap: th.space[1] }}>
              <Row
                icon="user"
                title={m.you ? `${m.name} (${t("root.contentTeamYou")})` : m.name}
                caption={m.email ?? "—"}
                right={
                  m.isOperator || m.disabled ? (
                    <View style={{ gap: th.space[1], alignItems: "flex-end" }}>
                      {m.isOperator ? <Pill label={t("root.contentTeamOperatorBadge")} tone="accent" /> : null}
                      {m.disabled ? <Pill label={t("root.contentTeamDisabledBadge")} tone="warn" /> : null}
                    </View>
                  ) : null
                }
              />
              {confirming === m.id ? (
                <Note tone="danger">
                  <Text variant="sm" bold tone="danger">
                    {t("root.contentTeamDismissConfirm", { name: m.name })}
                  </Text>
                  <View style={{ flexDirection: "row", gap: th.space[2] }}>
                    <Button label={t("common.confirm")} variant="danger" busy={dismiss.isPending} onPress={() => dismiss.mutate(m.id)} style={{ flexGrow: 1 }} />
                    <Button label={t("common.keep")} variant="secondary" onPress={() => setConfirming(null)} style={{ flexGrow: 1 }} />
                  </View>
                </Note>
              ) : (
                <Button label={t("root.contentTeamDismiss")} accessibilityLabel={`${t("root.contentTeamDismiss")}: ${m.name}`} variant="ghost" onPress={() => setConfirming(m.id)} />
              )}
            </View>
          ))}
        </Card>
      ) : null}
      <Card title={t("root.contentTeamAppoint")}>
        <Text variant="xs" tone="muted">
          {t("root.contentTeamAppointHint")}
        </Text>
        <Field
          ref={emailField}
          label={t("root.contentTeamEmailLabel")}
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            if (appoint.isError) appoint.reset();
          }}
          error={appoint.isError ? appoint.error.message : null}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          maxLength={320}
          returnKeyType="send"
          onSubmitEditing={() => (email.trim() ? appoint.mutate(email.trim()) : undefined)}
        />
        <Button label={t("root.contentTeamAppointButton")} busy={appoint.isPending} disabled={!email.trim()} onPress={() => appoint.mutate(email.trim())} />
      </Card>
      <Button label={t("root.contentTeamOpenArea")} variant="secondary" onPress={() => router.push("/(app)/appadmin" as never)} />
    </>
  );
}

/* ------------------------------------------------------------------------- */
/* The server log                                                             */
/* ------------------------------------------------------------------------- */

/**
 * The web's /root/audit with its filters: the family chips and "only accounts
 * that still exist" apply at once; the search and the dates apply with Filter
 * (or the keyboard's search key), so a half-typed date never asks the server.
 */
function Log({ onAdd }: { onAdd: () => void }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const [typed, setTyped] = useState({ q: "", from: "", to: "" });
  const [applied, setApplied] = useState<AuditFilter>(NO_FILTER);
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["operator", "audit", applied, page],
    placeholderData: keepPreviousData,
    queryFn: async () => operatorAuditSchema.parse(unwrap(await api().get(operatorAuditPath(applied, page)))),
  });
  const apply = (next: AuditFilter) => {
    setApplied(next);
    setPage(1);
  };
  const wrongDate = (v: string) => v.trim() !== "" && !DAY.test(v.trim());
  const canApply = !wrongDate(typed.from) && !wrongDate(typed.to);
  const applyTyped = () => {
    if (canApply) apply({ ...applied, q: typed.q.trim(), from: typed.from.trim(), to: typed.to.trim() });
  };
  const filtered = Boolean(applied.action || applied.q || applied.from || applied.to || applied.live);
  const clear = () => {
    setTyped({ q: "", from: "", to: "" });
    apply(NO_FILTER);
  };
  const data = query.data;
  const skip = (page - 1) * AUDIT_PAGE;
  return (
    <>
      <Card title={t("root.auditFilterAction")}>
        <Chips
          label={t("root.auditFilterAction")}
          value={applied.action}
          options={[
            { value: "", label: t("root.auditAll") },
            { value: "superuser.", label: t("root.auditFamilySuperuser") },
            { value: "operator.", label: t("root.auditFamilyOperator") },
          ]}
          onChange={(action) => apply({ ...applied, action })}
        />
        <Field label={t("root.auditSearch")} value={typed.q} onChangeText={(q) => setTyped((f) => ({ ...f, q }))} onSubmitEditing={applyTyped} returnKeyType="search" autoCapitalize="none" autoCorrect={false} />
        <View style={{ flexDirection: "row", gap: th.space[3] }}>
          <View style={{ flex: 1 }}>
            <Field label={t("root.auditFrom")} placeholder="2026-09-01" hint={t("root.auditDateHint")} error={wrongDate(typed.from) ? t("root.auditDateWrong") : null} value={typed.from} onChangeText={(from) => setTyped((f) => ({ ...f, from }))} onSubmitEditing={applyTyped} keyboardType="numbers-and-punctuation" maxLength={10} />
          </View>
          <View style={{ flex: 1 }}>
            <Field label={t("root.auditTo")} placeholder="2026-09-30" hint={t("root.auditDateHint")} error={wrongDate(typed.to) ? t("root.auditDateWrong") : null} value={typed.to} onChangeText={(to) => setTyped((f) => ({ ...f, to }))} onSubmitEditing={applyTyped} keyboardType="numbers-and-punctuation" maxLength={10} />
          </View>
        </View>
        <SwitchRow label={t("root.auditLiveOnly")} value={applied.live} onChange={(live) => apply({ ...applied, live })} />
        <View style={{ flexDirection: "row", gap: th.space[2] }}>
          <Button label={t("root.auditApply")} variant="secondary" disabled={!canApply} onPress={applyTyped} style={{ flexGrow: 1 }} />
          {filtered ? <Button label={t("root.auditClear")} variant="ghost" onPress={clear} style={{ flexGrow: 1 }} /> : null}
        </View>
      </Card>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {data && data.items.length === 0 ? (
        filtered ? (
          <Empty title={t("root.auditNoMatch")} action={<Button label={t("common.clearAll")} variant="secondary" onPress={clear} />} />
        ) : (
          <Empty title={t("root.nothingRecorded")} body={t("root.addingWillAppear")} action={<Button label={t("root.addSchool")} variant="secondary" onPress={onAdd} />} />
        )
      ) : null}
      {data && data.items.length > 0 ? (
        <>
          <Text variant="xs" tone="muted">
            {t("root.auditShowing", { from: skip + 1, to: skip + data.items.length, total: data.total })}
          </Text>
          <Card title={t("root.serverLog")}>
            <Text variant="xs" tone="subtle">
              {t("root.auditIntro")}
            </Text>
            {data.items.map((row) => (
              <Row
                key={row.id}
                title={row.actionKey ? t(row.actionKey as TranslationKey) : row.action}
                caption={[row.actorName ?? (row.system ? t("root.systemActor") : t("root.deletedUser")), row.schoolName, row.summary, relativeTime(row.at, locale)].filter(Boolean).join(" · ")}
              />
            ))}
          </Card>
          {data.total > AUDIT_PAGE ? (
            <View style={{ flexDirection: "row", gap: th.space[2] }}>
              <Button label={t("root.auditPrev")} variant="secondary" disabled={page === 1} onPress={() => setPage((p) => p - 1)} style={{ flexGrow: 1 }} />
              <Button label={t("root.auditNext")} variant="secondary" disabled={skip + data.items.length >= data.total} onPress={() => setPage((p) => p + 1)} style={{ flexGrow: 1 }} />
            </View>
          ) : null}
        </>
      ) : null}
    </>
  );
}

/** The one-line summary without its per-school map — the web's summaryPairs; an old row that is not JSON is shown as it is. */
export function countedLine(summary: string): string {
  try {
    const parsed: unknown = JSON.parse(summary);
    if (parsed && typeof parsed === "object") {
      return Object.entries(parsed as Record<string, unknown>)
        .filter(([key]) => key !== "perSchool")
        .map(([key, value]) => `${key} ${typeof value === "object" ? JSON.stringify(value) : String(value)}`)
        .join(" · ");
    }
  } catch {
    /* an old row; show it as it is */
  }
  return summary;
}
