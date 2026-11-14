import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminLeaveSchema, leaveDecidedSchema, type AdminLeave } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Chips, formatRange, leaveKindLabel, leaveStatusKey, Notice } from "./shared";

type Pending = AdminLeave["pending"][number];
type Decision = "APPROVED" | "DECLINED";
export type DecideBody = { decision: Decision; note?: string; coverMembershipId?: string | null; coverAssignments?: { classId: string; subject: string; coverMembershipId: string }[] };

/**
 * The leave desk: what is waiting, then what was decided. The cover choice
 * is part of approving, not a job afterwards — the picker sits inside the
 * card, pre-filled with the applicant's suggestion, and the number of
 * classes it covers is said before the button is pressed. One cover name
 * applies to every (class, subject) slice; the web offers a picker per slice.
 */
export function LeaveDesk() {
  const t = useT();
  const qc = useQueryClient();
  const router = useRouter();
  const [notice, setNotice] = useState<{ text: string; tone: "ok" | "danger" } | null>(null);
  const query = useQuery({
    queryKey: ["admin", "leave"],
    queryFn: async () => adminLeaveSchema.parse(unwrap(await api().get("/api/v1/admin/leave"))),
  });
  const decide = useMutation({
    mutationFn: async (input: { id: string; body: DecideBody }) => leaveDecidedSchema.parse(unwrap(await api().post(`/api/v1/admin/leave/${input.id}/decide`, input.body))),
    onSuccess: (data, input) => {
      const covered = data.coversCreated ?? 0;
      setNotice({
        tone: "ok",
        text:
          input.body.decision === "APPROVED"
            ? [t("principal.leaveApproved"), covered === 1 ? t("principal.coverArrangedOne") : covered > 1 ? t("principal.coverArrangedMany", { count: covered }) : null].filter(Boolean).join(" ")
            : t("principal.leaveDeclined"),
      });
      void qc.invalidateQueries({ queryKey: ["admin", "leave"] });
      void qc.invalidateQueries({ queryKey: ["principal"] });
      void qc.invalidateQueries({ queryKey: ["admin", "calendar"] });
    },
    onError: (e) => setNotice({ tone: "danger", text: `${t("principal.notSaved")}: ${e.message}` }),
  });
  const d = query.data;
  return (
    <Screen title={t("principal.staffLeave")} description={t("principal.staffLeaveBody")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <Text variant="lg" bold accessibilityRole="header">
            {t("principal.waitingForYouCount", { count: d.pending.length })}
          </Text>
          {d.pending.length === 0 ? (
            <Empty title={t("principal.nothingWaiting")} body={t("principal.nothingWaitingBody")} action={<Button label={t("nav.calendar")} variant="secondary" onPress={() => router.push("/(app)/calendar" as never)} />} />
          ) : (
            d.pending.map((r) => <DecideCard key={r.id} request={r} staff={d.staff} busy={decide.isPending && decide.variables?.id === r.id} onDecide={(body) => decide.mutate({ id: r.id, body })} />)
          )}
          {d.decided.length > 0 ? <Decided rows={d.decided} /> : null}
        </>
      ) : null}
    </Screen>
  );
}

