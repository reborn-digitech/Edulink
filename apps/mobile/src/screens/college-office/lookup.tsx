import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { accountsLookupSchema, noDuesSchema, studentLedgerSchema } from "@edulink/contracts";
import { formatPaise } from "@edulink/i18n";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { usePrivateScreen } from "@/lib/private-screen";
import { Pill } from "../family/shared";

/**
 * THE COUNTER QUESTION ON THE PHONE (5 Oct 2026, the campaign's ACCOUNTS
 * recommendation: "a read-only ledger look-up by PRN"). The desk types the
 * start of a PRN or college code, or part of a name (GET /api/v1/accounts/lookup),
 * picks the student, and reads the year's ledger net of the scholarship
 * (GET /api/v1/accounts/ledger/{id}) and the exam form's no-dues, desk by
 * desk (GET /api/v1/accounts/no-dues/{id}?event=EXAM_FORM). Nothing is
 * written here; receipts, concessions and clearances stay on the web.
 */
const DESK_KEY: Record<string, TranslationKey> = { ACCOUNTS: "collegeOffice.deskACCOUNTS", LIBRARY: "collegeOffice.deskLIBRARY", HOSTEL: "collegeOffice.deskHOSTEL", LAB: "collegeOffice.deskLAB" };

export function AccountsLookupScreen() {
  // No screenshots while it is up (A3-S-12, audit of 5 Oct 2026): the accounts desk's look-up: a student's ledger and no-dues.
  usePrivateScreen();
  const t = useT();
  const { locale } = useLocale();
  const [typed, setTyped] = useState("");
  const [q, setQ] = useState("");
  const [chosen, setChosen] = useState<string | null>(null);
  const money = (paise: number) => formatPaise(paise, locale);
  const found = useQuery({ queryKey: ["accounts", "lookup", q], enabled: q.length >= 2, queryFn: async () => accountsLookupSchema.parse(unwrap(await api().get(`/api/v1/accounts/lookup?q=${encodeURIComponent(q)}`))) });
  const ledger = useQuery({ queryKey: ["accounts", "ledger", chosen], enabled: Boolean(chosen), queryFn: async () => studentLedgerSchema.parse(unwrap(await api().get(`/api/v1/accounts/ledger/${chosen}`))) });
  const noDues = useQuery({ queryKey: ["accounts", "no-dues", chosen], enabled: Boolean(chosen), queryFn: async () => noDuesSchema.parse(unwrap(await api().get(`/api/v1/accounts/no-dues/${chosen}?event=EXAM_FORM`))) });
  const search = () => {
    setChosen(null);
    setQ(typed.trim());
  };
  const l = ledger.data;
  return (
    <Screen title={t("collegeDesks.lookupTitle")} description={t("collegeDesks.lookupIntro")}>
      <Field label={t("collegeDesks.lookupField")} value={typed} onChangeText={setTyped} onSubmitEditing={search} returnKeyType="search" autoCapitalize="characters" autoCorrect={false} maxLength={60} />
      <Button label={t("collegeDesks.lookupButton")} disabled={typed.trim().length < 2} onPress={search} />
      {found.isFetching && !found.data ? <Loading /> : null}
      {found.isError ? <Failed message={found.error.message} onRetry={() => void found.refetch()} /> : null}
      {found.data && found.data.items.length === 0 ? <Empty icon="users" title={t("collegeDesks.lookupNone", { q })} body={t("collegeDesks.lookupNoneBody")} action={<Button label={t("collegeDesks.lookupAgain")} variant="secondary" onPress={() => setTyped("")} />} /> : null}
      {found.data && found.data.items.length > 0 ? (
        <Card>
          {found.data.items.map((s) => (
            <Row
              key={s.studentMembershipId}
              title={s.name}
              caption={[s.prn ? `${t("collegeOffice.prn")} ${s.prn}` : null, s.studentCode, s.programme ? `${s.programme}${s.yearOfStudy ? ` · ${s.yearOfStudy}` : ""}` : null].filter(Boolean).join(" · ")}
              right={chosen === s.studentMembershipId ? <Pill label={t("collegeDesks.lookupShown")} tone="accent" /> : undefined}
              onPress={() => setChosen(s.studentMembershipId)}
            />
          ))}
        </Card>
      ) : null}
      {chosen && (ledger.isPending || noDues.isPending) ? <Loading /> : null}
      {ledger.isError ? <Failed message={ledger.error.message} onRetry={() => void ledger.refetch()} /> : null}
      {l ? (
        <Card title={t("collegeOffice.ledgerOf", { name: l.student.name, year: l.year?.name ?? "—" })}>
          <Row title={t("collegeOffice.colDemand")} right={<Text>{money(l.totals.demandPaise)}</Text>} />
          <Row title={t("collegeOffice.colScholarship")} right={<Text>{money(l.totals.scholarshipReceivablePaise)}</Text>} />
          <Row title={t("collegeOffice.colPaid")} right={<Text>{money(l.totals.paidPaise)}</Text>} />
          <Row title={t("collegeOffice.colNetDue")} right={<Text bold tone={l.totals.netDuePaise > 0 ? "warn" : "fg"}>{money(l.totals.netDuePaise)}</Text>} />
          {l.terms.map((x) => (
            <Row key={x.demandId} title={x.label} caption={`${t("collegeOffice.colDemand")} ${money(x.demandPaise)} · ${t("collegeOffice.colPaid")} ${money(x.paidPaise)}${x.lateFeePaise > 0 ? ` · ${t("collegeOffice.colLateFee")} ${money(x.lateFeePaise)}` : ""}`} right={<Text bold>{money(x.netDuePaise)}</Text>} />
          ))}
        </Card>
      ) : null}
      {noDues.isError ? <Failed message={noDues.error.message} onRetry={() => void noDues.refetch()} /> : null}
      {noDues.data ? (
        <Card title={`${t("collegeOffice.navNoDues")} · ${t("collegeOffice.eventEXAM_FORM")}`}>
          {noDues.data.lines.map((line) => (
            <Row
              key={line.desk}
              title={t(DESK_KEY[line.desk] ?? "collegeOffice.deskACCOUNTS")}
              caption={[line.owedPaise > 0 ? `${t("collegeOffice.colOwed")} ${money(line.owedPaise)}` : null, line.cleared && line.clearedByName ? t("collegeOffice.clearedBy", { name: line.clearedByName }) : null].filter(Boolean).join(" · ") || undefined}
              right={<Pill label={line.cleared ? t("collegeOffice.cleared") : t("collegeOffice.notCleared")} tone={line.cleared ? "ok" : "warn"} />}
            />
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}
