import { useEffect, useRef, useState } from "react";
import { usePrivateScreen } from "@/lib/private-screen";
import { Linking, Pressable, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { familyCheckoutSchema, familyFeesSchema, familyPaymentStatusSchema, familyUpiStartSchema, type FamilyFees as FamilyFeesData } from "@edulink/contracts";
import type { z } from "zod";
import { Button, Card, Empty, Failed, Field, Icon, Loading, Row, Screen, Stat, Text } from "@/components";
import { API_BASE, api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useRole } from "@/lib/session";
import { ChildSwitcher, childQuery, formatDateKey, formatInstant, Note, openWeb, param, Pill } from "./shared";
import { demandStatusLabel, methodLabel, money, PAY_TONE, payable, payStatusLabel, receiptPath } from "../shared/fees";

/**
 * Fees for the family — the web's /parent/fees: what the school asked for
 * this year, what has been paid, and the ways this school takes the rest.
 * The phone chooses the instalments and starts the payment; the money goes
 * to the school's own gateway or UPI id, never through Relay. An online
 * checkout opens the school's payment page on the web (the gateway's own
 * script runs there), and the phone watches the payment until the receipt
 * appears; a UPI payment opens the UPI app with the school as payee and the
 * parent brings the UTR back.
 */
type Child = NonNullable<FamilyFeesData["child"]>;
type UpiStart = z.infer<typeof familyUpiStartSchema>;
type Flow = { kind: "online"; paymentId: string; devbox: boolean; startedAt: number } | { kind: "upi"; start: UpiStart; noApp: boolean };

/** How often and how long the phone asks after a started payment; a test shortens both. */
export const POLL = { intervalMs: 2000, maxMs: 60_000 };

const SETTLED = new Set(["PAID", "FAILED", "REVERSED", "REFUNDED"]);

export function FamilyFees() {
  // A child's record, a register, a message: private while on screen (no screenshots or screen recording on the phone).
  usePrivateScreen();
  const role = useRole();
  const t = useT();
  const router = useRouter();
  if (role === "PARENT") return <ParentFees />;
  return (
    <Screen title={t("fees.parentTitle")}>
      {role === null ? <Loading /> : <Empty title={t("fees.parentTitle")} body={t("fees.refuseFamily")} action={<Button label={t("nav.messages")} variant="secondary" onPress={() => router.push("/(app)/messages" as never)} />} />}
    </Screen>
  );
}

function ParentFees() {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const qc = useQueryClient();
  const router = useRouter();
  const params = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  const [childId, setChildId] = useState<string | null>(param(params.childId) ?? param(params.child) ?? null);
  // null = every instalment that can be paid; a list once the parent has chosen.
  const [chosen, setChosen] = useState<string[] | null>(null);
  const [flow, setFlow] = useState<Flow | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const query = useQuery({
    queryKey: ["family", "fees", childId],
    queryFn: async () => familyFeesSchema.parse(unwrap(await api().get(`/api/v1/fees/family${childQuery(childId)}`))),
  });
  const d = query.data;
  const child = d?.child ?? null;
  const open = child ? child.demands.filter((row) => payable(row.status)) : [];
  const selected = open.filter((row) => chosen === null || chosen.includes(row.id));
  const total = selected.reduce((sum, row) => sum + row.outstandingPaise, 0);
  const refresh = () => void qc.invalidateQueries({ queryKey: ["family", "fees"] });

  function toggle(id: string) {
    const current = new Set(selected.map((row) => row.id));
    if (current.has(id)) current.delete(id);
    else current.add(id);
    setChosen([...current]);
  }

  const checkout = useMutation({
    mutationFn: async (body: { studentMembershipId: string; demandIds: string[] }) => {
      const result = await api().post("/api/v1/fees/family/checkout", body);
      if (!result.ok) throw new Error(errorText(result, t("common.somethingWrong")));
      return familyCheckoutSchema.parse(result.data);
    },
    onSuccess: (order) => {
      setNotice(null);
      setFlow({ kind: "online", paymentId: order.paymentId, devbox: order.transport === "devbox", startedAt: Date.now() });
      if (order.transport === "razorpay") {
        // The gateway's checkout runs on the school's own web page; the phone opens it signed in and watches the payment from here.
        const url = `${API_BASE}/parent/fees?checkout=${encodeURIComponent(order.paymentId)}`;
        WebBrowser.openBrowserAsync(url).catch(() => openWeb(`/parent/fees?checkout=${encodeURIComponent(order.paymentId)}`));
      }
    },
    onError: (e) => setNotice({ tone: "danger", text: e.message }),
  });
  const upiStart = useMutation({
    mutationFn: async (body: { studentMembershipId: string; demandIds: string[] }) => {
      const result = await api().post("/api/v1/fees/family/upi", body);
      if (!result.ok) throw new Error(errorText(result, t("common.somethingWrong")));
      return familyUpiStartSchema.parse(result.data);
    },
    onSuccess: (start) => {
      setNotice(null);
      setFlow({ kind: "upi", start, noApp: false });
    },
    onError: (e) => setNotice({ tone: "danger", text: e.message }),
  });

  const pay = (start: (body: { studentMembershipId: string; demandIds: string[] }) => void) => {
    if (child && selected.length > 0) start({ studentMembershipId: child.studentMembershipId, demandIds: selected.map((row) => row.id) });
  };
  const options = child?.options;
  const anyWay = Boolean(options && (options.online || options.upi || options.bankNote));

  return (
    <Screen title={t("fees.parentTitle")} description={t("fees.parentIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {d && d.children.length > 1 ? (
        <ChildSwitcher
          pupils={d.children.map((c) => ({ guardianshipId: "", studentUserId: "", relation: "", leftAt: null, ...c }))}
          selectedId={child?.studentMembershipId ?? null}
          onSelect={(id) => {
            setChildId(id);
            setChosen(null);
            setFlow(null);
          }}
        />
      ) : null}
      {notice ? (
        <Note tone={notice.tone}>
          <Text variant="sm" bold tone={notice.tone} accessibilityLiveRegion="polite">
            {notice.text}
          </Text>
        </Note>
      ) : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d && !child ? <Empty title={t("fees.parentNoChild")} action={<Button label={t("meta.linkChild")} variant="secondary" onPress={() => router.push("/(app)/link-child" as never)} />} /> : null}
      {child && !child.year ? <Empty title={t("fees.parentNoYear")} action={<Button label={t("nav.messages")} variant="secondary" onPress={() => router.push("/(app)/messages" as never)} />} /> : null}
      {child && child.year ? (
        <>
          <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
            <Stat label={t("fees.parentOutstanding")} value={money(child.totals.outstandingPaise, locale)} tone={child.totals.outstandingPaise > 0 ? "warn" : "ok"} />
            <Stat label={t("fees.parentOverdue")} value={money(child.totals.overduePaise, locale)} tone={child.totals.overduePaise > 0 ? "danger" : "fg"} />
            <Stat label={t("fees.parentPaidSoFar")} value={money(child.totals.paidPaise, locale)} tone="ok" />
          </View>

          {flow?.kind === "online" ? (
            <OnlineWatch flow={flow} onDone={refresh} onClose={() => setFlow(null)} />
          ) : flow?.kind === "upi" ? (
            <UpiFlow
              flow={flow}
              onNoApp={() => setFlow({ ...flow, noApp: true })}
              onClaimed={() => {
                setFlow(null);
                setNotice({ tone: "ok", text: t("fees.upiClaimed") });
                refresh();
              }}
              onClose={() => setFlow(null)}
            />
          ) : (
            <Card title={t("fees.parentPickTitle")}>
              {open.length === 0 ? (
                <Text variant="sm" tone="ok" bold>
                  {t("fees.parentNothingDue")}
                </Text>
              ) : (
                <>
                  {open.map((row) => {
                    const on = selected.some((s) => s.id === row.id);
                    const caption = [t("fees.parentDue", { date: formatDateKey(row.dueDateKey, locale) }), row.overdue ? t("fees.overdue") : demandStatusLabel(t, row.status)].join(" · ");
                    return (
                      <Pressable
                        key={row.id}
                        accessibilityRole="checkbox"
                        aria-checked={on}
                        accessibilityState={{ checked: on }}
                        accessibilityLabel={`${row.label}, ${money(row.outstandingPaise, locale)}, ${caption}`}
                        onPress={() => toggle(row.id)}
                        style={({ pressed }) => ({ minHeight: th.tap, flexDirection: "row", alignItems: "center", gap: th.space[3], paddingVertical: th.space[2], opacity: pressed ? 0.7 : 1 })}
                      >
                        <Icon name={on ? "checkCircle" : "circle"} size={24} color={on ? th.accent : th.fgSubtle} weight={on ? "fill" : "regular"} />
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text variant="base" bold>
                            {row.label}
                          </Text>
                          <Text variant="sm" tone={row.overdue ? "danger" : "muted"}>
                            {caption}
                          </Text>
                        </View>
                        <Text variant="base" bold style={{ fontVariant: ["tabular-nums"] }}>
                          {money(row.outstandingPaise, locale)}
                        </Text>
                      </Pressable>
                    );
                  })}
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: th.border, paddingTop: th.space[2] }}>
                    <Text variant="base" bold>
                      {t("fees.parentTotal")}
                    </Text>
                    <Text variant="lg" bold accessibilityLiveRegion="polite" accessibilityLabel={`${t("fees.parentTotal")}: ${money(total, locale)}`} style={{ fontVariant: ["tabular-nums"] }}>
                      {money(total, locale)}
                    </Text>
                  </View>
                  {anyWay ? (
                    <View style={{ flexDirection: "row", gap: th.space[2], flexWrap: "wrap" }}>
                      {options?.online ? <Button label={t("fees.parentPayOnline")} disabled={selected.length === 0} busy={checkout.isPending} onPress={() => pay(checkout.mutate)} style={{ flexGrow: 1 }} /> : null}
                      {options?.upi ? <Button label={t("fees.parentPayUpi")} variant={options.online ? "secondary" : "primary"} disabled={selected.length === 0} busy={upiStart.isPending} onPress={() => pay(upiStart.mutate)} style={{ flexGrow: 1 }} /> : null}
                    </View>
                  ) : (
                    <Note tone="warn">
                      <Text variant="sm" tone="warn">
                        {t("fees.parentSchoolTakesNothing")}
                      </Text>
                    </Note>
                  )}
                </>
              )}
            </Card>
          )}

          {options?.bankNote ? (
            <Card title={t("fees.parentPayBank")}>
              <Text variant="sm" tone="muted">
                {t("fees.parentPayBankHint")}
              </Text>
              <Text variant="base" selectable>
                {options.bankNote}
              </Text>
            </Card>
          ) : null}

          <Text variant="xs" tone="subtle">
            {t("fees.parentPayeeNote", { school: child.schoolName })}
          </Text>

          <History child={child} />
        </>
      ) : null}
    </Screen>
  );
}

