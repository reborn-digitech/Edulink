import { useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SCHOLARSHIP_STATUSES, scholarshipClaimSchema, scholarshipClaimsSchema, type ScholarshipClaimView, type ScholarshipStatus } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { usePrivateScreen } from "@/lib/private-screen";
import { useRole } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { Chips, Notice } from "../staff/shared";
import { Pill } from "../family/shared";
import { DATE_KEY, ModuleOffScreen, OfflineDecisionNote, money, paiseOfTyped, todayKey, useModuleOn } from "@/screens/shared/desk";

type Filter = "WAITING" | ScholarshipStatus;
type Action = "SANCTION" | "DISBURSE" | "LAPSE" | "REJECT";

/**
 * The scholarship claims on the phone (the parity batch, 10 Oct 2026, R-4),
 * the web's /accounts/scholarships: each claim filed on the portal with its
 * scheme, year, portal id, what was expected, sanctioned and disbursed, and
 * how long the state has owed it. The desk's steps go through the web's one
 * door (POST /college/scholarships/claims/{id}): the sanction (amount, day),
 * the disbursement (a bank payment on the ledger: amount, day, reference),
 * a lapse or a rejection with its reason — each a step the server refuses a
 * second time, so each is a decision sent live and never queued. Recording a
 * new claim and the reconciliation sheet stay on the web. No money moves
 * here (decision 0003): the disbursement records what the bank paid.
 */