function DecideCard({ request, staff, busy, onDecide }: { request: Pending; staff: AdminLeave["staff"]; busy: boolean; onDecide: (body: DecideBody) => void }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const lessons = request.suggestions.lessonCount;
  const options = request.suggestions.candidates.length > 0 ? request.suggestions.candidates : staff.map((s) => ({ ...s, clashes: 0, load: 0, teachesSubject: false }));
  const [cover, setCover] = useState(() => staff.find((s) => s.name === request.nominatedName)?.membershipId ?? "");
  const [note, setNote] = useState("");
  const [declining, setDeclining] = useState(false);
  const needsCover = request.dutyClasses > 0;
  const balance = request.balance;
  // The server's count, the web desk's (TA-161): school days, for casual and sick leave only. An older server sends
  // none, and then no "over" is claimed rather than one worked out on the calendar.
  const days = request.countedDays;
  const over = balance && balance.remaining !== null && days !== undefined ? balance.remaining - days : null;

  function answer(decision: Decision) {
    const assignments = decision === "APPROVED" && cover ? request.suggestions.groups.map((g) => ({ classId: g.classId, subject: g.subject, coverMembershipId: cover })) : [];
    onDecide({
      decision,
      note: note.trim() || undefined,
      coverMembershipId: decision === "APPROVED" ? cover || null : null,
      coverAssignments: assignments.length > 0 ? assignments : undefined,
    });
  }

  return (
    <Card title={request.applicantName} action={<Text variant="xs" tone="warn" bold>{t(leaveStatusKey(request.status))}</Text>}>
      <Text variant="sm" tone="muted">
        {formatRange(t, request.fromDateKey, request.toDateKey, locale)} · {leaveKindLabel(t, request.kind)}
      </Text>
      {balance ? (
        <Text variant="xs" tone={over !== null && over < 0 ? "danger" : "muted"}>
          {balance.entitlement === null
            ? t("staff.deskNoEntitlement", { used: balance.used })
            : [t("staff.deskBalance", { used: balance.used, entitlement: balance.entitlement, remaining: balance.remaining ?? 0 }), over !== null && over < 0 ? t("staff.deskOver", { over: -over }) : null].filter(Boolean).join(" · ")}
        </Text>
      ) : null}
      {request.reason ? <Text variant="base">{request.reason}</Text> : null}
      <View style={{ backgroundColor: th.surfaceMuted, borderRadius: th.radius.md, padding: th.space[3], gap: th.space[2] }}>
        <Text variant="sm" bold>
          {t("principal.whoCovers")}
        </Text>
        <Text variant="xs" tone="muted">
          {[!needsCover ? t("principal.noCoverNeeded") : request.dutyClasses === 1 ? t("principal.appliesToOne") : t("principal.appliesToMany", { count: request.dutyClasses }), request.nominatedName ? t("principal.theySuggested", { name: request.nominatedName }) : null].filter(Boolean).join(" ")}
        </Text>
        <Chips
          label={t("principal.whoCovers")}
          value={cover}
          disabled={!needsCover}
          options={[
            { value: "", label: t("principal.nobodyYet") },
            ...options.map((c) => ({
              value: c.membershipId,
              label: lessons === 0 ? c.name : c.clashes === 0 ? `${c.name} — ${t("principalCover.free")}` : `${c.name} — ${t("principalCover.busy", { busy: c.clashes, total: lessons })}`,
            })),
          ]}
          onChange={setCover}
        />
      </View>
      {declining ? <Field label={t("principal.whyTheyWillSee")} value={note} onChangeText={setNote} multiline maxLength={500} /> : null}
      <View style={{ flexDirection: "row", gap: th.space[2], flexWrap: "wrap" }}>
        <Button label={cover && needsCover ? t("principal.approveAndCover") : t("principal.approve")} busy={busy} onPress={() => answer("APPROVED")} style={{ flexGrow: 1 }} />
        {declining ? (
          <Button label={t("principal.confirmDecline")} variant="danger" busy={busy} onPress={() => answer("DECLINED")} style={{ flexGrow: 1 }} />
        ) : (
          <Button label={t("principal.decline")} variant="secondary" onPress={() => setDeclining(true)} style={{ flexGrow: 1 }} />
        )}
      </View>
    </Card>
  );
}

function Decided({ rows }: { rows: AdminLeave["decided"] }) {
  const t = useT();
  const { locale } = useLocale();
  return (
    <Card title={t("principal.alreadyDecided")}>
      {rows.map((r) => (
        <Row
          key={r.id}
          title={r.applicantName}
          caption={[formatRange(t, r.fromDateKey, r.toDateKey, locale), leaveKindLabel(t, r.kind), r.decidedByName].filter(Boolean).join(" · ")}
          right={
            <Text variant="sm" bold tone={r.status === "APPROVED" ? "ok" : r.status === "DECLINED" ? "danger" : "muted"}>
              {t(leaveStatusKey(r.status))}
            </Text>
          }
        />
      ))}
    </Card>
  );
}