/** A started online payment: the phone asks after it every few seconds until the receipt is there, it failed, or a minute has passed. */
function OnlineWatch({ flow, onDone, onClose }: { flow: Extract<Flow, { kind: "online" }>; onDone: () => void; onClose: () => void }) {
  const t = useT();
  const { locale } = useLocale();
  // Set from the poll's own clock (outside render): after a minute the phone stops asking and says the receipt will come.
  const [timedOut, setTimedOut] = useState(false);
  const status = useQuery({
    queryKey: ["family", "fees", "payment", flow.paymentId],
    queryFn: async () => familyPaymentStatusSchema.parse(unwrap(await api().get(`/api/v1/fees/family/payments/${flow.paymentId}`))),
    staleTime: 0,
    gcTime: 0,
    refetchInterval: (q) => {
      if (q.state.data && SETTLED.has(q.state.data.status)) return false;
      if (Date.now() - flow.startedAt > POLL.maxMs) {
        setTimedOut(true);
        return false;
      }
      return POLL.intervalMs;
    },
  });
  const s = status.data;
  const settled = Boolean(s && SETTLED.has(s.status));
  // The parent's refetch, once: it invalidates the family query, which re-renders this card.
  const told = useRef(false);
  useEffect(() => {
    if (s?.status === "PAID" && !told.current) {
      told.current = true;
      onDone();
    }
  }, [s?.status, onDone]);
  return (
    <Card title={t("fees.onlineTitle")}>
      {s?.status === "PAID" ? (
        <Note tone="ok">
          <Text variant="sm" bold tone="ok" accessibilityLiveRegion="polite">
            {t("fees.onlineDone", { serial: s.serial ?? "" })}
          </Text>
          {s.receiptId ? <Button variant="ghost" label={`${t("fees.receiptOpen")} · ${t("fees.phoneOpensWeb")}`} onPress={() => openWeb(receiptPath(s.receiptId!))} /> : null}
        </Note>
      ) : s && settled ? (
        <Note tone="danger">
          <Text variant="sm" bold tone="danger" accessibilityLiveRegion="polite">
            {s.failedReason ?? t("fees.onlineCancelled")}
          </Text>
        </Note>
      ) : timedOut ? (
        <Note tone="warn">
          <Text variant="sm" tone="warn" accessibilityLiveRegion="polite">
            {t("fees.onlineNotYet")}
          </Text>
        </Note>
      ) : (
        <Text variant="sm" tone="muted" accessibilityLiveRegion="polite">
          {s ? t("fees.onlineChecking") : t("fees.onlineOpening")}
          {s ? ` · ${money(s.amountPaise, locale)}` : ""}
        </Text>
      )}
      {flow.devbox && !settled ? (
        <Note tone="accent">
          <Text variant="xs" tone="accent">
            {t("fees.onlineDevbox")}
          </Text>
        </Note>
      ) : null}
      {status.isError ? <Failed message={status.error.message} onRetry={() => void status.refetch()} /> : null}
      <Button label={settled || timedOut ? t("common.back") : t("common.cancel")} variant="secondary" onPress={onClose} />
    </Card>
  );
}

