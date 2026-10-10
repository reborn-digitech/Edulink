import { useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { inventoryRequestSchema, inventorySetupSchema, staffAdvanceSchema, staffAdvancesSchema, type InventoryRequestView, type StaffAdvanceView } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Row, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Chips, Notice } from "./shared";
import { OfflineDecisionNote, money, paiseOfTyped } from "@/screens/shared/desk";

/**
 * The office's and the accounts desk's two approval queues on the phone (the
 * parity batch, 10 Oct 2026, R-4): a member of staff's ask for an advance
 * against salary (GET /admin/payroll/advances; answered RECORD with its
 * instalment or DECLINE with why, POST .../advances/decide) and an ask to
 * the stores (the asks on the inventory summary; FULFIL from a place, which
 * issues the item in one transaction, or DECLINE, POST
 * .../requests/decide). The same doors the web's pages post to; each answer
 * is a decision, sent live and never queued. The money of an advance is
 * handed over outside the app (decision 0003): the record says what is
 * taken back each month.
 */
export function AdvanceAsksCard() {
  const t = useT();
  const { locale } = useLocale();
  const th = useTheme();
  const qc = useQueryClient();
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const [open, setOpen] = useState<{ id: string; decision: "RECORD" | "DECLINE" } | null>(null);
  const [instalment, setInstalment] = useState("");
  const [note, setNote] = useState("");
  const query = useQuery({ queryKey: ["admin", "payroll", "advances"], queryFn: async () => staffAdvancesSchema.parse(unwrap(await api().get("/api/v1/admin/payroll/advances"))) });
  const decide = useMutation({
    mutationFn: async (a: StaffAdvanceView) => {
      if (!open) throw new Error(t("common.somethingWrong"));
      const monthly = open.decision === "RECORD" ? paiseOfTyped(instalment) : null;
      if (open.decision === "RECORD" && (monthly === null || monthly > a.amountPaise)) throw new Error(t("deskParity.checkInstalment"));
      return staffAdvanceSchema.parse(unwrap(await api().post("/api/v1/admin/payroll/advances/decide", { advanceId: a.id, decision: open.decision, ...(monthly !== null ? { amountPaise: a.amountPaise, monthlyRecoveryPaise: monthly } : {}), note: note.trim() })));
    },
    onSuccess: (a) => {
      setOpen(null);
      setInstalment("");
      setNote("");
      setNotice({ tone: "ok", text: t(a.status === "RECORDED" ? "payroll.advanceRecorded" : "payroll.advanceDeclined") });
      // The summary (screens/staff/payroll.tsx, PAYROLL_KEY) and the advances list share the prefix.
      void qc.invalidateQueries({ queryKey: ["admin", "payroll"] });
    },
    onError: (e: Error) => setNotice({ tone: "danger", text: e.message }),
  });
  const waiting = (query.data?.advances ?? []).filter((a) => a.status === "REQUESTED");
  return (
    <Card title={t("payroll.advancesTitle")}>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {query.data && waiting.length === 0 ? <Empty icon="receipt" title={t("deskParity.advancesNoneWaiting")} body={t("payroll.advancesNoneBody")} action={<Button label={t("common.retry")} variant="secondary" onPress={() => void query.refetch()} />} /> : null}
      {waiting.map((a) => (
        <View key={a.id} style={{ gap: th.space[2] }}>
          <Row title={a.name} caption={`${money(a.amountPaise, locale)} · ${a.reason}`} />
          {open?.id === a.id ? (
            <>
              {open.decision === "RECORD" ? <Field label={t("payroll.fieldInstalment")} value={instalment} onChangeText={setInstalment} keyboardType="number-pad" maxLength={10} /> : <Field label={t("payroll.declineWhy")} value={note} onChangeText={setNote} maxLength={300} />}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
                <Button label={t(open.decision === "RECORD" ? "payroll.recordAdvance" : "payroll.declineAdvance")} variant={open.decision === "RECORD" ? "primary" : "danger"} disabled={decide.isPending} busy={decide.isPending} onPress={() => decide.mutate(a)} />
                <Button label={t("common.cancel")} variant="secondary" disabled={decide.isPending} onPress={() => setOpen(null)} />
              </View>
              <OfflineDecisionNote />
            </>
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
              <Button label={t("payroll.recordAdvance")} accessibilityLabel={`${t("payroll.recordAdvance")}: ${a.name}`} variant="secondary" onPress={() => setOpen({ id: a.id, decision: "RECORD" })} />
              <Button label={t("payroll.declineAdvance")} accessibilityLabel={`${t("payroll.declineAdvance")}: ${a.name}`} variant="ghost" onPress={() => setOpen({ id: a.id, decision: "DECLINE" })} />
            </View>
          )}
        </View>
      ))}
    </Card>
  );
}

