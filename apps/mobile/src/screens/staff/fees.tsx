import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { feeBankImportPreviewSchema, feeBankImportResultSchema, feeOkSchema, feeOverviewSchema, feeSettingsSchema, feeStructuresSchema, type FeeBankImportLine, type FeeBankImportPreview } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Stat, SwitchRow, Text, useToast } from "@/components";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useRole, useSession } from "@/lib/session";
import { formatInstant } from "../family/shared";
import { methodLabel, money, payStatusLabel, receiptPath } from "../shared/fees";
import { formatDateKey, openWeb } from "./shared";

const STATEMENT_EXAMPLE = "Date,Description,Reference,Credit\n01/09/2026,NEFT STU-7K2M-9QDX RAVI,N245261234567890,12500.00\n02/09/2026,CLG CHQ 004512 STU-3PX8-Q2MN,004512,8000";

/**
 * The fees overview — the web's /admin/fees: what the school asked for this
 * year, what arrived, what is still to come, by grade and by age, with the
 * UPI claims waiting. The phone carries the reading, the dues, one pupil's
 * ledger with the counter, and the claims queue; the setup — heads,
 * structures, settings — and the exports stay on the web, each a row that
 * opens there signed in. The head reads; the office also collects.
 */
export function StaffFees() {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const role = useRole();
  const router = useRouter();
  // The accounts desk collects as the office does (the parity batch, 10 Oct 2026): every fee door names ACCOUNTS beside ADMIN.
  const office = role === "ADMIN" || role === "ACCOUNTS";
  const query = useQuery({
    queryKey: ["fees", "overview"],
    queryFn: async () => feeOverviewSchema.parse(unwrap(await api().get("/api/v1/fees/overview"))),
  });
  const d = query.data;
  const web = (path: string) => () => openWeb(path);
  return (
    <Screen title={t("fees.title")} description={d?.year ? `${d.year.name} · ${t("fees.overviewIntro")}` : t("fees.overviewIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d && !d.year ? <Empty title={t("fees.noYear")} action={<Button label={t("nav.calendar")} variant="secondary" onPress={() => router.push("/(app)/calendar" as never)} />} /> : null}
      {d?.year ? (
        <>
          <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
            <Stat label={t("fees.cardDemanded")} value={money(d.totals.demandedPaise, locale)} />
            <Stat label={t("fees.cardCollected")} value={money(d.totals.collectedPaise, locale)} tone="ok" />
            <Stat label={t("fees.cardOutstanding")} value={money(d.totals.outstandingPaise, locale)} tone={d.totals.outstandingPaise > 0 ? "warn" : "fg"} />
            <Stat label={t("fees.cardOverdue")} value={money(d.totals.overduePaise, locale)} tone={d.totals.overduePaise > 0 ? "danger" : "fg"} />
          </View>
          <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
            <Stat label={t("fees.cardPupilsOnPlan")} value={d.pupils.onPlan} />
            <Stat label={t("fees.cardPupilsWithout")} value={d.pupils.withoutPlan} tone={d.pupils.withoutPlan > 0 ? "warn" : "fg"} />
            <Stat label={t("fees.cardClaims")} value={d.claims.waiting} tone={d.claims.stale > 0 ? "danger" : d.claims.waiting > 0 ? "warn" : "fg"} />
          </View>
          {d.claims.stale > 0 ? (
            <Text variant="xs" tone="danger">
              {t("fees.phoneClaimsStale", { count: d.claims.stale })}
            </Text>
          ) : null}
          {d.structures === 0 ? (
            <Empty title={t("fees.noStructures")} body={t("fees.setUpStructuresHint")} action={<Button label={`${t("fees.linkStructures")} · ${t("fees.phoneOpensWeb")}`} variant="secondary" onPress={web("/admin/fees/structures")} />} />
          ) : null}

          <Card>
            <Row icon="users" title={t("fees.linkDues")} caption={t("fees.duesIntro")} onPress={() => router.push("/(app)/fees-dues" as never)} />
            {office ? <Row icon="checks" title={t("fees.linkClaims")} caption={t("fees.cardClaims")} right={<Text variant="lg" bold tone={d.claims.waiting > 0 ? "warn" : "muted"}>{String(d.claims.waiting)}</Text>} onPress={() => router.push("/(app)/fee-claims" as never)} /> : null}
          </Card>

          {d.byGrade.length > 0 ? (
            <Card title={t("fees.byGradeTitle")}>
              {d.byGrade.map((g) => (
                <Row
                  key={g.gradeLevel}
                  title={`${t("fees.structureGrade")} ${g.gradeLevel}`}
                  caption={[t("principal.pupilsMany", { count: g.pupils }), `${t("fees.cardCollected")} ${money(g.collectedPaise, locale)}`, g.overduePaise > 0 ? `${t("fees.cardOverdue")} ${money(g.overduePaise, locale)}` : null].filter(Boolean).join(" · ")}
                  right={
                    <Text variant="sm" bold tone={g.outstandingPaise > 0 ? "warn" : "ok"} style={{ fontVariant: ["tabular-nums"] }}>
                      {money(g.outstandingPaise, locale)}
                    </Text>
                  }
                />
              ))}
            </Card>
          ) : null}

          {d.totals.outstandingPaise > 0 ? (
            <Card title={t("fees.ageingTitle")}>
              <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
                <Stat label={t("fees.ageingCurrent")} value={money(d.ageing.current, locale)} />
                <Stat label={t("fees.ageing30")} value={money(d.ageing.d30, locale)} tone={d.ageing.d30 > 0 ? "warn" : "fg"} />
                <Stat label={t("fees.ageing90")} value={money(d.ageing.d90, locale)} tone={d.ageing.d90 > 0 ? "warn" : "fg"} />
                <Stat label={t("fees.ageing90plus")} value={money(d.ageing.d90plus, locale)} tone={d.ageing.d90plus > 0 ? "danger" : "fg"} />
              </View>
            </Card>
          ) : null}

          {d.methodsThisMonth.length > 0 ? (
            <Card title={t("fees.methodsTitle")}>
              {d.methodsThisMonth.map((m) => (
                <Row key={m.method} title={methodLabel(t, m.method)} caption={String(m.count)} right={<Text variant="sm" bold style={{ fontVariant: ["tabular-nums"] }}>{money(m.amountPaise, locale)}</Text>} />
              ))}
            </Card>
          ) : null}

          <Card title={t("fees.recentTitle")}>
            {d.recent.length === 0 ? (
              <Empty title={t("fees.parentNoHistory")} action={<Button label={t("fees.linkDues")} variant="secondary" onPress={() => router.push("/(app)/fees-dues" as never)} />} />
            ) : (
              d.recent.map((p) => (
                <Row
                  key={p.paymentId}
                  title={`${p.pupilName} · ${money(p.amountPaise, locale)}`}
                  caption={[methodLabel(t, p.method), payStatusLabel(t, p.status), formatInstant(p.when, locale), p.serial, p.receiptId ? t("fees.phoneOpensWeb") : null].filter(Boolean).join(" · ")}
                  onPress={p.receiptId ? () => openWeb(receiptPath(p.receiptId!)) : undefined}
                />
              ))
            )}
          </Card>

          {office ? <BankImport /> : null}
          {office ? <OpenPlans /> : null}
          {office ? <PupilViewAge /> : null}

          <Card title={t("fees.setUpTitle")}>
            <Row icon="clipboard" title={t("fees.linkStructures")} caption={`${t("fees.setUpStructuresHint")} · ${t("fees.phoneOpensWeb")}`} onPress={web("/admin/fees/structures")} />
            <Row icon="fileText" title={t("fees.linkHeads")} caption={`${t("fees.setUpHeadsHint")} · ${t("fees.phoneOpensWeb")}`} onPress={web("/admin/fees/heads")} />
            {office ? (
              <>
                <Row icon="gear" title={t("fees.linkSettings")} caption={`${t("fees.setUpSettingsHint")} · ${t("fees.phoneOpensWeb")}`} onPress={web("/admin/fees/settings")} />
                <Row icon="share" title={t("fees.linkExportCollections")} caption={t("fees.phoneOpensWeb")} onPress={web("/admin/fees/export/collections")} />
                <Row icon="share" title={t("fees.linkExportOutstanding")} caption={t("fees.phoneOpensWeb")} onPress={web("/admin/fees/export/outstanding")} />
                <Row icon="arrowsClockwise" title={t("fees.linkCarryForward")} caption={t("fees.phoneOpensWeb")} onPress={web("/admin/fees/carry-forward")} />
              </>
            ) : null}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

/**
 * One switch per published plan: open to families, or the office's alone.
 * A guardian may then put their child on an open plan themselves (while the
 * child is on no plan and nothing is paid). Drafts and archived plans are
 * not listed: a draft's numbers may change and an archived one takes nobody.
 */
function OpenPlans() {
  const t = useT();
  const { locale } = useLocale();
  const qc = useQueryClient();
  const [notice, setNotice] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["fees", "structures"],
    queryFn: async () => feeStructuresSchema.parse(unwrap(await api().get("/api/v1/fees/structures"))),
  });
  const flip = useMutation({
    mutationFn: async (input: { id: string; open: boolean }) => {
      const result = await api().post(`/api/v1/fees/structures/${input.id}/self-enrol`, { open: input.open });
      if (!result.ok) throw new Error(errorText(result, t("common.somethingWrong")));
      return feeOkSchema.parse(result.data);
    },
    onSuccess: () => {
      setNotice(null);
      void qc.invalidateQueries({ queryKey: ["fees", "structures"] });
    },
    onError: (e) => setNotice(e.message),
  });
  if (!query.data) return null;
  const live = query.data.structures.filter((s) => s.publishedAt && !s.archivedAt);
  return (
    <Card title={t("fees.selfEnrolPhoneTitle")}>
      <Text variant="sm" tone="muted">
        {t("fees.selfEnrolHint")}
      </Text>
      {notice ? (
        <Text variant="sm" tone="danger" accessibilityLiveRegion="polite">
          {notice}
        </Text>
      ) : null}
      {live.length === 0 ? (
        <Text variant="sm" tone="muted">
          {t("fees.selfEnrolPhoneEmpty")}
        </Text>
      ) : (
        live.map((s) => (
          <SwitchRow
            key={s.id}
            label={s.name}
            hint={[s.gradeLevel ? `${t("fees.structureGrade")} ${s.gradeLevel}` : t("fees.structureAllGrades"), money(s.totalPaise, locale), s.selfEnrol ? t("fees.selfEnrolOn") : t("fees.selfEnrolOff")].join(" · ")}
            value={s.selfEnrol}
            disabled={flip.isPending}
            onChange={(next) => flip.mutate({ id: s.id, open: next })}
          />
        ))
      )}
    </Card>
  );
}

/**
 * From what age a pupil may read their own dues (never pay). The save sends
 * the age alone; the server leaves the other settings as they are.
 */
function PupilViewAge() {
  const t = useT();
  const qc = useQueryClient();
  const session = useSession();
  // The school's own copy (TA-156): after a switch of school the card no longer shows the first school's age.
  const schoolId = session.status === "signed-in" ? session.me.active.schoolId : null;
  // The box holds what was typed; until something is typed it shows the saved value, so no effect is needed to copy it in.
  const [typed, setTyped] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const query = useQuery({
    queryKey: ["fees", "settings", schoolId],
    queryFn: async () => feeSettingsSchema.parse(unwrap(await api().get("/api/v1/fees/settings"))),
  });
  const current = query.data?.pupilFeeViewAge;
  const saved = current === null || current === undefined ? "" : String(current);
  const age = typed ?? saved;
  const setAge = (next: string) => setTyped(next);
  const save = useMutation({
    mutationFn: async () => {
      const clean = age.trim();
      // The age alone (TA-156): the server leaves every setting not named as it is, so this card no longer sends back
      // a UPI id, payee, receipt prefix and bank note copied when the screen opened, perhaps at another school.
      const result = await api().post("/api/v1/fees/settings", { pupilFeeViewAge: clean === "" ? null : Number(clean) });
      if (!result.ok) throw new Error(errorText(result, t("common.somethingWrong")));
      return feeOkSchema.parse(result.data);
    },
    onSuccess: () => {
      setTyped(null);
      setNotice({ tone: "ok", text: t("fees.settingsSaved") });
      void qc.invalidateQueries({ queryKey: ["fees", "settings"] });
    },
    onError: (e) => setNotice({ tone: "danger", text: e.message }),
  });
  if (!query.data) return null;
  const clean = age.trim();
  const valid = clean === "" || (/^\d{1,2}$/.test(clean) && Number(clean) >= 5 && Number(clean) <= 25);
  const dirty = clean !== saved;
  return (
    <Card title={t("fees.pupilViewTitle")}>
      <Field label={t("fees.pupilViewAge")} value={age} onChangeText={setAge} keyboardType="number-pad" maxLength={2} hint={t("fees.pupilViewAgeHint")} error={valid ? null : t("fees.refusePupilViewAge")} />
      <Text variant="sm" tone="muted">
        {clean === "" ? t("fees.pupilViewOff") : t("fees.pupilViewFrom", { age: clean })}
      </Text>
      {notice ? (
        <Text variant="sm" bold tone={notice.tone} accessibilityLiveRegion="polite">
          {notice.text}
        </Text>
      ) : null}
      <Button label={t("common.save")} disabled={!valid || !dirty} busy={save.isPending} onPress={() => save.mutate()} />
    </Card>
  );
}

/**
 * The bank statement, pasted — the web's import card. The server matches
 * each credit to a pupil by its UTR, its cheque number or the student code
 * in the narration and says what it would do; the button then records the
 * matched lines through the counter and confirms the claims. Shalaghar records
 * that the money arrived; it never moves it.
 */
function BankImport() {
  const t = useT();
  const toast = useToast();
  const qc = useQueryClient();
  const { locale } = useLocale();
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<{ csv: string; data: FeeBankImportPreview } | null>(null);
  const [failed, setFailed] = useState<{ line: number; error: string }[]>([]);
  const check = useMutation({
    mutationFn: async (text: string) => ({ csv: text, data: feeBankImportPreviewSchema.parse(unwrap(await api().post("/api/v1/fees/bank-import/preview", { csv: text }))) }),
    onSuccess: (next) => {
      setFailed([]);
      setPreview(next);
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const commit = useMutation({
    mutationFn: async (text: string) => feeBankImportResultSchema.parse(unwrap(await api().post("/api/v1/fees/bank-import/commit", { csv: text }))),
    onSuccess: (r) => {
      toast.show(t("officeBulk.bankDone", { recorded: r.recorded, confirmed: r.confirmed, unmatched: r.unmatched }), r.recorded + r.confirmed > 0 ? "ok" : "info");
      setFailed(r.failed);
      setCsv("");
      setPreview(null);
      for (const queryKey of [["fees", "overview"], ["fees", "claims"], ["fees", "dues"]]) void qc.invalidateQueries({ queryKey });
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const fresh = preview && preview.csv === csv ? preview.data : null;
  const matched = fresh ? fresh.counts.new + fresh.counts.claim : 0;
  return (
    <Card title={t("officeBulk.bankTitle")}>
      <Text variant="xs" tone="subtle">
        {t("officeBulk.bankBody")}
      </Text>
      <Field label={t("officeBulk.bankLabel")} hint={t("officeBulk.bankColumns")} value={csv} onChangeText={setCsv} placeholder={STATEMENT_EXAMPLE} multiline autoCapitalize="none" autoCorrect={false} style={{ minHeight: 120, textAlignVertical: "top" }} />
      {failed.length > 0 ? (
        <View accessibilityLiveRegion="polite" style={{ gap: 2 }}>
          {failed.map((f) => (
            <Text key={f.line} variant="xs" tone="danger">
              {t("officeBulk.bankLineFailed", { line: f.line, error: f.error })}
            </Text>
          ))}
        </View>
      ) : null}
      {fresh ? (
        <View accessibilityLiveRegion="polite" style={{ gap: 2 }}>
          <Text variant="sm" bold>
            {[t("officeBulk.bankCountNew", { count: fresh.counts.new }), t("officeBulk.bankCountClaim", { count: fresh.counts.claim }), t("officeBulk.bankCountAlready", { count: fresh.counts.already }), t("officeBulk.bankCountUnmatched", { count: fresh.counts.unmatched })].join(" · ")}
          </Text>
          {fresh.lines.slice(0, 12).map((l) => (
            <Row key={l.line} title={`${t("invites.line", { line: l.line })} · ${l.amountPaise !== null ? money(l.amountPaise, locale) : "—"}${l.dateKey ? ` · ${formatDateKey(l.dateKey, locale, { day: "numeric", month: "short" })}` : ""}`} caption={`${outcomeLabel(t, l)}${l.reference ? ` · ${l.reference}` : ""}`} />
          ))}
          {fresh.lines.length > 12 ? (
            <Text variant="xs" tone="muted">
              {t("invites.andMore", { count: fresh.lines.length - 12 })}
            </Text>
          ) : null}
          {matched === 0 ? (
            <Text variant="xs" tone="muted">
              {t("officeBulk.bankNothingToRecord")}
            </Text>
          ) : null}
        </View>
      ) : null}
      {fresh && matched > 0 ? (
        <Button label={`${t("officeBulk.bankCommit")} (${matched})`} busy={commit.isPending} onPress={() => commit.mutate(csv)} />
      ) : fresh ? null : (
        <Button label={t("officeBulk.bankPreview")} disabled={!csv.trim()} busy={check.isPending} onPress={() => check.mutate(csv)} />
      )}
    </Card>
  );
}

/** What one statement line would do, in the office's words. */
function outcomeLabel(t: (key: TranslationKey, vars?: Record<string, string | number>) => string, l: FeeBankImportLine): string {
  switch (l.outcome) {
    case "new":
      return `${t("officeBulk.bankOutcomeNew", { name: l.pupilName ?? "" })}${l.method ? ` · ${methodLabel(t, l.method)}` : ""}`;
    case "claim":
      return t("officeBulk.bankOutcomeClaim", { name: l.pupilName ?? "" });
    case "already":
      return [t("officeBulk.bankOutcomeAlready"), l.pupilName].filter(Boolean).join(" · ");
    default:
      return [t("officeBulk.bankOutcomeUnmatched"), l.problemKey ? t(l.problemKey as TranslationKey) : null, l.pupilName].filter(Boolean).join(" · ");
  }
}