/** Pay to the school's UPI id: open the app, then bring the UTR back for the office to confirm. */
function UpiFlow({ flow, onNoApp, onClaimed, onClose }: { flow: Extract<Flow, { kind: "upi" }>; onNoApp: () => void; onClaimed: () => void; onClose: () => void }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const [utr, setUtr] = useState("");
  const [error, setError] = useState<string | null>(null);
  const start = flow.start;
  const claim = useMutation({
    mutationFn: async () => {
      const result = await api().post("/api/v1/fees/family/upi/claim", { paymentId: start.paymentId, utr: utr.trim() });
      if (!result.ok) throw new Error(errorText(result, t("common.somethingWrong")));
      return result.data;
    },
    onSuccess: onClaimed,
    onError: (e) => setError(e.message),
  });
  const clean = utr.trim();
  const utrOk = /^[A-Za-z0-9]{12,22}$/.test(clean);
  return (
    <Card title={t("fees.upiFlowTitle")}>
      <Text variant="sm" tone="muted">
        {t("fees.upiFlowIntro")}
      </Text>
      <Row title={t("fees.upiPayTo")} caption={start.payeeVpa} right={<Text variant="sm" bold>{start.payeeName}</Text>} />
      <Row title={t("fees.upiAmount")} right={<Text variant="base" bold>{money(start.amountPaise, locale)}</Text>} />
      <Row title={t("fees.upiReference")} right={<Text variant="sm" selectable>{start.reference}</Text>} />
      {flow.noApp ? (
        <Note tone="warn">
          <Text variant="sm" tone="warn" accessibilityLiveRegion="polite">
            {t("fees.phoneUpiNoApp")}
          </Text>
          <Text variant="base" bold selectable>
            {start.payeeVpa}
          </Text>
        </Note>
      ) : null}
      <Button label={t("fees.upiOpen")} onPress={() => Linking.openURL(start.link).catch(onNoApp)} />
      <View style={{ gap: th.space[2], borderTopWidth: 1, borderTopColor: th.border, paddingTop: th.space[3] }}>
        <Field label={t("fees.upiEnterUtr")} value={utr} onChangeText={setUtr} autoCapitalize="characters" autoCorrect={false} maxLength={22} error={clean && !utrOk ? t("fees.refuseUtr") : error} />
        <Button label={t("fees.upiClaim")} disabled={!utrOk} busy={claim.isPending} onPress={() => claim.mutate()} />
        <Button label={t("common.cancel")} variant="ghost" disabled={claim.isPending} onPress={onClose} />
      </View>
    </Card>
  );
}

