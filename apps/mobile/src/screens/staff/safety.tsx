import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminSafetySchema, okSchema, type AdminSafety } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Stat, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { screenFor, type ScreenTarget } from "@/lib/links";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Pill, relativeTime } from "../family/shared";
import { Chips } from "./shared";

type Tab = "open" | "closed" | "audit";
type Report = AdminSafety["reports"][number];

const URGENT = new Set(["UNSAFE", "BULLYING"]);

/** Keys, not words — the web's REASON_KEYS; an unknown reason stays as it came, a debugging aid rather than prose. */
const REASON_KEYS: Record<string, TranslationKey> = {
  BULLYING: "safety.reasonBullying",
  UNSAFE: "safety.reasonUnsafe",
  PRIVACY: "safety.reasonPrivacy",
  WRONG_INFO: "safety.reasonWrongInfo",
  SPAM: "safety.reasonSpam",
  OTHER: "safety.reasonOther",
};

/** The web's ACTION_KEYS: the wording for an audit action, or the raw key when it has none yet. */
const ACTION_KEYS: Record<string, TranslationKey> = {
  "attendance.alert": "audit.attendanceAlert",
  "school.profile.update": "audit.schoolProfileUpdate",
  "school.profile.publish": "audit.schoolProfilePublish",
  "school.profile.unpublish": "audit.schoolProfileUnpublish",
  "vacancy.post": "audit.vacancyPost",
  "vacancy.close": "audit.vacancyClose",
  "enquiry.open": "audit.enquiryOpen",
  "enquiry.close": "audit.enquiryClose",
  "auth.ssoLink": "audit.authSsoLink",
  "meeting.slotPublish": "audit.meetingSlotPublish",
  "meeting.book": "audit.meetingBook",
  "meeting.cancel": "audit.meetingCancel",
  "compliance.export": "audit.complianceExport",
  "exam.seriesCreate": "audit.examSeriesCreate",
  "exam.seriesPublish": "audit.examSeriesPublish",
  "exam.seriesArchive": "audit.examSeriesArchive",
  "exam.slotChange": "audit.examSlotChange",
  "exam.marksSave": "audit.examMarksSave",
  "school.create": "audit.schoolCreate",
  "auth.login": "audit.authLogin",
  "auth.login.failed": "audit.authLoginFailed",
  "invite.create": "audit.inviteCreate",
  "invite.accept": "audit.inviteAccept",
  "invite.revoke": "audit.inviteRevoke",
  "invite.resend": "audit.inviteResend",
  "invite.open.self": "audit.inviteOpenSelf",
  "class.create": "audit.classCreate",
  "class.archive": "audit.classArchive",
  "class.restore": "audit.classRestore",
  "class.code.rotate": "audit.classCodeRotate",
  "class.teacher.assign": "audit.classTeacherAssign",
  "class.teacher.remove": "audit.classTeacherRemove",
  "attendance.mark": "audit.attendanceMark",
  "term.finish": "audit.termFinish",
  "term.reopen": "audit.termReopen",
  "expert.profile.update": "audit.expertProfileUpdate",
};

function isSensitiveAction(action: string): boolean {
  return action === "directory.export" || action === "compliance.export" || action === "auth.login.failed" || action === "parent.claim.failed" || action.startsWith("report.") || action === "content.report";
}

/**
 * The safety centre — the web's /admin/safety: who outside the school has
 * looked inside it (above everything, because nothing else tells a school
 * that), then the reports to deal with, the ones resolved, and the
 * append-only audit trail. Deciding a report — taking content down with a
 * note the author sees, or closing it as alright with a note only staff
 * see — happens here, after the note is written.
 */