/** The asks to the stores, answered: given from a place, or declined with why. */
export function StoresAsksCard({ requests }: { requests: InventoryRequestView[] }) {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const [open, setOpen] = useState<{ id: string; decision: "FULFIL" | "DECLINE" } | null>(null);
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const setup = useQuery({ queryKey: ["admin", "inventory", "setup"], enabled: open?.decision === "FULFIL", queryFn: async () => inventorySetupSchema.parse(unwrap(await api().get("/api/v1/admin/inventory/setup"))) });
  const decide = useMutation({
    mutationFn: async (r: InventoryRequestView) => {
      if (!open) throw new Error(t("common.somethingWrong"));
      return inventoryRequestSchema.parse(unwrap(await api().post("/api/v1/admin/inventory/requests/decide", { requestId: r.id, decision: open.decision, location: open.decision === "FULFIL" ? location : "", note: note.trim() })));
    },
    onSuccess: (r) => {
      setOpen(null);
      setNote("");
      setNotice({ tone: "ok", text: t(r.status === "FULFILLED" ? "inventory.requestFulfilled" : "inventory.requestDeclined") });
      // The summary (screens/staff/inventory.tsx, INVENTORY_KEY) carries the asks.
      void qc.invalidateQueries({ queryKey: ["admin", "inventory"] });
    },
    onError: (e: Error) => setNotice({ tone: "danger", text: e.message }),
  });
  const waiting = requests.filter((r) => r.status === "PENDING");
  const places = setup.data?.locations ?? [];
  return (
    <Card title={t("inventory.asksTitle")}>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      {waiting.length === 0 ? (
        <Text variant="sm" tone="muted">
          {t("inventory.asksNone")}
        </Text>
      ) : null}
      {waiting.map((r) => (
        <View key={r.id} style={{ gap: th.space[2] }}>
          <Row title={r.requesterName} caption={[t("inventory.askLine", { quantity: r.quantity, item: r.itemName }), r.note].filter(Boolean).join(" · ")} />
          {open?.id === r.id ? (
            <>
              {open.decision === "FULFIL" ? (
                places.length > 0 ? (
                  <Chips label={t("deskParity.storesPlace")} value={location} options={places.map((p) => ({ value: p, label: p }))} onChange={setLocation} />
                ) : (
                  <Field label={t("deskParity.storesPlace")} value={location} onChangeText={setLocation} maxLength={60} />
                )
              ) : (
                <Field label={t("inventory.declineWhy")} value={note} onChangeText={setNote} maxLength={300} />
              )}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
                <Button label={t(open.decision === "FULFIL" ? "inventory.fulfil" : "inventory.decline")} variant={open.decision === "FULFIL" ? "primary" : "danger"} disabled={decide.isPending || (open.decision === "FULFIL" && r.itemCode !== null && !location)} busy={decide.isPending} onPress={() => decide.mutate(r)} />
                <Button label={t("common.cancel")} variant="secondary" disabled={decide.isPending} onPress={() => setOpen(null)} />
              </View>
              <OfflineDecisionNote />
            </>
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
              <Button label={t("inventory.fulfil")} accessibilityLabel={`${t("inventory.fulfil")}: ${r.requesterName}`} variant="secondary" onPress={() => setOpen({ id: r.id, decision: "FULFIL" })} />
              <Button label={t("inventory.decline")} accessibilityLabel={`${t("inventory.decline")}: ${r.requesterName}`} variant="ghost" onPress={() => setOpen({ id: r.id, decision: "DECLINE" })} />
            </View>
          )}
        </View>
      ))}
    </Card>
  );
}
