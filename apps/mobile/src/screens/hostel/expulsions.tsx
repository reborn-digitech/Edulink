import { useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hostelBoardersSchema, hostelExpulsionsSchema } from "@edulink/contracts";
import type { z } from "zod";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { usePrivateScreen } from "@/lib/private-screen";
import { useRole } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { Notice, formatDateKey } from "../staff/shared";
import { Confirm, Pill } from "../family/shared";
import { DATE_KEY, ModuleOffScreen, OfflineDecisionNote, todayKey, useModuleOn } from "@/screens/shared/desk";

type Expulsion = z.infer<typeof hostelExpulsionsSchema>["items"][number];
const TONE: Record<Expulsion["status"], "warn" | "ok" | "danger" | "muted"> = { ASKED: "warn", APPROVED: "ok", REFUSED: "danger", WITHDRAWN: "muted" };

/**
 * Hostel expulsions on the phone (the parity batch, 10 Oct 2026, R-4), the
 * web's /hostel/expulsions: every proposal to end a boarder's place, those
 * waiting for the principal first. The warden (or the office) proposes one
 * here — the boarder found by name among the hostel's boarders, the reason,
 * the day it takes effect; the incident it rests on is named on the web —
 * and takes back one still waiting; the principal approves (the place ends
 * on that day; the student and the family are told) or refuses, with a note.
 * The web's doors (POST /hostel/expulsions, .../withdraw, .../decide); each
 * a decision, sent live and never queued, the ending ones asked once.
 */
