import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { accountsLookupSchema, accountsSettingsSchema, collegeConcessionResultSchema, pendingConcessionsSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { usePrivateScreen } from "@/lib/private-screen";
import { useRole } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { Chips, Notice } from "../staff/shared";
import { Pill } from "../family/shared";
import { ModuleOffScreen, OfflineDecisionNote, money, paiseOfTyped, useModuleOn } from "@/screens/shared/desk";

/**
 * Concessions on the phone (the parity batch, 10 Oct 2026, R-4), the web's
 * /accounts/concessions: the queue waiting for the principal — who approves
 * or refuses each here through the web's door — and, for the accounts desk
 * and the office, the grant: a student found by PRN or name (the look-up
 * door), a percentage or an amount, the reason and the authority that
 * sanctioned it. One above the office's limit waits for the principal and is
 * not applied; the answer says which. Each is a decision, sent live and
 * never queued. Opened from the look-up with a student already chosen.
 */
export function ConcessionsScreen() {
  // No screenshots while it is up (A3-S-12): students and what they are let off.
  usePrivateScreen();
  const t = useT();
  const th = useTheme();
  const role = useRole();
  const { locale } = useLocale();
  const qc = useQueryClient();
  const on = useModuleOn("ACADEMICS");
  const params = useLocalSearchParams<{ studentMembershipId?: string; name?: string }>();
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const queue = useQuery({ queryKey: ["accounts", "concessions"], enabled: on, queryFn: async () => pendingConcessionsSchema.parse(unwrap(await api().get("/api/v1/accounts/concessions"))) });
  const settings = useQuery({ queryKey: ["accounts", "settings"], enabled: on, queryFn: async () => accountsSettingsSchema.parse(unwrap(await api().get("/api/v1/accounts/settings"))) });
  const decide = useMutation({
    mutationFn: async (v: { id: string; approve: boolean }) => unwrap(await api().post(`/api/v1/accounts/concessions/${v.id}/decide`, { approve: v.approve })),
    onSuccess: (_r, v) => {
      setNotice({ tone: "ok", text: t(v.approve ? "collegeOffice.concessionApproved" : "collegeOffice.concessionRefused") });
      void qc.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (e: Error) => setNotice({ tone: "danger", text: e.message }),
  });
  if (!on) return <ModuleOffScreen title={t("collegeOffice.navConcessions")} module="ACADEMICS" />;
  const items = queue.data?.items ?? [];
  const limit = settings.data?.concessionLimitPaise;
  return (
    <Screen title={t("collegeOffice.navConcessions")} description={limit === undefined ? undefined : t("collegeOffice.concessionsIntro", { amount: money(limit, locale) })} refreshing={queue.isRefetching} onRefresh={() => void queue.refetch()}>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      {role === "ACCOUNTS" || role === "ADMIN" ? <GrantCard initial={params.studentMembershipId && params.name ? { studentMembershipId: params.studentMembershipId, name: params.name } : null} onDone={setNotice} /> : null}
      <Card title={t("collegeOffice.pendingTitle")}>
        {queue.isPending ? <Loading /> : null}
        {queue.isError ? <Failed message={queue.error.message} onRetry={() => void queue.refetch()} /> : null}
        {queue.data && items.length === 0 ? <Empty icon="checks" title={t("deskParity.concessionsNone")} body={t("deskParity.concessionsNoneBody")} action={<Button label={t("common.retry")} variant="secondary" onPress={() => void queue.refetch()} />} /> : null}
        {items.map((c) => (
          <View key={c.id} style={{ gap: th.space[2] }}>
            <Row title={c.studentName} caption={[c.kind === "PERCENT" ? `${c.value / 100} %` : money(c.valuePaise, locale), `${t("collegeOffice.colWorth")} ${money(c.valuePaise, locale)}`, c.reason, c.authority ? `${t("collegeOffice.colAuthority")} ${c.authority}` : null, `${t("collegeOffice.colBy")} ${c.grantedBy}`].filter(Boolean).join(" · ")} right={role === "PRINCIPAL" ? undefined : <Pill label={t("collegeDesks.statusASKED")} tone="warn" />} />
            {role === "PRINCIPAL" ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
                <Button label={t("collegeOffice.approve")} accessibilityLabel={`${t("collegeOffice.approve")}: ${c.studentName}`} disabled={decide.isPending} onPress={() => decide.mutate({ id: c.id, approve: true })} />
                <Button label={t("collegeOffice.refuse")} accessibilityLabel={`${t("collegeOffice.refuse")}: ${c.studentName}`} variant="secondary" disabled={decide.isPending} onPress={() => decide.mutate({ id: c.id, approve: false })} />
              </View>
            ) : null}
          </View>
        ))}
        {role === "PRINCIPAL" && items.length > 0 ? <OfflineDecisionNote /> : null}
      </Card>
    </Screen>
  );
}

/** The grant: a student by look-up (or the one handed over), the kind and value, the reason and the authority. */
function GrantCard({ initial, onDone }: { initial: { studentMembershipId: string; name: string } | null; onDone: (n: { tone: "ok" | "danger"; text: string }) => void }) {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const [student, setStudent] = useState(initial);
  const [typed, setTyped] = useState("");
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<"PERCENT" | "AMOUNT">("PERCENT");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [authority, setAuthority] = useState("");
  const [error, setError] = useState<string | null>(null);
  const found = useQuery({ queryKey: ["accounts", "lookup", q], enabled: q.length >= 2 && !student, queryFn: async () => accountsLookupSchema.parse(unwrap(await api().get(`/api/v1/accounts/lookup?q=${encodeURIComponent(q)}`))) });
  const grant = useMutation({
    mutationFn: async () => {
      if (!student) throw new Error(t("deskParity.concessionNeedsStudent"));
      // The web's own units: a percentage in hundredths (12.5 % is 1250), an amount in paise.
      const n = kind === "PERCENT" ? (Number(value.trim()) > 0 && Number(value.trim()) <= 100 ? Math.round(Number(value.trim()) * 100) : null) : paiseOfTyped(value);
      if (n === null) throw new Error(t("deskParity.checkAmount"));
      return collegeConcessionResultSchema.parse(unwrap(await api().post("/api/v1/accounts/concessions", { studentMembershipId: student.studentMembershipId, headId: null, kind, value: n, reason: reason.trim(), authority: authority.trim() })));
    },
    onSuccess: (r) => {
      setError(null);
      setValue("");
      setReason("");
      onDone({ tone: "ok", text: t(r.approvalStatus === "PENDING" ? "collegeOffice.concessionPending" : "collegeOffice.concessionApplied") });
      void qc.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (e: Error) => setError(e.message),
  });
  return (
    <Card title={t("collegeOffice.concessionNew")}>
      {student ? (
        <Row title={student.name} right={<Button label={t("deskParity.chooseAnother")} variant="ghost" onPress={() => setStudent(null)} />} />
      ) : (
        <>
          <Field label={t("collegeDesks.lookupField")} value={typed} onChangeText={setTyped} onSubmitEditing={() => setQ(typed.trim())} returnKeyType="search" autoCapitalize="characters" autoCorrect={false} maxLength={60} />
          <Button label={t("collegeDesks.lookupButton")} variant="secondary" disabled={typed.trim().length < 2} onPress={() => setQ(typed.trim())} />
          {found.isFetching && !found.data ? <Loading /> : null}
          {found.isError ? <Failed message={found.error.message} onRetry={() => void found.refetch()} /> : null}
          {found.data && found.data.items.length === 0 ? <Text tone="muted">{t("collegeDesks.lookupNone", { q })}</Text> : null}
          {found.data?.items.map((s) => (
            <Row key={s.studentMembershipId} title={s.name} caption={[s.prn ? `${t("collegeOffice.prn")} ${s.prn}` : null, s.programme].filter(Boolean).join(" · ") || undefined} onPress={() => setStudent({ studentMembershipId: s.studentMembershipId, name: s.name })} />
          ))}
        </>
      )}
      <Chips label={t("collegeOffice.concessionKind")} value={kind} options={[{ value: "PERCENT" as const, label: t("collegeOffice.kindPercent") }, { value: "AMOUNT" as const, label: t("collegeOffice.kindAmount") }]} onChange={setKind} />
      <Field label={t("collegeOffice.concessionValue")} hint={t("collegeOffice.concessionValueHint")} value={value} onChangeText={setValue} keyboardType="decimal-pad" maxLength={12} />
      <Field label={t("collegeOffice.colReason")} value={reason} onChangeText={setReason} maxLength={200} />
      <Field label={t("collegeOffice.colAuthority")} value={authority} onChangeText={setAuthority} maxLength={120} />
      {error ? (
        <Text variant="sm" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      <View style={{ gap: th.space[2] }}>
        <Button label={t("collegeOffice.concessionGrant")} disabled={!student || value.trim() === "" || reason.trim().length < 3 || authority.trim().length < 3 || grant.isPending} busy={grant.isPending} onPress={() => grant.mutate()} />
        <OfflineDecisionNote />
      </View>
    </Card>
  );
}
