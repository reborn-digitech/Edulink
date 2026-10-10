import { useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { collegeFilingsSchema, type CollegeFilingKind } from "@edulink/contracts";
import type { z } from "zod";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Notice, formatDateKey } from "../staff/shared";
import { Pill } from "../family/shared";
import { ModuleOffScreen, OfflineDecisionNote, useModuleOn } from "@/screens/shared/desk";
import { filingKindLabel } from "./home";

type Filing = z.infer<typeof collegeFilingsSchema>["items"][number];
const STATUS_TONE: Record<Filing["status"], "muted" | "warn" | "ok" | "danger" | "accent"> = { DRAFT: "muted", AWAITING_SIGNOFF: "warn", SIGNED_OFF: "ok", RETURNED: "danger", FILED: "accent" };

/**
 * The filings on the phone (the parity batch, 10 Oct 2026, R-4), the web's
 * /iqac/documents as cards: each filing generated, its year, format,
 * fingerprint and where it stands — a draft, with the principal, signed off,
 * returned with the principal's note, filed — and its figures. The principal
 * signs off a NAAC document or returns it with a note here, through the
 * web's door (POST .../filings/{id}/signoff), a decision sent live and
 * never queued. Generating, sending for sign-off, the file itself and
 * marking filed stay on the web.
 */
export function FilingsDeskScreen() {
  const t = useT();
  const on = useModuleOn("IQAC");
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const query = useQuery({ queryKey: ["iqac", "filings"], enabled: on, queryFn: async () => collegeFilingsSchema.parse(unwrap(await api().get("/api/v1/iqac/filings"))) });
  if (!on) return <ModuleOffScreen title={t("iqac.navDocuments")} module="IQAC" />;
  const d = query.data;
  const items = [...(d?.items ?? [])].sort((a, b) => (a.status === "AWAITING_SIGNOFF" ? -1 : b.status === "AWAITING_SIGNOFF" ? 1 : b.year - a.year));
  return (
    <Screen title={t("iqac.navDocuments")} description={t("deskParity.filingsIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d && items.length === 0 ? <Empty icon="clipboard" title={t("iqac.noFilings")} body={t("deskParity.filingsNoneBody")} action={<Button label={t("common.retry")} variant="secondary" onPress={() => void query.refetch()} />} /> : null}
      {items.map((f) => (
        <FilingCard key={f.id} filing={f} canSignOff={Boolean(d?.canSignOff)} onDone={setNotice} />
      ))}
    </Screen>
  );
}

function FilingCard({ filing, canSignOff, onDone }: { filing: Filing; canSignOff: boolean; onDone: (n: { tone: "ok" | "danger"; text: string }) => void }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const qc = useQueryClient();
  const [decision, setDecision] = useState<"SIGN" | "RETURN" | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const signoff = useMutation({
    mutationFn: async () => unwrap(await api().post(`/api/v1/iqac/filings/${filing.id}/signoff`, { decision, note: note.trim() })),
    onSuccess: () => {
      setError(null);
      onDone({ tone: "ok", text: t(decision === "SIGN" ? "deskParity.filingSigned" : "deskParity.filingReturned") });
      setDecision(null);
      setNote("");
      void qc.invalidateQueries({ queryKey: ["iqac"] });
    },
    onError: (e: Error) => setError(e.message),
  });
  const year = `${filing.year}-${String((filing.year + 1) % 100).padStart(2, "0")}`;
  const figures = Object.entries(filing.figures).slice(0, 8);
  return (
    <Card title={`${filingKindLabel(filing.kind as CollegeFilingKind, t)} · ${year}`} action={<Pill label={t(`iqac.filingStatus.${filing.status}` as TranslationKey)} tone={STATUS_TONE[filing.status]} />}>
      <Text variant="sm" tone="muted">
        {[filing.format, t("deskParity.filingGenerated", { date: formatDateKey(filing.generatedAt.slice(0, 10), locale) }), filing.signedOffAt ? t("iqac.signedOn", { date: formatDateKey(filing.signedOffAt.slice(0, 10), locale) }) : null, t("deskParity.filingHash", { hash: filing.hash.slice(0, 12) })].filter(Boolean).join(" · ")}
      </Text>
      {filing.principalNote ? <Text variant="sm">{t("deskParity.filingPrincipalNote", { note: filing.principalNote })}</Text> : null}
      {figures.map(([key, value]) => (
        <Row key={key} title={key} right={<Text>{String(value)}</Text>} />
      ))}
      {error ? (
        <Text variant="sm" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      {canSignOff && filing.status === "AWAITING_SIGNOFF" ? (
        <>
          {decision === null ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
              <Button label={t("deskParity.filingSign")} accessibilityLabel={`${t("deskParity.filingSign")}: ${filingKindLabel(filing.kind as CollegeFilingKind, t)} ${year}`} onPress={() => setDecision("SIGN")} />
              <Button label={t("deskParity.filingReturn")} accessibilityLabel={`${t("deskParity.filingReturn")}: ${filingKindLabel(filing.kind as CollegeFilingKind, t)} ${year}`} variant="secondary" onPress={() => setDecision("RETURN")} />
            </View>
          ) : (
            <>
              <Field label={t("collegeDesks.decisionNote")} value={note} onChangeText={setNote} maxLength={4000} multiline />
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
                <Button label={t(decision === "SIGN" ? "deskParity.filingSign" : "deskParity.filingReturn")} variant={decision === "SIGN" ? "primary" : "danger"} disabled={signoff.isPending || (decision === "RETURN" && note.trim().length < 2)} busy={signoff.isPending} onPress={() => signoff.mutate()} />
                <Button label={t("common.cancel")} variant="secondary" disabled={signoff.isPending} onPress={() => setDecision(null)} />
              </View>
              <OfflineDecisionNote />
            </>
          )}
        </>
      ) : null}
    </Card>
  );
}
