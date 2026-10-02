import { useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gigPayoutPaidSchema, gigPayoutsSchema, gigRouteLinkAllSchema, type GigPayouts } from "@edulink/contracts";
import { Button, Card, Failed, Field, Loading, Screen, Stat, Text } from "@/components";
import { SwitchRow } from "@/components/switch-row";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { formatInstant, Note, Pill } from "@/screens/family/shared";
import { money } from "@/screens/shared/fees";
import { ROUTE_STATUS } from "@/screens/expert/earnings";

/**
 * Paid seats on the operator's console — the web's "Razorpay Route status"
 * and "Paid seats and payouts" cards on /root/gigs (decision 0004, third
 * amendment of 2 October 2026): the four lines Route needs before paid seats
 * may be switched on, the experts' linked accounts and the button that links
 * every ready one; the kill switch, which cannot be turned on until Route is
 * ready; the month's commission and GST, what is held and released; the
 * releases, transfers and refunds that failed and wait to be tried again;
 * and what was released or paid. Payouts the company still owes by hand from
 * before Route keep the form that records its transfer (which issues the tax
 * invoice), shown only while one is open. The company's own details (the
 * seller on the invoice) are set on the web; this screen says what is
 * missing until they are.
 */
const KEY = ["operator", "gigs", "payouts"] as const;

