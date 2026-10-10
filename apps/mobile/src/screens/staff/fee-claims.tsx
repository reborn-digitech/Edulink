import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { feeClaimConfirmedSchema, feeClaimsSchema, feeOkSchema } from "@edulink/contracts";
import type { Locale } from "@edulink/i18n";
import type { z } from "zod";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useRole } from "@/lib/session";
import { formatInstant, Pill } from "../family/shared";
import { money } from "../shared/fees";
import { must, Notice, openWeb } from "./shared";

type Claim = z.infer<typeof feeClaimsSchema>["claims"][number];

/**
 * The UPI claims queue — the web's /admin/fees/claims: payments families
 * say they made to the school's UPI id, each with the UTR they typed back.
 * The office checks the bank statement and confirms (a receipt is issued)
 * or rejects with a reason the family sees. Matching a pasted statement is
 * the web's. The office only: the API admits nobody else here.
 */
export function FeeClaims() {
  const t = useT();
  const { locale } = useLocale();
  const role = useRole();
  const router = useRouter();
  const qc = useQueryClient();
  const [notice, setNotice] = useState<{ text: string; tone: "ok" | "danger" } | null>(null);
  const office = role === "ADMIN" || role === "ACCOUNTS";
  const query = useQuery({
    queryKey: ["fees", "claims"],
    queryFn: async () => feeClaimsSchema.parse(unwrap(await api().get("/api/v1/fees/claims"))),
    enabled: office,
  });
  const done = (text: string) => {
    setNotice({ tone: "ok", text });
    void qc.invalidateQueries({ queryKey: ["fees"] });
  };
  const confirm = useMutation({
    mutationFn: async (paymentId: string) => feeClaimConfirmedSchema.parse(must(await api().post(`/api/v1/fees/claims/${paymentId}/confirm`, {}), t("common.somethingWrong"))),
    onSuccess: (r) => done(t("fees.claimConfirmed", { serial: r.serial })),
    onError: (e) => setNotice({ tone: "danger", text: e.message }),
  });
  const reject = useMutation({
    mutationFn: async (input: { paymentId: string; reason: string }) => feeOkSchema.parse(must(await api().post(`/api/v1/fees/claims/${input.paymentId}/reject`, { reason: input.reason }), t("common.somethingWrong"))),
    onSuccess: () => done(t("fees.claimRejected")),
    onError: (e) => setNotice({ tone: "danger", text: e.message }),
  });
  const d = query.data;
  const back = <Button label={t("fees.title")} variant="secondary" onPress={() => router.push("/(app)/fees" as never)} />;
  return (
    <Screen title={t("fees.claimsTitle")} description={t("fees.claimsIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      {role === null ? <Loading /> : null}
      {role !== null && !office ? <Empty title={t("fees.refuseOffice")} action={back} /> : null}
      {office && query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          {d.waitingForUtr > 0 ? (
            <Text variant="sm" tone="muted">
              {t("fees.claimsWaitingUtr", { count: d.waitingForUtr })}
            </Text>
          ) : null}
          {d.claims.length === 0 ? (
            <Empty title={t("fees.claimsEmpty")} action={back} />
          ) : (
            d.claims.map((c) => (
              <ClaimCard
                key={c.paymentId}
                claim={c}
                staleAfterDays={d.staleAfterDays}
                locale={locale}
                busy={(confirm.isPending && confirm.variables === c.paymentId) || (reject.isPending && reject.variables?.paymentId === c.paymentId)}
                onConfirm={() => confirm.mutate(c.paymentId)}
                onReject={(reason) => reject.mutate({ paymentId: c.paymentId, reason })}
              />
            ))
          )}
          <Card>
            <Row icon="fileText" title={t("fees.matchTitle")} caption={`${t("fees.matchIntro")} · ${t("fees.phoneOpensWeb")}`} onPress={() => openWeb("/admin/fees/claims")} />
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

function ClaimCard({ claim, staleAfterDays, locale, busy, onConfirm, onReject }: { claim: Claim; staleAfterDays: number; locale: Locale; busy: boolean; onConfirm: () => void; onReject: (reason: string) => void }) {
  const t = useT();
  const th = useTheme();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const clean = reason.trim();
  const when = claim.claimedAt ?? claim.createdAt;
  return (
    <Card
      title={claim.pupilName}
      action={
        <Text variant="lg" bold style={{ fontVariant: ["tabular-nums"] }}>
          {money(claim.amountPaise, locale)}
        </Text>
      }
    >
      <Text variant="sm" tone="muted">
        {[claim.className, `${t("fees.claimColWhen")} ${formatInstant(when, locale)}`, claim.payer ? t("fees.paidBy", { name: claim.payer }) : null].filter(Boolean).join(" · ")}
      </Text>
      <Row title={t("fees.claimColUtr")} right={<Text variant="base" bold selectable>{claim.utr ?? "—"}</Text>} />
      <Row title={t("fees.claimColRef")} right={<Text variant="sm" selectable>{claim.reference ?? "—"}</Text>} />
      {claim.stale ? <Pill label={t("fees.claimStale", { days: staleAfterDays })} tone="danger" /> : null}
      {rejecting ? <Field label={t("fees.claimRejectWhy")} value={reason} onChangeText={setReason} multiline maxLength={300} /> : null}
      <View style={{ flexDirection: "row", gap: th.space[2], flexWrap: "wrap" }}>
        <Button label={t("fees.claimConfirm")} busy={busy} onPress={onConfirm} style={{ flexGrow: 1 }} />
        {rejecting ? (
          <Button label={t("fees.claimReject")} variant="danger" busy={busy} disabled={clean.length < 3} onPress={() => onReject(clean)} style={{ flexGrow: 1 }} />
        ) : (
          <Button label={t("fees.claimReject")} variant="secondary" disabled={busy} onPress={() => setRejecting(true)} style={{ flexGrow: 1 }} />
        )}
      </View>
    </Card>
  );
}
