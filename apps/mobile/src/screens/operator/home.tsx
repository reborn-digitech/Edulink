import { useEffect, useState } from "react";
import { View } from "react-native";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { operatorAuditSchema, operatorExpertsSchema, operatorOverviewSchema, type OperatorAudit, type OperatorExperts, type OperatorJob, type OperatorOverview } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Stat, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { Chips, openWeb } from "../staff/shared";
import { Note, Pill, relativeTime } from "../family/shared";

type Section = "schools" | "jobs" | "experts" | "log";
type SchoolState = "live" | "noadmin" | "removed" | "all";
type JobTone = "running" | "overdue" | "failed" | "ok";

/** How long the search waits after the last keystroke before it asks the server. */
const SEARCH_DEBOUNCE_MS = 300;

export function operatorOverviewPath(q: string, state: SchoolState): string {
  const parts: string[] = [];
  if (q) parts.push(`q=${encodeURIComponent(q)}`);
  if (state !== "live") parts.push(`state=${state}`);
  return `/api/v1/operator/overview${parts.length ? `?${parts.join("&")}` : ""}`;
}

function jobTone(job: OperatorJob): JobTone {
  if (job.running) return "running";
  if (job.overdue) return "overdue";
  if (job.lastFailed) return "failed";
  return "ok";
}

/**
 * The web's /root on a phone, read-only: the server's schools, its scheduled
 * jobs, the expert queue and the server log, one section at a time behind
 * the root nav's chips. Every action — adding a school, listing an expert,
 * looking inside — is the web's; each row and each empty state opens the
 * page it belongs to there.
 */
export function OperatorHome() {
  const t = useT();
  const th = useTheme();
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
  const d = query.data;
  const name = session.me ? (session.me.user.preferredName ?? session.me.user.name) : "";
  return (
    <Screen title={t("root.serverAdministration")} description={t("root.operatorIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
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
          { value: "log", label: t("root.serverLog") },
        ]}
        onChange={setSection}
      />
      {section === "schools" ? (
        <>
          <Field label={t("common.searchLabel")} placeholder={t("root.searchPlaceholder")} value={typed} onChangeText={setTyped} returnKeyType="search" autoCapitalize="none" autoCorrect={false} />
          <Chips
            label={t("root.stateFilter")}
            value={state}
            options={[
              { value: "live", label: t("root.stateLive") },
              { value: "noadmin", label: t("root.stateNoAdmin") },
              { value: "removed", label: t("root.removedBadge") },
              { value: "all", label: t("vacancies.filterAll") },
            ]}
            onChange={setState}
          />
        </>
      ) : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d && section === "schools" ? (
        <Schools
          d={d}
          narrowed={Boolean(q || state !== "live")}
          onClear={() => {
            setTyped("");
            setQ("");
            setState("live");
          }}
        />
      ) : null}
      {d && section === "jobs" ? <Jobs jobs={d.jobs} /> : null}
      {section === "experts" ? <Experts /> : null}
      {section === "log" ? <Log /> : null}
      <Button label={t("root.serverAdministration")} variant="secondary" onPress={() => openWeb("/root")} />
      <Button label={t("shell.signOut")} variant="ghost" onPress={() => void session.signOut()} />
    </Screen>
  );
}

function Schools({ d, narrowed, onClear }: { d: OperatorOverview; narrowed: boolean; onClear: () => void }) {
  const t = useT();
  const { locale } = useLocale();
  if (d.schools.length === 0) {
    return narrowed ? (
      <Empty title={t("common.noResultsTitle")} body={t("common.noResultsBody")} action={<Button label={t("common.clearAll")} variant="secondary" onPress={onClear} />} />
    ) : (
      <Empty title={t("root.noSchoolsYet")} body={t("root.addFirstOne")} action={<Button label={t("root.addSchool")} onPress={() => openWeb("/root/new")} />} />
    );
  }
  return (
    <Card title={t("root.schools")} action={<Button label={t("root.addSchool")} variant="ghost" onPress={() => openWeb("/root/new")} />}>
      {d.schools.map((s) => (
        <Row
          key={s.id}
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
            ) : s.pendingAdminInvites > 0 ? (
              <Pill label={s.pendingAdminInvites === 1 ? t("root.invitesPendingOne") : t("root.invitesPendingMany", { count: s.pendingAdminInvites })} tone="warn" />
            ) : null
          }
          onPress={() => openWeb(`/root/${s.id}`)}
        />
      ))}
    </Card>
  );
}

function Jobs({ jobs }: { jobs: OperatorJob[] }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  if (jobs.length === 0) {
    return <Empty title={t("root.jobs")} body={t("root.jobsHow")} action={<Button label={t("root.serverAdministration")} variant="secondary" onPress={() => openWeb("/root/jobs")} />} />;
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

function Experts() {
  const t = useT();
  const query = useQuery({
    queryKey: ["operator", "experts"],
    queryFn: async () => operatorExpertsSchema.parse(unwrap(await api().get("/api/v1/operator/experts"))),
  });
  if (query.isPending) return <Loading />;
  if (query.isError) return <Failed message={query.error.message} onRetry={() => void query.refetch()} />;
  const items: OperatorExperts["items"] = query.data.items;
  if (items.length === 0) {
    return <Empty title={t("expert.curationEmpty")} body={t("expert.curationEmptyBody")} action={<Button label={t("expert.curationTitle")} variant="secondary" onPress={() => openWeb("/root/experts")} />} />;
  }
  const waiting = items.filter((e) => e.publishedAt === null).length;
  return (
    <Card title={t("expert.curationTitle")} action={<Button label={t("expert.curationTitle")} variant="ghost" onPress={() => openWeb("/root/experts")} />}>
      <Text variant="sm" tone="muted">
        {t("expert.curationCount", { waiting, listed: items.length - waiting })}
      </Text>
      {items.map((e) => (
        <Row
          key={e.profileId}
          title={e.name}
          caption={[e.headline, e.organisation, e.specialisms.join(", ") || null].filter(Boolean).join(" · ")}
          right={e.publishedAt === null ? <Pill label={t("expert.waiting")} tone="warn" /> : <Pill label={t("expert.onMarketplace")} tone="ok" />}
          onPress={() => openWeb("/root/experts")}
        />
      ))}
    </Card>
  );
}

function Log() {
  const t = useT();
  const { locale } = useLocale();
  const query = useQuery({
    queryKey: ["operator", "audit"],
    queryFn: async () => operatorAuditSchema.parse(unwrap(await api().get("/api/v1/operator/audit"))),
  });
  if (query.isPending) return <Loading />;
  if (query.isError) return <Failed message={query.error.message} onRetry={() => void query.refetch()} />;
  const items: OperatorAudit["items"] = query.data.items;
  if (items.length === 0) {
    return <Empty title={t("root.nothingRecorded")} body={t("root.addingWillAppear")} action={<Button label={t("root.serverLog")} variant="secondary" onPress={() => openWeb("/root/audit")} />} />;
  }
  return (
    <Card title={t("root.serverLog")} action={<Button label={t("root.serverLog")} variant="ghost" onPress={() => openWeb("/root/audit")} />}>
      <Text variant="xs" tone="subtle">
        {t("root.auditIntro")}
      </Text>
      {items.map((row) => (
        <Row
          key={row.id}
          title={row.action}
          caption={[row.actorName ?? (row.system ? t("root.systemActor") : t("root.deletedUser")), row.schoolName, row.summary, relativeTime(row.at, locale)].filter(Boolean).join(" · ")}
        />
      ))}
    </Card>
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