export function OperatorPayouts() {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const qc = useQueryClient();
  const [said, setSaid] = useState<string | null>(null);
  const [failedSaid, setFailedSaid] = useState<string | null>(null);
  const [recording, setRecording] = useState<{ payoutId: string; reference: string; note: string } | null>(null);
  const query = useQuery({ queryKey: KEY, queryFn: async () => gigPayoutsSchema.parse(unwrap(await api().get("/api/v1/operator/gigs/payouts"))) });
  const settle = {
    onSuccess: (line: string) => {
      setFailedSaid(null);
      setSaid(line);
      void qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (e: Error) => {
      setSaid(null);
      setFailedSaid(e.message);
    },
  };
  const flip = useMutation({
    mutationFn: async (on: boolean) => {
      const result = await api().post("/api/v1/operator/gigs/payouts/switch", { on });
      if (!result.ok) throw new Error(errorText(result, t("common.somethingWrong")));
      return t("gigs.opSwitched");
    },
    ...settle,
  });
  const retry = useMutation({
    mutationFn: async (paymentId: string) => {
      const result = await api().post(`/api/v1/operator/gigs/payments/${paymentId}/retry`);
      if (!result.ok) throw new Error(errorText(result, t("common.somethingWrong")));
      return t("gigs.opRetried", { outcome: String((result.data as { outcome?: string }).outcome ?? "") });
    },
    ...settle,
  });
  const linkAll = useMutation({
    mutationFn: async () => {
      const result = await api().post("/api/v1/operator/gigs/route/link");
      if (!result.ok) throw new Error(errorText(result, t("common.somethingWrong")));
      const { run } = gigRouteLinkAllSchema.parse(result.data);
      return t("gigs.opRouteLinked", { activated: run.activated, pending: run.pending, refused: run.refused });
    },
    ...settle,
  });
  const record = useMutation({
    mutationFn: async (input: { payoutId: string; name: string; reference: string; note: string }) => {
      const result = await api().post(`/api/v1/operator/gigs/payouts/${input.payoutId}/pay`, { reference: input.reference, note: input.note || null });
      if (!result.ok) throw new Error(errorText(result, t("common.somethingWrong")));
      const made = gigPayoutPaidSchema.parse(result.data);
      return t("gigs.opPayoutRecorded", { amount: money(made.payout.netPaise, locale), name: input.name, number: made.invoice.number });
    },
    ...settle,
    onSuccess: (line: string) => {
      setRecording(null);
      settle.onSuccess(line);
    },
  });
  const d = query.data;
  const when = (iso: string) => formatInstant(iso, locale, { day: "numeric", month: "short" }, "Asia/Kolkata");
  const missingWords = (m: "legalName" | "gstin" | "stateCode") => (m === "legalName" ? t("gigs.opMissingLegalName") : m === "gstin" ? t("gigs.opMissingGstin") : t("gigs.opMissingStateCode"));

  return (
    <Screen title={t("gigs.opPayoutsTitle")} description={t("gigs.opPayoutsIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {failedSaid ? <Failed message={failedSaid} /> : null}
      {said ? (
        <Note tone="ok">
          <Text variant="sm" bold tone="ok" accessibilityLiveRegion="polite">
            {said}
          </Text>
        </Note>
      ) : null}
      {d ? (
        <>
          <RouteCard data={d} linking={linkAll.isPending} onLinkAll={() => linkAll.mutate()} />
          <Card>
            <SwitchRow label={d.paymentsEnabled ? t("gigs.opSwitchOn") : t("gigs.opSwitchOff")} hint={t("gigs.opTransport", { transport: d.transport })} value={d.paymentsEnabled} disabled={flip.isPending || (!d.paymentsEnabled && !d.route.ready)} onChange={(next) => flip.mutate(next)} />
            {!d.paymentsEnabled && !d.route.ready ? (
              <Text variant="xs" tone="muted">
                {t("gigs.refuseRouteNotReady")}
              </Text>
            ) : null}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
              <Stat label={t("gigs.opCommission")} value={money(d.commissionThisMonthPaise, locale)} tone="accent" />
              <Stat label={t("gigs.opGst")} value={money(d.gstThisMonthPaise, locale)} tone="accent" />
              <Stat label={t("gigs.opHeld")} value={money(d.heldPaise, locale)} tone="warn" />
              <Stat label={t("gigs.opReleased")} value={money(d.releasedThisMonthPaise, locale)} tone="ok" />
              {d.duePaise > 0 ? <Stat label={t("gigs.opDue")} value={money(d.duePaise, locale)} tone="warn" /> : null}
              {d.paidOutThisMonthPaise > 0 ? <Stat label={t("gigs.opPaidOut")} value={money(d.paidOutThisMonthPaise, locale)} tone="ok" /> : null}
              <Stat label={t("gigs.opRefunded")} value={money(d.refundedThisMonthPaise, locale)} />
            </View>
            {d.company.missing.length > 0 ? (
              <Note tone="warn">
                <Text variant="sm" tone="fg">
                  {t("gigs.opCompanyMissing", { missing: d.company.missing.map(missingWords).join(", ") })}
                </Text>
              </Note>
            ) : null}
          </Card>
          {d.toPay.length > 0 ? (
            <Card title={t("gigs.opToPayTitle")}>
              <Text variant="sm" tone="muted">
                {[t("gigs.opLegacyNote"), t("gigs.opToPayIntro")].join(" ")}
              </Text>
              {d.toPay.map((p) => {
                const payee = p.payee;
                const canRecord = d.company.missing.length === 0 && payee.status === "ACTIVE";
                const open = recording?.payoutId === p.id ? recording : null;
                return (
                  <View key={p.id} style={{ gap: th.space[1], paddingVertical: th.space[2], borderTopWidth: 1, borderTopColor: th.border }}>
                    <Text variant="sm" bold>
                      {[p.expertName, t("gigs.payoutLine", { amount: money(p.netPaise, locale), count: p.paymentsCount })].join(" · ")}
                    </Text>
                    {payee.payeeName ? (
                      <Text variant="xs" tone="muted">
                        {[payee.payeeName, payee.upiId ? t("gigs.payeeUpiLine", { upiId: payee.upiId }) : t("gigs.payeeBankLine", { last4: payee.bankLast4 ?? "", ifsc: payee.ifsc ?? "" }), t("gigs.opPayeeState", { code: payee.gstStateCode ?? "" }), payee.gstin ? t("gigs.opPayeeGstin", { gstin: payee.gstin }) : null].filter(Boolean).join(" · ")}
                      </Text>
                    ) : (
                      <Text variant="xs" tone="muted">
                        {t("gigs.opPayeeNone")}
                      </Text>
                    )}
                    {payee.status === "SUSPENDED" ? <Pill label={t("gigs.opPayeeSuspended")} tone="danger" /> : null}
                    {open ? (
                      <View style={{ gap: th.space[2] }}>
                        <Field label={t("gigs.utr")} value={open.reference} onChangeText={(reference) => setRecording((r) => (r ? { ...r, reference } : r))} maxLength={40} autoCapitalize="characters" />
                        <Field label={t("gigs.opPayNote")} value={open.note} onChangeText={(note) => setRecording((r) => (r ? { ...r, note } : r))} maxLength={300} />
                        <Button label={t("gigs.opRecordPayout")} accessibilityLabel={t("gigs.opRecordPayoutFor", { name: p.expertName })} busy={record.isPending} onPress={() => record.mutate({ payoutId: p.id, name: p.expertName, reference: open.reference, note: open.note })} />
                        <Button label={t("common.cancel")} variant="ghost" onPress={() => setRecording(null)} />
                      </View>
                    ) : (
                      <Button label={t("gigs.opRecordPayout")} variant="secondary" accessibilityLabel={t("gigs.opRecordPayoutFor", { name: p.expertName })} disabled={!canRecord} onPress={() => setRecording({ payoutId: p.id, reference: "", note: "" })} />
                    )}
                  </View>
                );
              })}
            </Card>
          ) : null}
          <Card title={t("gigs.opFailures")}>
            {d.failures.length === 0 ? (
              <Text variant="sm" tone="muted">
                {t("gigs.opFailuresNone")}
              </Text>
            ) : (
              d.failures.map((f) => (
                <View key={f.paymentId} style={{ gap: th.space[1], paddingVertical: th.space[2], borderTopWidth: 1, borderTopColor: th.border }}>
                  <Text variant="sm" bold>
                    {[f.expertName, money(f.amountPaise, locale), t(`gigs.opAction${f.action}`), t("gigs.opAttempts", { count: f.attempts })].join(" · ")}
                  </Text>
                  {f.lastError ? (
                    <Text variant="xs" tone="muted">
                      {f.lastError}
                    </Text>
                  ) : null}
                  <Button label={t("gigs.opRetry")} variant="secondary" accessibilityLabel={[t("gigs.opRetry"), f.expertName].join(": ")} busy={retry.isPending && retry.variables === f.paymentId} onPress={() => retry.mutate(f.paymentId)} />
                </View>
              ))
            )}
          </Card>
          <Card title={t("gigs.opPaidTitle")}>
            {d.paid.length === 0 ? (
              <Text variant="sm" tone="muted">
                {t("gigs.opPayoutsNone")}
              </Text>
            ) : (
              d.paid.map((p) => (
                <View key={p.id} style={{ gap: th.space[1], paddingVertical: th.space[2], borderTopWidth: 1, borderTopColor: th.border }}>
                  <Text variant="sm" bold>
                    {[p.expertName, t("gigs.payoutLine", { amount: money(p.netPaise, locale), count: p.paymentsCount })].join(" · ")}
                  </Text>
                  <Text variant="xs" tone="muted">
                    {[p.paidAt ? (p.status === "RELEASED" ? t("gigs.opReleasedLine", { date: when(p.paidAt) }) : t("gigs.paidOutLine", { date: when(p.paidAt), reference: p.reference ?? "" })) : null, p.invoiceNumber, p.note].filter(Boolean).join(" · ")}
                  </Text>
                </View>
              ))
            )}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

/** Whether Razorpay Route is working on the company's account, line by line, and where each expert's linked account stands. */
function RouteCard({ data, linking, onLinkAll }: { data: GigPayouts; linking: boolean; onLinkAll: () => void }) {
  const t = useT();
  const th = useTheme();
  const route = data.route;
  const lines: [boolean, string][] = [
    [route.gatewaySet, t("gigs.opRouteGateway", { transport: data.transport })],
    [route.webhookSet, t("gigs.opRouteWebhook")],
    [route.companySet, t("gigs.opRouteCompany")],
    [route.activated > 0, t("gigs.opRouteActivated", { count: route.activated })],
  ];
  return (
    <Card title={t("gigs.opRouteTitle")}>
      <Text variant="sm" tone="muted">
        {t("gigs.opRouteIntro")}
      </Text>
      <View style={{ gap: th.space[1] }}>
        {lines.map(([done, label]) => (
          <Text key={label} variant="sm" tone={done ? "fg" : "muted"}>
            {`${done ? "✓" : "○"} ${label}`}
          </Text>
        ))}
      </View>
      <Text variant="xs" tone="muted">
        {t("gigs.opRouteCounts", { inReview: route.inReview, attention: route.needsAttention, ready: route.readyToLink })}
      </Text>
      <Button label={t("gigs.opRouteLinkAll")} variant="secondary" busy={linking} disabled={!route.gatewaySet} onPress={onLinkAll} />
      <Text variant="sm" bold>
        {t("gigs.opRouteAccountsTitle")}
      </Text>
      {data.routeAccounts.length === 0 ? (
        <Text variant="sm" tone="muted">
          {t("gigs.opRouteAccountsNone")}
        </Text>
      ) : (
        data.routeAccounts.map((a) => {
          const notes = [!a.kycVerified ? t("gigs.opRouteNoKyc") : null, !a.linked && !a.readyToLink ? t("gigs.opRouteIncomplete") : null, a.needsResend ? t("gigs.opRouteResend") : null, ...a.requirements.map((r) => t("gigs.routeRequirement", { field: r.field }))].filter(Boolean).join(" · ");
          return (
            <View key={a.expertUserId} style={{ gap: th.space[1], paddingVertical: th.space[2], borderTopWidth: 1, borderTopColor: th.border }}>
              <Text variant="sm" bold>
                {a.expertName}
              </Text>
              {notes ? (
                <Text variant="xs" tone="muted">
                  {notes}
                </Text>
              ) : null}
              {a.error ? (
                <Text variant="xs" tone="danger">
                  {a.error}
                </Text>
              ) : null}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[1] }}>
                <Pill label={t(ROUTE_STATUS[a.status].label)} tone={ROUTE_STATUS[a.status].tone} />
                {a.suspended ? <Pill label={t("gigs.opPayeeSuspended")} tone="danger" /> : null}
              </View>
            </View>
          );
        })
      )}
    </Card>
  );
}