function History({ child }: { child: Child }) {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const rows = [...child.payments].sort((a, b) => ((a.paidAt ?? a.createdAt) < (b.paidAt ?? b.createdAt) ? 1 : -1));
  return (
    <Card title={t("fees.parentHistory")}>
      {rows.length === 0 ? (
        <Empty title={t("fees.parentNoHistory")} action={<Button label={t("nav.messages")} variant="secondary" onPress={() => router.push("/(app)/messages" as never)} />} />
      ) : (
        rows.map((p) => {
          const status = p.status === "CLAIMED" ? t("fees.parentWaiting") : p.status === "FAILED" ? `${t("fees.parentFailed")}${p.failedReason ? ` · ${p.failedReason}` : ""}` : payStatusLabel(t, p.status);
          const when = formatInstant(p.paidAt ?? p.createdAt, locale, { day: "numeric", month: "short", year: "numeric" });
          const receipt = p.receiptId && p.serial ? t("fees.parentReceipt", { serial: p.serial }) : null;
          const caption = [when, status, receipt, p.receiptId ? t("fees.phoneOpensWeb") : null].filter(Boolean).join(" · ");
          return (
            <Row
              key={p.id}
              title={`${money(p.amountPaise, locale)} · ${methodLabel(t, p.method)}`}
              caption={caption}
              right={<Pill label={payStatusLabel(t, p.status)} tone={PAY_TONE[p.status] ?? "muted"} />}
              onPress={p.receiptId ? () => openWeb(receiptPath(p.receiptId!)) : undefined}
            />
          );
        })
      )}
    </Card>
  );
}