export function ExpulsionsScreen() {
  // No screenshots while it is up (A3-S-12): boarders and what is said of them.
  usePrivateScreen();
  const t = useT();
  const th = useTheme();
  const role = useRole();
  const { locale } = useLocale();
  const qc = useQueryClient();
  const on = useModuleOn("HOSTEL");
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const [acting, setActing] = useState<{ id: string; kind: "APPROVE" | "REFUSE" | "WITHDRAW" } | null>(null);
  const [note, setNote] = useState("");
  const query = useQuery({ queryKey: ["hostel", "expulsions"], enabled: on, queryFn: async () => hostelExpulsionsSchema.parse(unwrap(await api().get("/api/v1/hostel/expulsions"))) });
  const done = (text: string) => {
    setActing(null);
    setNote("");
    setNotice({ tone: "ok", text });
    void qc.invalidateQueries({ queryKey: ["hostel"] });
  };
  const decide = useMutation({
    mutationFn: async (v: { id: string; approve: boolean }) => unwrap(await api().post(`/api/v1/hostel/expulsions/${v.id}/decide`, { approve: v.approve, note: note.trim() })),
    onSuccess: () => done(t("collegeDesks.decided")),
    onError: (e: Error) => {
      setActing(null);
      setNotice({ tone: "danger", text: e.message });
    },
  });
  const withdraw = useMutation({
    mutationFn: async (id: string) => unwrap(await api().post(`/api/v1/hostel/expulsions/${id}/withdraw`, {})),
    onSuccess: () => done(t("collegeDesks.expulsionWithdrawn")),
    onError: (e: Error) => {
      setActing(null);
      setNotice({ tone: "danger", text: e.message });
    },
  });
  if (!on) return <ModuleOffScreen title={t("collegeDesks.expulsionsTitle")} module="HOSTEL" />;
  const d = query.data;
  return (
    <Screen title={t("collegeDesks.expulsionsTitle")} description={t("collegeDesks.expulsionsIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d?.canPropose ? <ProposeCard onDone={(text) => setNotice({ tone: "ok", text })} /> : null}
      {d && d.items.length === 0 ? <Empty icon="shield" title={t("collegeDesks.expulsionsNone")} body={t("collegeDesks.expulsionsNoneBody")} action={<Button label={t("common.retry")} variant="secondary" onPress={() => void query.refetch()} />} /> : null}
      {d && d.items.length > 0 ? (
        <Card>
          {d.items.map((x) => {
            const mine = acting?.id === x.id;
            return (
              <View key={x.id} style={{ gap: th.space[2], paddingVertical: th.space[2], borderTopWidth: 1, borderColor: th.border }}>
                <Row title={x.name} caption={[t("collegeDesks.expulsionLine", { hostel: x.hostelName, room: t("hostel.roomShort", { room: x.roomNumber }), date: formatDateKey(x.effectiveOn, locale), name: x.proposedByName }), x.reason, x.decisionNote ? t("deskParity.filingPrincipalNote", { note: x.decisionNote }) : null].filter(Boolean).join(" · ")} right={<Pill label={t(`collegeDesks.status${x.status}` as TranslationKey)} tone={TONE[x.status]} />} />
                {x.status === "ASKED" && !mine ? (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
                    {d.canDecide && role === "PRINCIPAL" ? <Button label={t("collegeDesks.approve")} accessibilityLabel={`${t("collegeDesks.approve")}: ${x.name}`} onPress={() => setActing({ id: x.id, kind: "APPROVE" })} /> : null}
                    {d.canDecide && role === "PRINCIPAL" ? <Button label={t("collegeDesks.refuse")} accessibilityLabel={`${t("collegeDesks.refuse")}: ${x.name}`} variant="secondary" onPress={() => setActing({ id: x.id, kind: "REFUSE" })} /> : null}
                    {d.canPropose ? <Button label={t("collegeDesks.expulsionWithdraw")} accessibilityLabel={`${t("collegeDesks.expulsionWithdraw")}: ${x.name}`} variant="ghost" onPress={() => setActing({ id: x.id, kind: "WITHDRAW" })} /> : null}
                  </View>
                ) : null}
                {mine && acting.kind !== "WITHDRAW" ? (
                  <>
                    <Field label={t("collegeDesks.decisionNote")} value={note} onChangeText={setNote} maxLength={600} multiline />
                    <Confirm question={t(acting.kind === "APPROVE" ? "deskParity.expulsionApproveConfirm" : "deskParity.expulsionRefuseConfirm", { name: x.name })} confirmLabel={t(acting.kind === "APPROVE" ? "collegeDesks.approve" : "collegeDesks.refuse")} busy={decide.isPending} onConfirm={() => decide.mutate({ id: x.id, approve: acting.kind === "APPROVE" })} onCancel={() => setActing(null)} />
                  </>
                ) : null}
                {mine && acting.kind === "WITHDRAW" ? <Confirm question={t("deskParity.expulsionWithdrawConfirm", { name: x.name })} confirmLabel={t("collegeDesks.expulsionWithdraw")} busy={withdraw.isPending} onConfirm={() => withdraw.mutate(x.id)} onCancel={() => setActing(null)} /> : null}
                {mine ? <OfflineDecisionNote /> : null}
              </View>
            );
          })}
        </Card>
      ) : null}
    </Screen>
  );
}

/** The proposal: a boarder by name, the reason, the day it takes effect. */
function ProposeCard({ onDone }: { onDone: (text: string) => void }) {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [allotmentId, setAllotmentId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [effectiveOn, setEffectiveOn] = useState(todayKey());
  const [error, setError] = useState<string | null>(null);
  const boarders = useQuery({ queryKey: ["hostel", "boarders"], enabled: open, queryFn: async () => hostelBoardersSchema.parse(unwrap(await api().get("/api/v1/hostel/boarders"))) });
  const propose = useMutation({
    mutationFn: async () => {
      if (!allotmentId) throw new Error(t("deskParity.expulsionNeedsBoarder"));
      if (!DATE_KEY.test(effectiveOn.trim())) throw new Error(t("deskParity.checkDate"));
      return unwrap(await api().post("/api/v1/hostel/expulsions", { allotmentId, reason: reason.trim(), incidentId: null, effectiveOn: effectiveOn.trim() }));
    },
    onSuccess: () => {
      setOpen(false);
      setAllotmentId(null);
      setReason("");
      setError(null);
      onDone(t("collegeDesks.expulsionProposed"));
      void qc.invalidateQueries({ queryKey: ["hostel"] });
    },
    onError: (e: Error) => setError(e.message),
  });
  if (!open) return <Button label={t("collegeDesks.expulsionPropose")} variant="secondary" onPress={() => setOpen(true)} />;
  const needle = q.trim().toLowerCase();
  const chosen = boarders.data?.items.find((b) => b.allotmentId === allotmentId) ?? null;
  const shown = chosen ? [] : (boarders.data?.items ?? []).filter((b) => needle.length >= 2 && b.name.toLowerCase().includes(needle)).slice(0, 8);
  return (
    <Card title={t("collegeDesks.expulsionPropose")}>
      {chosen ? (
        <Row title={chosen.name} caption={`${chosen.hostelName} · ${t("hostel.roomBed", { room: chosen.roomNumber, bed: chosen.bed })}`} right={<Button label={t("deskParity.chooseAnother")} variant="ghost" onPress={() => setAllotmentId(null)} />} />
      ) : (
        <>
          <Field label={t("collegeDesks.expulsionBoarder")} value={q} onChangeText={setQ} autoCorrect={false} maxLength={60} />
          {boarders.isPending ? <Loading /> : null}
          {boarders.isError ? <Failed message={boarders.error.message} onRetry={() => void boarders.refetch()} /> : null}
          {shown.map((b) => (
            <Row key={b.allotmentId} title={b.name} caption={`${b.hostelName} · ${t("hostel.roomBed", { room: b.roomNumber, bed: b.bed })}`} onPress={() => setAllotmentId(b.allotmentId)} />
          ))}
        </>
      )}
      <Field label={t("collegeDesks.expulsionReason")} value={reason} onChangeText={setReason} maxLength={1000} multiline />
      <Field label={t("collegeDesks.expulsionEffective")} hint={t("deskParity.dateHint")} value={effectiveOn} onChangeText={setEffectiveOn} autoCapitalize="none" autoCorrect={false} maxLength={10} />
      <Text variant="xs" tone="muted">
        {t("deskParity.expulsionIncidentOnWeb")}
      </Text>
      {error ? (
        <Text variant="sm" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
        <Button label={t("collegeDesks.expulsionSend")} disabled={!allotmentId || reason.trim().length < 10 || propose.isPending} busy={propose.isPending} onPress={() => propose.mutate()} />
        <Button label={t("common.cancel")} variant="secondary" disabled={propose.isPending} onPress={() => setOpen(false)} />
      </View>
      <OfflineDecisionNote />
    </Card>
  );
}
