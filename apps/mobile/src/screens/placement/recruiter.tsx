import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { recruiterCompanySchema, recruiterDriveSchema, recruiterDrivesSchema, recruiterMeSchema, roundResultsResultSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Notice } from "../staff/shared";
import { DRIVE_STATUS_KEY, applicationLabel, packageRange } from "./words";

/**
 * The recruiter on the phone (the placement module, 4 Oct 2026), the web's
 * /recruiter: first the company, by GSTIN or CIN; then the live drives of
 * that company with the eligible count and the consented applicants — and,
 * on a drive, the shortlist and a round's outcomes, one press a candidate.
 * Requirements, offers with their letters and the downloads are the web's.
 */
export function RecruiterPlacementHome() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [contact, setContact] = useState("");
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const me = useQuery({ queryKey: ["recruiter", "me"], queryFn: async () => recruiterMeSchema.parse(unwrap(await api().get("/api/v1/recruiter/me"))) });
  const drives = useQuery({ queryKey: ["recruiter", "drives"], queryFn: async () => recruiterDrivesSchema.parse(unwrap(await api().get("/api/v1/recruiter/drives"))) });
  const register = useMutation({
    mutationFn: async () => recruiterCompanySchema.parse(unwrap(await api().post("/api/v1/recruiter/company", { name: name || me.data?.companyName || "", identifier, sectors: ["OTHER"], pointOfContact: contact }))),
    onSuccess: () => {
      setNotice({ tone: "ok", text: t("placement.companyRegistered") });
      void qc.invalidateQueries({ queryKey: ["recruiter"] });
    },
    onError: (e: Error) => setNotice({ tone: "danger", text: e.message }),
  });
  const d = drives.data;
  return (
    <Screen title={me.data ? t("recruiter.homeTitle", { company: d?.company?.name ?? me.data.companyName }) : t("role.recruiter")} description={t("recruiter.homeIntro")} refreshing={drives.isRefetching} onRefresh={() => void drives.refetch()}>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      {me.data && !me.data.emailVerified ? (
        <Card>
          <Text variant="sm" tone="muted">
            {t("recruiter.verifyEmail")}
          </Text>
        </Card>
      ) : null}
      {drives.isPending ? <Loading /> : null}
      {drives.isError ? <Failed message={drives.error.message} onRetry={() => void drives.refetch()} /> : null}
      {d && !d.company ? (
        <Card title={t("placement.registerCompany")}>
          <Text variant="sm" tone="muted">
            {t("placement.registerCompanyIntro")}
          </Text>
          <View style={{ gap: th.space[2] }}>
            <Field label={t("placement.fieldCompanyName")} value={name} placeholder={me.data?.companyName} onChangeText={setName} />
            <Field label={t("placement.fieldIdentifier")} hint={t("placement.fieldIdentifierHint")} autoCapitalize="characters" value={identifier} onChangeText={setIdentifier} />
            <Field label={t("placement.fieldPointOfContact")} value={contact} onChangeText={setContact} />
            <Button label={t("placement.registerCompany")} busy={register.isPending} disabled={!identifier.trim() || !contact.trim()} onPress={() => register.mutate()} />
          </View>
        </Card>
      ) : null}
      {d?.company ? (
        <Card title={t("placement.yourDrives")}>
          {d.drives.length === 0 ? <Empty icon="handshake" title={t("recruiter.noDrivesTitle")} body={t("recruiter.noDrivesBody")} action={<Button label={t("nav.account")} variant="secondary" onPress={() => router.push("/(app)/account" as never)} />} /> : null}
          {d.drives.map((x) => (
            <Row
              key={x.id}
              title={x.title}
              caption={`${x.collegeName} · ${t(DRIVE_STATUS_KEY[x.status]!)} · ${t("placement.recruiterCounts", { eligible: x.eligibleCount, applicants: x.applicantCount })}`}
              onPress={() => router.push({ pathname: "/(app)/recruiter-drive", params: { driveId: x.id } } as never)}
            />
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}

export function RecruiterDriveScreen() {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const { driveId } = useLocalSearchParams<{ driveId?: string }>();
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const query = useQuery({ queryKey: ["recruiter", "drive", driveId], enabled: Boolean(driveId), queryFn: async () => recruiterDriveSchema.parse(unwrap(await api().get(`/api/v1/recruiter/drives/${driveId}`))) });
  const record = useMutation({
    mutationFn: async (v: { round: number; studentMembershipId: string; outcome: "PASSED" | "REJECTED" }) => roundResultsResultSchema.parse(unwrap(await api().post(`/api/v1/placement/drives/${driveId}/results`, { round: v.round, results: [{ studentMembershipId: v.studentMembershipId, outcome: v.outcome }] }))),
    onSuccess: (r) => {
      setNotice({ tone: "ok", text: t("placement.resultsSaved", { count: r.saved }) });
      void qc.invalidateQueries({ queryKey: ["recruiter"] });
    },
    onError: (e: Error) => setNotice({ tone: "danger", text: e.message }),
  });
  const d = query.data;
  return (
    <Screen title={d?.title ?? t("role.recruiter")} description={d ? `${d.collegeName} · ${packageRange(d.packageMinRupees, d.packageMaxRupees, t)}` : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <Card>
            <Text>{t("placement.recruiterEligible", { count: d.eligibleCount })}</Text>
            <Text variant="sm" tone="muted">
              {t("placement.recruiterConsentNote")}
            </Text>
          </Card>
          <Card title={t("placement.applicantsTitle", { count: d.applicants.length })}>
            {d.applicants.length === 0 ? <Text tone="muted">{t("placement.noApplicants")}</Text> : null}
            {d.applicants.map((a) => {
              const passed = a.results.filter((r) => r.outcome === "PASSED").map((r) => r.round);
              const next = passed.length ? Math.max(...passed) + 1 : 0;
              const open = a.status !== "WITHDRAWN" && a.status !== "REJECTED" && a.status !== "SELECTED" && next <= d.rounds.length;
              return (
                <View key={a.id} style={{ gap: th.space[2], paddingVertical: th.space[2], borderTopWidth: 1, borderColor: th.border }}>
                  <Row title={a.studentName} caption={`${applicationLabel(a, t)} · ${t("placement.colCgpa")} ${a.record.cgpa === null ? "—" : a.record.cgpa.toFixed(2)} · ${a.skills.slice(0, 3).join(", ")}`} />
                  {open ? (
                    <View style={{ flexDirection: "row", gap: th.space[2], flexWrap: "wrap" }}>
                      <Button label={`${next === 0 ? t("placement.roundShortlist") : t("placement.roundN", { round: next })}: ${t("placement.outcomePASSED")}`} disabled={record.isPending} onPress={() => record.mutate({ round: next, studentMembershipId: a.studentMembershipId, outcome: "PASSED" })} />
                      <Button label={t("placement.outcomeREJECTED")} variant="secondary" disabled={record.isPending} onPress={() => record.mutate({ round: next, studentMembershipId: a.studentMembershipId, outcome: "REJECTED" })} />
                    </View>
                  ) : null}
                </View>
              );
            })}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
