import { Fragment, useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { companyListSchema, companyViewSchema, isCin, isGstin, type CompanyView } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useRole } from "@/lib/session";
import { Notice } from "../staff/shared";
import { Pill } from "../family/shared";
import { ModuleOffScreen, OfflineDecisionNote, useModuleOn } from "@/screens/shared/desk";

/**
 * The companies the college works with, on the phone (the parity batch,
 * 10 Oct 2026, R-4), the web's /placement/companies: each with its GSTIN or
 * CIN and what the format check says of it (the contracts' own check, the
 * same the server runs — a GSTIN's check character, a CIN's shape; never a
 * look-up), its sectors, whether the cell has checked it, its first visit and
 * its drives. The TPO's word that a company is checked goes through the same
 * idempotent door as the web (POST .../companies/{id}/verify); adding a
 * company stays on the web. A checked company no recruiter works on yet takes
 * an invitation to its first recruiter by address (TA-090, POST
 * .../companies/{id}/invite-recruiter), which only the cell that checked it
 * may send; the answer is the same whether or not the address is a recruiter's.
 */
export function TpoCompaniesScreen() {
  const t = useT();
  const qc = useQueryClient();
  const role = useRole();
  const on = useModuleOn("PLACEMENT");
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const query = useQuery({ queryKey: ["placement", "companies"], enabled: on, queryFn: async () => companyListSchema.parse(unwrap(await api().get("/api/v1/placement/companies"))) });
  const verify = useMutation({
    mutationFn: async (c: CompanyView) => companyViewSchema.parse(unwrap(await api().post(`/api/v1/placement/companies/${c.id}/verify`, {}))),
    onSuccess: (c) => {
      setNotice({ tone: "ok", text: t("deskParity.companyChecked", { name: c.name }) });
      void qc.invalidateQueries({ queryKey: ["placement"] });
    },
    onError: (e: Error) => setNotice({ tone: "danger", text: e.message }),
  });
  const [emails, setEmails] = useState<Record<string, string>>({});
  const invite = useMutation({
    mutationFn: async (input: { c: CompanyView; email: string }) => companyViewSchema.parse(unwrap(await api().post(`/api/v1/placement/companies/${input.c.id}/invite-recruiter`, { email: input.email.trim() }))),
    onSuccess: (c) => {
      setNotice({ tone: "ok", text: t("placement.colleagueInvited") });
      setEmails((all) => ({ ...all, [c.id]: "" }));
      void qc.invalidateQueries({ queryKey: ["placement"] });
    },
    onError: (e: Error) => setNotice({ tone: "danger", text: e.message }),
  });
  if (!on) return <ModuleOffScreen title={t("placement.tabCompanies")} module="PLACEMENT" />;
  const companies = query.data?.companies ?? [];
  return (
    <Screen title={t("placement.tabCompanies")} description={t("deskParity.companiesIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {query.data && companies.length === 0 ? <Empty icon="handshake" title={t("deskParity.companiesNone")} body={t("deskParity.companiesNoneBody")} action={<Button label={t("common.retry")} variant="secondary" onPress={() => void query.refetch()} />} /> : null}
      {companies.length > 0 ? (
        <Card>
          {companies.map((c) => {
            const check = identifierCheck(c.identifier);
            const email = emails[c.id] ?? "";
            return (
              <Fragment key={c.id}>
                <Row
                  title={c.name}
                  caption={[`${c.identifier} · ${t(check.key)}`, c.sectors.map((s) => t(`placement.sector${s}` as TranslationKey)).join(", "), c.firstVisitYear ? `${t("placement.colFirstVisit")} ${c.firstVisitYear}` : null, `${t("placement.colDrives")} ${c.drives}`, t("deskParity.companyRecruiters", { count: c.recruiters })].filter(Boolean).join(" · ")}
                  right={
                    c.verifiedAt ? (
                      <Pill label={t("placement.colVerified")} tone="ok" />
                    ) : role === "TPO" ? (
                      <Button label={t("deskParity.companyMarkChecked")} accessibilityLabel={`${t("deskParity.companyMarkChecked")}: ${c.name}`} variant="secondary" disabled={verify.isPending} onPress={() => verify.mutate(c)} />
                    ) : (
                      <Pill label={t("deskParity.companyUnchecked")} tone="warn" />
                    )
                  }
                />
                {role === "TPO" && c.verifiedAt && c.recruiters === 0 ? (
                  <View>
                    <Field label={t("placement.fieldColleagueEmail")} hint={t("placement.inviteRecruiterHint")} keyboardType="email-address" autoCapitalize="none" autoComplete="off" value={email} onChangeText={(v) => setEmails((all) => ({ ...all, [c.id]: v }))} />
                    <Button label={t("placement.inviteRecruiter")} accessibilityLabel={`${t("placement.inviteRecruiter")}: ${c.name}`} variant="secondary" disabled={invite.isPending || email.trim() === ""} onPress={() => invite.mutate({ c, email })} />
                  </View>
                ) : null}
              </Fragment>
            );
          })}
          <Text variant="xs" tone="muted">
            {t("placement.fieldIdentifierHint")}
          </Text>
          <OfflineDecisionNote />
        </Card>
      ) : null}
    </Screen>
  );
}

/** What the format check says of a registration number: a GSTIN whose check character holds, a CIN of the right shape, or neither. */
export function identifierCheck(identifier: string): { key: TranslationKey; ok: boolean } {
  if (isGstin(identifier)) return { key: "deskParity.identifierGstin", ok: true };
  if (isCin(identifier)) return { key: "deskParity.identifierCin", ok: true };
  return { key: "deskParity.identifierBad", ok: false };
}