export function ScholarshipClaimsScreen() {
  // No screenshots while it is up (A3-S-12): students' claims and their categories.
  usePrivateScreen();
  const t = useT();
  const role = useRole();
  const on = useModuleOn("SCHOLARSHIPS");
  const [filter, setFilter] = useState<Filter>("WAITING");
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const query = useQuery({ queryKey: ["college", "scholarships", "claims"], enabled: on, queryFn: async () => scholarshipClaimsSchema.parse(unwrap(await api().get("/api/v1/college/scholarships/claims"))) });
  if (!on) return <ModuleOffScreen title={t("collegeOffice.navScholarships")} module="SCHOLARSHIPS" />;
  const canAct = role === "ACCOUNTS" || role === "ADMIN";
  const items = (query.data?.items ?? []).filter((c) => (filter === "WAITING" ? c.status === "APPLIED" || c.status === "SANCTIONED" : c.status === filter));
  return (
    <Screen title={t("collegeOffice.navScholarships")} description={t("deskParity.claimsIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      <Chips label={t("collegeOffice.colStatus")} value={filter} options={[{ value: "WAITING" as Filter, label: t("deskParity.claimsWaiting") }, ...SCHOLARSHIP_STATUSES.map((s) => ({ value: s as Filter, label: t(`collegeOffice.claim${s}` as TranslationKey) }))]} onChange={setFilter} />
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {query.data && items.length === 0 ? <Empty icon="receipt" title={t("deskParity.claimsNone")} body={t("deskParity.claimsNoneBody")} action={<Button label={t("common.retry")} variant="secondary" onPress={() => void query.refetch()} />} /> : null}
      {items.length > 0 ? (
        <Card>
          {items.map((c) => (
            <ClaimCard key={c.id} claim={c} canAct={canAct} onDone={setNotice} />
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}

const TONE: Record<ScholarshipStatus, "ok" | "warn" | "danger" | "accent"> = { APPLIED: "warn", SANCTIONED: "accent", DISBURSED: "ok", LAPSED: "danger", REJECTED: "danger" };

function ClaimCard({ claim, canAct, onDone }: { claim: ScholarshipClaimView; canAct: boolean; onDone: (n: { tone: "ok" | "danger"; text: string }) => void }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const qc = useQueryClient();
  const [action, setAction] = useState<Action | null>(null);
  const [amount, setAmount] = useState(String(Math.round((claim.sanctionedPaise ?? claim.expectedPaise) / 100)));
  const [on, setOn] = useState(todayKey());
  const [reference, setReference] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const step = useMutation({
    mutationFn: async () => {
      const paise = paiseOfTyped(amount);
      if ((action === "SANCTION" || action === "DISBURSE") && paise === null) throw new Error(t("deskParity.checkAmount"));
      if ((action === "SANCTION" || action === "DISBURSE") && !DATE_KEY.test(on.trim())) throw new Error(t("deskParity.checkDate"));
      const body =
        action === "SANCTION" ? { action, amountPaise: paise, on: on.trim() } : action === "DISBURSE" ? { action, amountPaise: paise, on: on.trim(), reference: reference.trim() } : { action, reason: reason.trim() };
      return scholarshipClaimSchema.parse(unwrap(await api().post(`/api/v1/college/scholarships/claims/${claim.id}`, body)));
    },
    onSuccess: (c) => {
      setAction(null);
      setError(null);
      onDone({ tone: "ok", text: t("deskParity.claimUpdated", { name: c.studentName, status: t(`collegeOffice.claim${c.status}` as TranslationKey) }) });
      void qc.invalidateQueries({ queryKey: ["college", "scholarships"] });
      void qc.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (e: Error) => setError(e.message),
  });
  const caption = [
    `${t(`collegeOffice.scheme${claim.scheme}` as TranslationKey)} · ${claim.academicYear}`,
    claim.portalApplicationId ? `${t("collegeOffice.colPortalId")} ${claim.portalApplicationId}` : null,
    `${t("collegeOffice.colExpected")} ${money(claim.expectedPaise, locale)}`,
    claim.sanctionedPaise === null ? null : `${t("collegeOffice.colSanctioned")} ${money(claim.sanctionedPaise, locale)}`,
    claim.disbursedPaise === null ? null : `${t("collegeOffice.colDisbursed")} ${money(claim.disbursedPaise, locale)}${claim.disbursementRef ? ` (${claim.disbursementRef})` : ""}`,
    claim.ageDays === null ? null : `${t("collegeOffice.colAge")} ${t("collegeOffice.ageDays", { n: claim.ageDays })}`,
  ]
    .filter(Boolean)
    .join(" · ");
  const open = claim.status === "APPLIED" || claim.status === "SANCTIONED";
  const label = (a: Action) => t(`deskParity.claim${a}` as TranslationKey);
  return (
    <View style={{ gap: th.space[2], paddingVertical: th.space[2], borderTopWidth: 1, borderColor: th.border }}>
      <Row title={claim.studentName} caption={caption} right={<Pill label={t(`collegeOffice.claim${claim.status}` as TranslationKey)} tone={TONE[claim.status]} />} />
      {error ? (
        <Text variant="sm" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      {canAct && open && action === null ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
          {claim.status === "APPLIED" ? <Button label={label("SANCTION")} accessibilityLabel={`${label("SANCTION")}: ${claim.studentName}`} onPress={() => setAction("SANCTION")} /> : null}
          {claim.status === "SANCTIONED" ? <Button label={label("DISBURSE")} accessibilityLabel={`${label("DISBURSE")}: ${claim.studentName}`} onPress={() => setAction("DISBURSE")} /> : null}
          <Button label={label("LAPSE")} accessibilityLabel={`${label("LAPSE")}: ${claim.studentName}`} variant="ghost" onPress={() => setAction("LAPSE")} />
          <Button label={label("REJECT")} accessibilityLabel={`${label("REJECT")}: ${claim.studentName}`} variant="ghost" onPress={() => setAction("REJECT")} />
        </View>
      ) : null}
      {action === "SANCTION" || action === "DISBURSE" ? (
        <>
          <Field label={t("collegeOffice.amount")} value={amount} onChangeText={setAmount} keyboardType="number-pad" maxLength={12} />
          <Field label={t("placement.fieldDay")} hint={t("deskParity.dateHint")} value={on} onChangeText={setOn} autoCapitalize="none" autoCorrect={false} maxLength={10} />
          {action === "DISBURSE" ? <Field label={t("deskParity.claimReference")} hint={t("deskParity.claimReferenceHint")} value={reference} onChangeText={setReference} autoCapitalize="characters" autoCorrect={false} maxLength={80} /> : null}
        </>
      ) : null}
      {action === "LAPSE" || action === "REJECT" ? <Field label={t("collegeOffice.colReason")} value={reason} onChangeText={setReason} maxLength={300} multiline /> : null}
      {action !== null ? (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
            <Button label={label(action)} variant={action === "LAPSE" || action === "REJECT" ? "danger" : "primary"} disabled={step.isPending || (action === "DISBURSE" && reference.trim().length < 3) || ((action === "LAPSE" || action === "REJECT") && reason.trim().length < 3)} busy={step.isPending} onPress={() => step.mutate()} />
            <Button label={t("common.cancel")} variant="secondary" disabled={step.isPending} onPress={() => setAction(null)} />
          </View>
          <OfflineDecisionNote />
        </>
      ) : null}
    </View>
  );
}
