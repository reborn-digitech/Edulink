import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { applicationViewSchema, offerViewSchema, studentPlacementSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Stat, SwitchRow, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { bytesApi, shareBytes } from "@/lib/download";
import { useT } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { Confirm } from "../family/shared";
import { Notice } from "../staff/shared";
import { INTERNSHIP_STATUS_KEY, OUTCOME_KEY, applicationLabel, offerLine, packageRange, reasons } from "./words";
import { formatDateRange, formatDateTime } from "@/lib/dates";
import { featuresOf } from "@/lib/nav";

/**
 * A student's placement on the phone (the placement module, 4 Oct 2026), the
 * web's /student/placement: the record the cell reads, every drive with
 * whether they qualify and, when not, each reason; applying (the consent is
 * the act, asked for by a switch); rounds and offers to answer; internships;
 * the aptitude bank and the alumni mentors' free one-to-ones; the resume to
 * the share sheet.
 */
export function StudentPlacementScreen() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const session = useSession();
  const qc = useQueryClient();
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const [consent, setConsent] = useState<Record<string, boolean>>({});
  // Declining an offer and withdrawing from a drive are asked first (TA-350): neither can be undone from the phone.
  const [asking, setAsking] = useState<{ what: "decline"; offerId: string } | { what: "withdraw"; driveId: string } | null>(null);
  const on = session.status === "signed-in" && (session.me.modules ?? []).includes("PLACEMENT");
  const query = useQuery({ queryKey: ["placement", "mine"], enabled: on, queryFn: async () => studentPlacementSchema.parse(unwrap(await api().get("/api/v1/student/placement"))) });
  const refresh = () => void qc.invalidateQueries({ queryKey: ["placement"] });
  const fail = (e: Error) => setNotice({ tone: "danger", text: e.message });
  const apply = useMutation({
    mutationFn: async (driveId: string) => applicationViewSchema.parse(unwrap(await api().post(`/api/v1/student/placement/drives/${driveId}/apply`, { consent: true }))),
    // A minor's application waits for the guardian: say so, not that the company sees the record (A3-journeys-20).
    onSuccess: (app) => {
      setNotice({ tone: "ok", text: t(app.consentAt ? "placement.applied" : "placement.appliedAwaitsGuardian") });
      refresh();
    },
    onError: fail,
  });
  const withdraw = useMutation({
    mutationFn: async (driveId: string) => applicationViewSchema.parse(unwrap(await api().post(`/api/v1/student/placement/drives/${driveId}/withdraw`, {}))),
    onSuccess: () => {
      setAsking(null);
      setNotice({ tone: "ok", text: t("placement.withdrawn") });
      refresh();
    },
    onError: fail,
  });
  const answer = useMutation({
    mutationFn: async (v: { offerId: string; accept: boolean }) => offerViewSchema.parse(unwrap(await api().post(`/api/v1/student/placement/offers/${v.offerId}`, { accept: v.accept }))),
    onSuccess: (o) => {
      setAsking(null);
      setNotice({ tone: "ok", text: o.acceptedAt ? t("placement.offerAccepted") : t("placement.offerDeclined") });
      refresh();
    },
    onError: fail,
  });
  const resume = useMutation({
    mutationFn: async () => {
      const got = await bytesApi.get("/api/v1/student/placement/resume", t("common.somethingWrong"));
      if (!got.ok) throw new Error(got.error);
      const problem = await shareBytes(got, "resume.pdf", t("common.somethingWrong"));
      if (problem) throw new Error(problem);
    },
    onError: fail,
  });

  if (!on) {
    return (
      <Screen title={t("placement.studentTitle")}>
        <Empty icon="puzzle" title={t("modules.offTitle", { module: t("modules.placementName") })} body={t("modules.offBody", { module: t("modules.placementName") })} action={<Button label={t("nav.more")} variant="secondary" onPress={() => router.push("/(app)/more" as never)} />} />
      </Screen>
    );
  }
  const p = query.data;
  return (
    <Screen title={t("placement.studentTitle")} description={p ? t("placement.studentIntro", { batch: p.batchYear }) : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {p ? (
        <>
          <Card title={t("placement.recordTitle")} action={<Button label={t("placement.resume")} variant="ghost" busy={resume.isPending} onPress={() => resume.mutate()} />}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
              <Stat label={t("placement.colCgpa")} value={p.record.cgpa === null ? "—" : p.record.cgpa.toFixed(2)} />
              <Stat label={t("placement.colBacklogs")} value={p.record.liveBacklogs ?? "—"} tone={p.record.liveBacklogs ? "warn" : "fg"} />
              <Stat label={t("placement.colAttendance")} value={p.record.attendancePct === null ? "—" : `${Math.round(p.record.attendancePct)} %`} />
            </View>
            {p.profile.consentAt ? null : (
              <Text variant="sm" tone="muted">
                {t("placement.profileIntroFirst")}
              </Text>
            )}
          </Card>

          <Card title={t("placement.drivesForYou")}>
            {p.drives.length === 0 ? <Text tone="muted">{t("placement.noDrivesForYou")}</Text> : null}
            {p.drives.map(({ drive: d, eligible, failed, application: a }) => (
              <View key={d.id} style={{ gap: th.space[2], paddingVertical: th.space[2], borderTopWidth: 1, borderColor: th.border }}>
                <Text bold>{`${d.title} · ${d.companyName}`}</Text>
                <Text variant="sm" tone="muted">
                  {[packageRange(d.packageMinRupees, d.packageMaxRupees, t), d.hosted ? null : t("placement.hostedBy", { name: d.hostName })].filter(Boolean).join(" · ")}
                </Text>
                {a ? (
                  <>
                    <Text variant="sm">{applicationLabel(a, t)}</Text>
                    {a.results.map((r) => (
                      <Text key={r.round} variant="xs" tone="muted">
                        {`${r.round === 0 ? t("placement.roundShortlist") : t("placement.roundN", { round: r.round })} · ${t(OUTCOME_KEY[r.outcome]!)}${r.feedback ? ` · ${r.feedback}` : ""}`}
                      </Text>
                    ))}
                  </>
                ) : eligible ? (
                  <Text variant="sm" tone="ok">
                    {t("placement.eligibleYes")}
                  </Text>
                ) : (
                  reasons(failed, t).map((r) => (
                    <Text key={r} variant="xs" tone="muted">
                      {`• ${r}`}
                    </Text>
                  ))
                )}
                {(!a || a.status === "WITHDRAWN") && d.status === "OPEN" && eligible ? (
                  <>
                    <SwitchRow label={t("placement.consentLine", { company: d.companyName })} value={consent[d.id] ?? false} onChange={(next) => setConsent((c) => ({ ...c, [d.id]: next }))} />
                    <Button label={t("placement.apply")} disabled={!consent[d.id] || apply.isPending} onPress={() => apply.mutate(d.id)} />
                  </>
                ) : null}
                {a && a.status !== "WITHDRAWN" && !a.offer ? (
                  asking?.what === "withdraw" && asking.driveId === d.id ? (
                    <Confirm question={t("placement.confirmWithdraw", { company: d.companyName })} confirmLabel={t("placement.withdraw")} busy={withdraw.isPending} onConfirm={() => withdraw.mutate(d.id)} onCancel={() => setAsking(null)} />
                  ) : (
                    <Button label={t("placement.withdraw")} variant="ghost" disabled={withdraw.isPending} onPress={() => setAsking({ what: "withdraw", driveId: d.id })} />
                  )
                ) : null}
              </View>
            ))}
          </Card>

          <Card title={t("placement.offersTitle")}>
            {p.offers.length === 0 ? <Text tone="muted">{t("placement.noOffers")}</Text> : null}
            {p.offers.map((o) => (
              <View key={o.id} style={{ gap: th.space[2] }}>
                <Row title={o.driveTitle} caption={offerLine(o, t)} />
                {!o.acceptedAt && !o.declinedAt ? (
                  <View style={{ flexDirection: "row", gap: th.space[2] }}>
                    <Button label={t("placement.acceptOffer")} disabled={answer.isPending} onPress={() => answer.mutate({ offerId: o.id, accept: true })} />
                    <Button label={t("placement.declineOffer")} variant="secondary" disabled={answer.isPending} onPress={() => setAsking({ what: "decline", offerId: o.id })} />
                  </View>
                ) : null}
                {!o.acceptedAt && !o.declinedAt && asking?.what === "decline" && asking.offerId === o.id ? <Confirm question={t("placement.confirmDecline", { drive: o.driveTitle })} confirmLabel={t("placement.declineOffer")} busy={answer.isPending} onConfirm={() => answer.mutate({ offerId: o.id, accept: false })} onCancel={() => setAsking(null)} /> : null}
              </View>
            ))}
          </Card>

          <Card title={t("placement.myInternships")}>
            <Text variant="sm" tone="muted">
              {t("placement.myInternshipsIntro", { credits: p.internshipCredits })}
            </Text>
            {p.internships.map((i) => (
              <Row key={i.id} title={i.companyName} caption={`${formatDateRange(i.from, i.to)} · ${t(INTERNSHIP_STATUS_KEY[i.status]!)}${i.credits !== null ? ` · ${t("placement.creditsIs", { credits: i.credits })}` : ""}`} />
            ))}
          </Card>

          <Card title={t("placement.prepTitle")}>
            {p.prep.length === 0 ? <Text tone="muted">{t("placement.noPrep")}</Text> : null}
            {p.prep.map((x) => (
              <Row key={x.slug} title={x.name} caption={t("placement.prepLine", { count: x.questionCount, level: x.level })} onPress={() => router.push({ pathname: "/(app)/quiz", params: { mode: "topic", slug: x.slug } } as never)} />
            ))}
          </Card>

          <Card title={t("placement.mentorsTitle")}>
            <Text variant="sm" tone="muted">
              {t("placement.mentorsIntro")}
            </Text>
            {p.mentorSlots.length === 0 ? <Text tone="muted">{t("placement.noMentorSlots")}</Text> : null}
            {p.mentorSlots.map((s) => (
              <Row key={s.id} title={s.title} caption={`${s.mentorName}${s.batchYear ? ` (${s.batchYear})` : ""} · ${formatDateTime(s.startsAt)}`} />
            ))}
            {p.mentorSlots.length && featuresOf(session.status === "signed-in" ? session.me : null).some((f) => f === "EXPERT_SESSIONS" || f === "TEACHER_SESSIONS") ? <Button label={t("placement.bookInSessions")} variant="secondary" onPress={() => router.push("/(app)/sessions" as never)} /> : null}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
