import { useState } from "react";
import { usePrivateScreen } from "@/lib/private-screen";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { feePupilLedgerSchema, feeReceiptIssuedSchema, type FeePupilLedger } from "@edulink/contracts";
import { formatBps, parseRupees } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Stat, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useRole } from "@/lib/session";
import { formatInstant, Pill } from "../family/shared";
import { clientId, demandStatusLabel, methodLabel, money, PAY_TONE, payStatusLabel, receiptPath } from "../shared/fees";
import { Chips, formatDateKey, must, openWeb, Refusal } from "./shared";

type CounterMethod = "CASH" | "CHEQUE" | "BANK" | "UPI";
const METHODS: CounterMethod[] = ["CASH", "CHEQUE", "BANK", "UPI"];

/**
 * One pupil's ledger — the web's /admin/fees/pupils/[id]: the plan, the
 * instalments, the payments with their receipts, the concessions, and for
 * the office the counter: cash, cheque, bank transfer or UPI paid at the
 * desk, recorded and receipted in one post. The post carries a clientId
 * made once per mount, so a retry after a dropped connection is the same
 * payment and not a second receipt. Reversals, refunds and concessions are
 * the web's; the phone opens the pupil there for those.
 */
export function FeePupil() {
  // A child's record, a register, a message: private while on screen (no screenshots or screen recording on the phone).
  usePrivateScreen();
  const { studentMembershipId } = useLocalSearchParams<{ studentMembershipId?: string }>();
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const role = useRole();
  const router = useRouter();
  const office = role === "ADMIN";
  const query = useQuery({
    queryKey: ["fees", "pupil", studentMembershipId],
    queryFn: async () => feePupilLedgerSchema.parse(unwrap(await api().get(`/api/v1/fees/pupils/${studentMembershipId}`))),
    enabled: Boolean(studentMembershipId),
  });
  if (!studentMembershipId) {
    return (
      <Screen title={t("fees.title")}>
        <Empty title={t("fees.notFound")} action={<Button label={t("fees.linkDues")} variant="secondary" onPress={() => router.push("/(app)/fees-dues" as never)} />} />
      </Screen>
    );
  }
  const d = query.data;
  const pupil = d?.pupil;
  return (
    <Screen
      title={pupil ? t("fees.pupilTitle", { name: pupil.name }) : t("fees.title")}
      description={pupil ? [pupil.className, pupil.studentCode, d?.year?.name].filter(Boolean).join(" · ") : undefined}
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
    >
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
            <Stat label={t("fees.lineNet")} value={money(d.totals.netPaise, locale)} />
            <Stat label={t("fees.cardCollected")} value={money(d.totals.paidPaise, locale)} tone="ok" />
            <Stat label={t("fees.cardOutstanding")} value={money(d.totals.outstandingPaise, locale)} tone={d.totals.outstandingPaise > 0 ? "warn" : "fg"} />
            <Stat label={t("fees.cardOverdue")} value={money(d.totals.overduePaise, locale)} tone={d.totals.overduePaise > 0 ? "danger" : "fg"} />
          </View>

          <Card title={t("fees.pupilPlan")}>
            {d.plan ? (
              <Text variant="base" bold>
                {d.plan.structureName}
              </Text>
            ) : (
              <Text variant="sm" tone="muted">
                {t("fees.pupilNoPlan")}
              </Text>
            )}
            {office ? <Row title={t("fees.pupilAssign")} caption={t("fees.phoneOpensWeb")} onPress={() => openWeb(`/admin/fees/pupils/${studentMembershipId}`)} /> : null}
          </Card>

          {office && d.plan ? <TakePayment ledger={d} /> : null}

          <Card title={t("fees.pupilDemandsTitle")}>
            {d.demands.length === 0 ? (
              <Text variant="sm" tone="muted">
                {t("fees.pupilNoPlan")}
              </Text>
            ) : (
              d.demands.map((row) => (
                <Row
                  key={row.id}
                  title={row.label}
                  caption={[formatDateKey(row.dueDateKey, locale), row.overdue ? t("fees.overdue") : demandStatusLabel(t, row.status), row.concessionPaise > 0 ? `${t("fees.lineConcession")} ${money(row.concessionPaise, locale)}` : null].filter(Boolean).join(" · ")}
                  right={
                    <View style={{ alignItems: "flex-end" }}>
                      <Text variant="base" bold tone={row.overdue ? "danger" : row.outstandingPaise > 0 ? "warn" : "ok"} style={{ fontVariant: ["tabular-nums"] }}>
                        {money(row.outstandingPaise, locale)}
                      </Text>
                      <Text variant="xs" tone="subtle">{`${t("fees.lineNet")} ${money(row.netPaise, locale)}`}</Text>
                    </View>
                  }
                />
              ))
            )}
          </Card>

          <Card title={t("fees.pupilPaymentsTitle")}>
            {d.payments.length === 0 ? (
              <Empty title={t("fees.parentNoHistory")} action={<Button label={t("fees.linkDues")} variant="secondary" onPress={() => router.push("/(app)/fees-dues" as never)} />} />
            ) : (
              d.payments.map((p) => (
                <Row
                  key={p.id}
                  title={`${money(p.amountPaise, locale)} · ${methodLabel(t, p.method)}`}
                  caption={[
                    formatInstant(p.paidAt ?? p.createdAt, locale, { day: "numeric", month: "short", year: "numeric" }),
                    p.reference,
                    p.collectedBy ? t("fees.collectedBy", { name: p.collectedBy }) : p.payer ? t("fees.paidBy", { name: p.payer }) : null,
                    p.reversalReason ? `${t("fees.reverseTitle")} · ${p.reversalReason}` : null,
                    p.refundedPaise > 0 ? t("fees.receiptRefundedBanner", { amount: money(p.refundedPaise, locale) }) : null,
                    p.receipt ? `${t("fees.receiptOpen")} ${p.receipt.serial} · ${t("fees.phoneOpensWeb")}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  right={<Pill label={payStatusLabel(t, p.status)} tone={PAY_TONE[p.status] ?? "muted"} />}
                  onPress={p.receipt ? () => openWeb(receiptPath(p.receipt!.id)) : undefined}
                />
              ))
            )}
          </Card>

          {d.concessions.length > 0 ? (
            <Card title={t("fees.pupilConcessionsTitle")}>
              {d.concessions.map((c) => (
                <Row
                  key={c.id}
                  title={`${c.headName ?? t("fees.allHeads")} · ${c.kind === "PERCENT" ? formatBps(c.value) : money(c.value, locale)}`}
                  caption={[c.reason, c.grantedBy, formatInstant(c.createdAt, locale, { day: "numeric", month: "short", year: "numeric" })].filter(Boolean).join(" · ")}
                  right={c.revokedAt ? <Pill label={t("fees.concessionRevoked")} tone="muted" /> : <Pill label={c.kind === "PERCENT" ? t("fees.concessionPercent") : t("fees.concessionAmount")} tone="ok" />}
                />
              ))}
            </Card>
          ) : null}
          {office ? <Row title={t("fees.concessionTitle")} caption={t("fees.phoneOpensWeb")} onPress={() => openWeb(`/admin/fees/pupils/${studentMembershipId}`)} /> : null}
        </>
      ) : null}
    </Screen>
  );
}

/** The counter: what was handed over, how, and the receipt is issued on the spot. */
function TakePayment({ ledger }: { ledger: FeePupilLedger }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const qc = useQueryClient();
  const toast = useToast();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<CounterMethod>("CASH");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [tried, setTried] = useState(false);
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  // One id per form: a retry after a dropped connection lands as the same payment.
  const [id, setId] = useState(clientId);
  const paise = parseRupees(amount);
  const amountBad = paise === null || paise < 100;
  const record = useMutation({
    mutationFn: async () =>
      feeReceiptIssuedSchema.parse(
        must(
          await api().post("/api/v1/fees/payments", {
            studentMembershipId: ledger.pupil.studentMembershipId,
            amountPaise: paise ?? 0,
            method,
            reference: reference.trim() || null,
            note: note.trim() || null,
            clientId: id,
          }),
          t("common.somethingWrong"),
        ),
      ),
    onSuccess: (r) => {
      toast.show(t("fees.takeDone", { serial: r.serial }));
      setAmount("");
      setReference("");
      setNote("");
      setTried(false);
      setRefusal(null);
      setId(clientId());
      void qc.invalidateQueries({ queryKey: ["fees"] });
    },
    onError: (e) => setRefusal(e instanceof Refusal ? e : new Refusal(e.message, 0, {})),
  });
  return (
    <Card title={t("fees.takePaymentTitle")}>
      {refusal ? <Failed message={refusal.message} /> : null}
      <Field label={t("fees.takeAmount")} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" error={tried && amountBad ? t("fees.refuseAmount") : refusal?.issues.amountPaise} />
      <Chips label={t("fees.takeMethod")} value={method} options={METHODS.map((m) => ({ value: m, label: methodLabel(t, m) }))} onChange={setMethod} />
      <Field label={t("fees.takeReference")} hint={t("fees.takeReferenceHint")} value={reference} onChangeText={setReference} autoCapitalize="characters" maxLength={60} error={refusal?.issues.reference} />
      <Field label={t("fees.takeNote")} value={note} onChangeText={setNote} multiline maxLength={300} />
      <View style={{ gap: th.space[1] }}>
        <Button
          label={t("fees.takeGo")}
          busy={record.isPending}
          onPress={() => {
            setTried(true);
            if (!amountBad) record.mutate();
          }}
        />
        {ledger.totals.outstandingPaise > 0 ? (
          <Text variant="xs" tone="subtle">
            {`${t("fees.takeForOldest")} · ${t("fees.cardOutstanding")} ${money(ledger.totals.outstandingPaise, locale)}`}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}