export function Safety() {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const [tab, setTab] = useState<Tab>("open");
  const query = useQuery({
    queryKey: ["admin", "safety", tab],
    placeholderData: keepPreviousData,
    queryFn: async () => adminSafetySchema.parse(unwrap(await api().get(`/api/v1/admin/safety?tab=${tab}`))),
  });
  const d = query.data;
  const openCount = d?.openCount ?? 0;
  return (
    <Screen
      title={t("safety.title")}
      description={d ? (openCount === 0 ? t("safety.nothingNeeded") : openCount === 1 ? t("safety.toDealWithOne") : t("safety.toDealWithMany", { count: openCount })) : undefined}
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
    >
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
            <Stat label={t("safety.tabOpen")} value={d.openCount} tone={d.openCount > 0 ? "warn" : "ok"} />
            <Stat label={t("safety.operatorLive")} value={d.visits.filter((v) => v.live).length} tone={d.visits.some((v) => v.live) ? "warn" : "fg"} />
          </View>
          {d.visits.length > 0 ? (
            <Card title={t("safety.operatorTitle")}>
              <Text variant="xs" tone="subtle">
                {t("safety.operatorBody")}
              </Text>
              {d.visits.map((visit) => (
                <Row key={visit.id} title={visit.operatorName} caption={`${relativeTime(visit.startedAt, locale)} — ${visit.reason}`} right={visit.live ? <Pill label={t("safety.operatorLive")} tone="warn" /> : null} />
              ))}
              <Text variant="xs" tone="muted">
                {`${t("safety.operatorFootPrefix")} operator. ${t("safety.operatorFootSuffix")}`}
              </Text>
            </Card>
          ) : null}
          <Chips
            label={t("safety.section")}
            value={tab}
            options={[
              { value: "open", label: d.openCount > 0 ? t("safety.tabOpenCount", { count: d.openCount }) : t("safety.tabOpen") },
              { value: "closed", label: t("safety.tabClosed") },
              { value: "audit", label: t("safety.tabAudit") },
            ]}
            onChange={setTab}
          />
          {tab === "open" ? (
            d.reports.length === 0 ? (
              <Empty title={t("safety.nothingReported")} body={t("safety.nothingReportedBody")} action={<Button label={t("safety.tabAudit")} variant="secondary" onPress={() => setTab("audit")} />} />
            ) : (
              <>
                <Text variant="xs" tone="muted">
                  {t("safety.groupedNote")}
                </Text>
                {d.reports.map((group) => (
                  <ReportCard key={`${group.targetType}:${group.targetId}`} group={group} />
                ))}
              </>
            )
          ) : null}
          {tab === "closed" ? (
            d.reports.length === 0 ? (
              <Empty title={t("safety.nothingResolved")} body={t("safety.nothingResolvedBody")} action={<Button label={t("safety.tabOpen")} variant="secondary" onPress={() => setTab("open")} />} />
            ) : (
              d.reports.map((group) => <ReportCard key={`${group.targetType}:${group.targetId}:${group.status}`} group={group} readOnly />)
            )
          ) : null}
          {tab === "audit" ? d.audit.length === 0 ? <Empty title={t("safety.nothingLogged")} body={t("safety.nothingLoggedBody")} action={<Button label={t("safety.tabOpen")} variant="secondary" onPress={() => setTab("open")} />} /> : <AuditList rows={d.audit} /> : null}
        </>
      ) : null}
    </Screen>
  );
}

/** Where a reported thing opens in the app: its own screen, or — for a person — the directory, where their access is paused. */
function doorFor(href: string | null, kind: "POST" | "COMMENT" | "USER"): ScreenTarget | null {
  if (!href) return null;
  return screenFor(href) ?? (kind === "USER" ? { pathname: "/(app)/people" } : null);
}

/**
 * One reported thing and its reports. Deciding it is two steps, as on the
 * web: choose "take it down" or "nothing wrong", write the note (the author
 * reads a take-down's; only staff read a dismissal's), then confirm.
 */
function ReportCard({ group, readOnly }: { group: Report; readOnly?: boolean }) {
  const t = useT();
  const th = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const router = useRouter();
  const { locale } = useLocale();
  const [deciding, setDeciding] = useState<"remove" | "dismiss" | null>(null);
  const [note, setNote] = useState("");
  const decide = useMutation({
    mutationFn: async (kind: "remove" | "dismiss") => {
      const body = { targetType: group.targetType, targetId: group.targetId, note: note.trim() };
      return okSchema.parse(unwrap(kind === "remove" ? await api().post("/api/v1/office/safety/take-down", body) : await api().post("/api/v1/office/safety/dismiss", body)));
    },
    onSuccess: (_r, kind) => {
      toast.show(kind === "remove" ? t("safety.takenDown") : group.count === 1 ? t("safety.closedOne") : t("safety.closedMany", { count: group.count }));
      setDeciding(null);
      setNote("");
      void qc.invalidateQueries({ queryKey: ["admin", "safety"] });
      void qc.invalidateQueries({ queryKey: ["admin", "overview"] });
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const open = (href: string | null) => {
    const target = doorFor(href, group.targetType);
    if (target) router.push(target as never);
  };
  const reasonText = (reason: string) => {
    const key = REASON_KEYS[reason];
    return key ? t(key) : reason;
  };
  const urgent = group.reasons.some((r) => URGENT.has(r.reason));
  const removable = group.targetType !== "USER" && group.target.available;
  const target = group.target;
  const what = group.targetType === "POST" ? t("safety.aPost") : group.targetType === "COMMENT" ? t("safety.aComment") : t("safety.aPerson");
  return (
    <Card title={`${group.count === 1 ? t("safety.reportsOne") : t("safety.reportsMany", { count: group.count })} · ${what}`} action={readOnly ? <Pill label={group.status === "ACTIONED" ? t("safety.removed") : t("safety.dismissed")} tone={group.status === "ACTIONED" ? "danger" : "muted"} /> : <Text variant="xs" tone={urgent ? "danger" : "muted"}>{relativeTime(group.latestAt, locale)}</Text>}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
        {group.reasons.map((reason) => (
          <Pill key={reason.reason} label={`${reasonText(reason.reason)}${reason.count > 1 ? ` ×${reason.count}` : ""}`} tone={URGENT.has(reason.reason) ? "danger" : "muted"} />
        ))}
      </View>
      {target.available ? (
        <View style={{ backgroundColor: th.surfaceMuted, borderRadius: th.radius.md, padding: th.space[3], gap: th.space[2] }}>
          {target.kind === "POST" ? (
            <>
              <Text variant="xs" tone="muted">
                {[target.authorName, target.authorRole ? target.authorRole.toLowerCase() : null, relativeTime(target.createdAt, locale), target.status !== "APPROVED" ? target.status.toLowerCase() : null].filter(Boolean).join(" · ")}
              </Text>
              <Text variant="base" bold>
                {target.title}
              </Text>
              {target.body ? (
                <Text variant="sm" tone="muted">
                  {target.body}
                </Text>
              ) : null}
              {doorFor(target.href, "POST") ? <Button label={t("safety.openIt")} variant="secondary" onPress={() => open(target.href)} /> : null}
            </>
          ) : null}
          {target.kind === "COMMENT" ? (
            <>
              <Text variant="xs" tone="muted">
                {`${target.authorName} ${t("safety.commentedOn")} ${target.postTitle} · ${relativeTime(target.createdAt, locale)}${target.status !== "APPROVED" ? ` · ${target.status.toLowerCase()}` : ""}`}
              </Text>
              <Text variant="sm">{target.body}</Text>
              {doorFor(target.href, "COMMENT") ? <Button label={t("safety.openThePost")} variant="secondary" onPress={() => open(target.href)} /> : null}
            </>
          ) : null}
          {target.kind === "USER" ? (
            <>
              <Text variant="base" bold>
                {target.name}
              </Text>
              <Text variant="xs" tone="muted">
                {target.roles.map((r) => r.toLowerCase()).join(", ")}
              </Text>
              <Text variant="xs" tone={target.suspended ? "warn" : "muted"}>
                {target.suspended ? t("safety.alreadyPaused") : t("safety.canPauseBody")}
              </Text>
              {doorFor(target.href, "USER") ? <Button label={target.suspended ? t("safety.openInDirectory") : t("safety.pauseTheirAccess")} variant="secondary" onPress={() => open(target.href)} /> : null}
            </>
          ) : null}
        </View>
      ) : (
        <View style={{ borderWidth: 1, borderColor: th.border, borderRadius: th.radius.md, padding: th.space[3], gap: th.space[1] }}>
          <Text variant="sm" bold tone="muted">
            {t("safety.noLongerAvailable")}
          </Text>
          <Text variant="xs" tone="subtle">
            {t("safety.noLongerAvailableBody")}
          </Text>
        </View>
      )}
      <Text variant="sm" bold>
        {group.count === 1 ? t("safety.whatReporterSaid") : t("safety.whatReportersSaid")}
      </Text>
      {group.details.map((detail, index) => (
        <Row key={`${detail.reporterName}:${detail.at}:${index}`} title={`${detail.reporterName} · ${reasonText(detail.reason)}`} caption={[relativeTime(detail.at, locale), detail.detail || null].filter(Boolean).join(" · ")} />
      ))}
      {readOnly && group.resolutionNote ? (
        <View style={{ backgroundColor: th.surfaceMuted, borderRadius: th.radius.md, padding: th.space[3], gap: th.space[1] }}>
          <Text variant="xs" bold tone="muted">
            {t("safety.whatYouDecided")}
          </Text>
          <Text variant="sm">{group.resolutionNote}</Text>
        </View>
      ) : null}
      {readOnly ? null : deciding ? (
        <View style={{ gap: th.space[2] }}>
          <Field
            label={deciding === "remove" ? t("safety.whyComingDown") : t("safety.whyAlright")}
            value={note}
            onChangeText={setNote}
            placeholder={deciding === "remove" ? t("safety.removePlaceholder") : t("safety.dismissPlaceholder")}
            multiline
            maxLength={1000}
            style={{ minHeight: 96, textAlignVertical: "top" }}
          />
          <View style={{ flexDirection: "row", gap: th.space[2], flexWrap: "wrap" }}>
            <Button label={deciding === "remove" ? t("safety.takeItDown") : t("safety.closeTheReports")} variant={deciding === "remove" ? "danger" : "primary"} busy={decide.isPending} disabled={!note.trim()} onPress={() => decide.mutate(deciding)} style={{ flexGrow: 1 }} />
            <Button
              label={t("common.cancel")}
              variant="ghost"
              onPress={() => {
                setDeciding(null);
                setNote("");
              }}
            />
          </View>
        </View>
      ) : (
        <View style={{ flexDirection: "row", gap: th.space[2], flexWrap: "wrap" }}>
          {removable ? <Button label={t("safety.takeItDown")} variant="danger" onPress={() => setDeciding("remove")} style={{ flexGrow: 1 }} /> : null}
          <Button label={t("safety.nothingWrong")} variant="secondary" onPress={() => setDeciding("dismiss")} style={{ flexGrow: 1 }} />
        </View>
      )}
    </Card>
  );
}

function AuditList({ rows }: { rows: AdminSafety["audit"] }) {
  const t = useT();
  const { locale } = useLocale();
  const [q, setQ] = useState("");
  const [only, setOnly] = useState<"all" | "sensitive">("all");
  const describe = (action: string) => {
    const key = ACTION_KEYS[action];
    return key ? t(key) : action;
  };
  const needle = q.trim().toLowerCase();
  const filtered = rows.filter((row) => (only === "all" || isSensitiveAction(row.action)) && (!needle || row.actorName.toLowerCase().includes(needle) || row.action.toLowerCase().includes(needle) || describe(row.action).toLowerCase().includes(needle)));
  return (
    <Card title={t("safety.tabAudit")}>
      <Text variant="xs" tone="muted">
        {t("safety.auditNote")}
      </Text>
      <Field label={t("safety.searchAudit")} placeholder={t("safety.searchAuditPlaceholder")} value={q} onChangeText={setQ} autoCapitalize="none" returnKeyType="search" />
      <Chips
        label={t("safety.sensitiveOnly")}
        value={only}
        options={[
          { value: "all", label: t("vacancies.filterAll") },
          { value: "sensitive", label: t("safety.sensitive") },
        ]}
        onChange={setOnly}
      />
      <Text variant="xs" tone="muted" accessibilityLiveRegion="polite">
        {`${t("safety.entryCount", { shown: filtered.length, total: rows.length })}${rows.length >= 200 ? t("safety.mostRecent200") : ""}`}
      </Text>
      {filtered.length === 0 ? (
        <Text variant="sm" tone="muted">
          {t("safety.nothingMatches")}
        </Text>
      ) : (
        filtered.map((row) => <Row key={row.id} title={describe(row.action)} caption={`${row.actorName} · ${relativeTime(row.at, locale)}`} right={isSensitiveAction(row.action) ? <Pill label={t("safety.sensitive")} tone="danger" /> : null} />)
      )}
    </Card>
  );
}
