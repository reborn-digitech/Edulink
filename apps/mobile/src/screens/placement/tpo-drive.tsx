import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DRIVE_STATUSES, driveViewSchema, offerViewSchema, roundResultsResultSchema, type DriveApplicationView, type DriveView, type RoundOutcome } from "@edulink/contracts";
import { Button, Card, Failed, Field, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Notice } from "../staff/shared";
import { Confirm } from "../family/shared";
import { OfflineDecisionNote } from "../shared/desk";
import { DRIVE_STATUS_KEY, OUTCOME_KEY, applicationLabel, offerLine, packageRange } from "./words";

/**
 * ONE DRIVE ON THE TPO'S PHONE (5 Oct 2026, the campaign's TPO recommendation:
 * "the TPO is on campus with the recruiter"). The web's /placement/drives/[id]
 * at the size of a corridor: the eligible count, each applicant with where
 * they stand, and — for a drive the college hosts — the shortlist and each
 * round's outcome, one press a candidate, through the same door the web's
 * results table posts to (POST /api/v1/placement/drives/{id}/results), so the
 * rules are the library's: only a consented application, round n only for a
 * candidate through n − 1, each student told. Opening a drive, its rule, an
 * offer's letter and the season's table stay on the web.
 *
 * An offer (A3-journeys-18, risks batch 5 Oct 2026): the package for a candidate
 * still in a hosted drive, through POST /api/v1/placement/drives/{id}/offers. A
 * figure above one and a half times the drive's top package is answered 409
 * with the server's sentence under the package field (issues.packageRupees); the
 * TPO checks it and confirms, which posts again with `confirmedHigh: true`.
 */
export function TpoDriveScreen() {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const { driveId } = useLocalSearchParams<{ driveId?: string }>();
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const [offerFor, setOfferFor] = useState<DriveApplicationView | null>(null);
  const query = useQuery({ queryKey: ["placement", "drive", driveId], enabled: Boolean(driveId), queryFn: async () => driveViewSchema.parse(unwrap(await api().get(`/api/v1/placement/drives/${driveId}`))) });
  const record = useMutation({
    mutationFn: async (v: { round: number; studentMembershipId: string; outcome: RoundOutcome }) => roundResultsResultSchema.parse(unwrap(await api().post(`/api/v1/placement/drives/${driveId}/results`, { round: v.round, results: [{ studentMembershipId: v.studentMembershipId, outcome: v.outcome }] }))),
    onSuccess: (r) => {
      setNotice({ tone: "ok", text: t("placement.resultsSaved", { count: r.saved }) });
      void qc.invalidateQueries({ queryKey: ["placement"] });
    },
    onError: (e: Error) => setNotice({ tone: "danger", text: e.message }),
  });
  const d = query.data;
  /** The round a candidate is up for: the shortlist first, then the one after the last they passed; null when there is none left. */
  const nextRound = (a: DriveApplicationView): number | null => {
    if (!d || a.consentAt === null || a.status === "WITHDRAWN" || a.status === "REJECTED" || a.status === "SELECTED" || a.offer) return null;
    const passed = a.results.filter((r) => r.outcome === "PASSED").map((r) => r.round);
    const next = passed.length ? Math.max(...passed) + 1 : 0;
    return next <= d.rounds.length ? next : null;
  };
  const roundLabel = (n: number) => (n === 0 ? t("placement.roundShortlist") : t("placement.roundN", { round: n }));
  return (
    <Screen title={d?.title ?? t("placement.tabDrives")} description={d ? `${d.companyName} · ${packageRange(d.packageMinRupees, d.packageMaxRupees, t)} · ${t(DRIVE_STATUS_KEY[d.status]!)}` : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed error={query.error} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <Card>
            <Text>{t("placement.recruiterEligible", { count: d.eligibleCount })}</Text>
            <Text variant="sm" tone="muted">
              {t("placement.resultsIntro")}
            </Text>
          </Card>
          {/* Moving the drive on (the parity batch, 10 Oct 2026): the web's status step, for the host's cell alone. */}
          {d.hosted && d.canEdit && d.status !== "CLOSED" ? <MoveOnCard drive={d} onMoved={(text) => setNotice({ tone: "ok", text })} /> : null}
          <Card title={t("placement.applicantsTitle", { count: d.applications.length })}>
            {d.applications.length === 0 ? <Text tone="muted">{t("placement.noApplicants")}</Text> : null}
            {d.applications.map((a) => {
              const next = d.hosted ? nextRound(a) : null;
              const last = a.results.length ? a.results[a.results.length - 1]! : null;
              const caption = [applicationLabel(a, t), last ? `${roundLabel(last.round)}: ${t(OUTCOME_KEY[last.outcome]!)}` : null, a.consentAt === null ? t("placement.awaitingConsentTitle") : null, a.offer ? offerLine(a.offer, t) : null].filter(Boolean).join(" · ");
              return (
                <View key={a.id} style={{ gap: th.space[2], paddingVertical: th.space[2], borderTopWidth: 1, borderColor: th.border }}>
                  <Row title={a.studentName} caption={caption} />
                  {next !== null ? (
                    <View style={{ flexDirection: "row", gap: th.space[2], flexWrap: "wrap" }}>
                      <Button label={`${roundLabel(next)}: ${t("placement.outcomePASSED")}`} disabled={record.isPending} onPress={() => record.mutate({ round: next, studentMembershipId: a.studentMembershipId, outcome: "PASSED" })} />
                      <Button label={t("placement.outcomeREJECTED")} variant="secondary" disabled={record.isPending} onPress={() => record.mutate({ round: next, studentMembershipId: a.studentMembershipId, outcome: "REJECTED" })} />
                      <Button label={t("placement.outcomeABSENT")} variant="secondary" disabled={record.isPending} onPress={() => record.mutate({ round: next, studentMembershipId: a.studentMembershipId, outcome: "ABSENT" })} />
                    </View>
                  ) : null}
                  {d.hosted && offerable(a) ? <Button label={t("placement.offerTitle")} accessibilityLabel={`${t("placement.offerTitle")}: ${a.studentName}`} variant="ghost" onPress={() => setOfferFor(a)} /> : null}
                </View>
              );
            })}
          </Card>
          {d.hosted && offerFor && offerable(offerFor) ? (
            <OfferCard
              key={offerFor.id}
              driveId={d.id}
              candidate={offerFor}
              onSaved={(text) => {
                setOfferFor(null);
                setNotice({ tone: "ok", text });
              }}
            />
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

/**
 * The next step of a hosted drive (the parity batch, 10 Oct 2026, R-4): the
 * web's status step through POST /api/v1/placement/drives/{id} with the next
 * status alone. A status never goes back, so the step asks once before it is
 * sent; it is a decision, sent live and never queued (the note says so
 * offline). The rule is fixed once shortlisting starts and a closed drive
 * changes no more: both are the server's to refuse, in its own sentence.
 */
function MoveOnCard({ drive, onMoved }: { drive: DriveView; onMoved: (text: string) => void }) {
  const t = useT();
  const qc = useQueryClient();
  const [asked, setAsked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const next = DRIVE_STATUSES[DRIVE_STATUSES.indexOf(drive.status) + 1];
  const move = useMutation({
    mutationFn: async () => driveViewSchema.parse(unwrap(await api().post(`/api/v1/placement/drives/${drive.id}`, { status: next }))),
    onSuccess: (d) => {
      setAsked(false);
      setError(null);
      onMoved(t("deskParity.driveMoved", { status: t(DRIVE_STATUS_KEY[d.status]!) }));
      void qc.invalidateQueries({ queryKey: ["placement"] });
    },
    onError: (e: Error) => {
      setAsked(false);
      setError(e.message);
    },
  });
  if (!next) return null;
  const label = t("deskParity.driveMoveTo", { status: t(DRIVE_STATUS_KEY[next]!) });
  return (
    <Card title={t("deskParity.driveMoveTitle")}>
      <Text variant="sm" tone="muted">
        {t("deskParity.driveMoveBody")}
      </Text>
      {error ? (
        <Text variant="sm" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      {asked ? <Confirm question={t("deskParity.driveMoveConfirm", { status: t(DRIVE_STATUS_KEY[next]!) })} confirmLabel={label} busy={move.isPending} onConfirm={() => move.mutate()} onCancel={() => setAsked(false)} /> : <Button label={label} variant="secondary" onPress={() => setAsked(true)} />}
      <OfflineDecisionNote />
    </Card>
  );
}

/** A candidate still in the drive (the web's `live`) with no offer yet. */
const offerable = (a: DriveApplicationView) => a.status !== "WITHDRAWN" && a.status !== "REJECTED" && a.consentAt !== null && !a.offer;

/** Lakh a year as typed ("6.5") to whole rupees; null when it is not a figure. */
export function rupeesOfLakh(typed: string): number | null {
  const n = Number(typed.trim().replace(",", "."));
  return typed.trim() !== "" && Number.isFinite(n) && n >= 0 ? Math.round(n * 100_000) : null;
}

/** The answer the server gives a figure far above the drive's package: a 409 naming the package field. */
class HighOffer extends Error {}

function OfferCard({ driveId, candidate, onSaved }: { driveId: string; candidate: DriveApplicationView; onSaved: (text: string) => void }) {
  const t = useT();
  const qc = useQueryClient();
  const [lakh, setLakh] = useState("");
  const [high, setHigh] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: async (confirmedHigh: boolean) => {
      const packageRupees = rupeesOfLakh(lakh);
      if (packageRupees === null) throw new Error(t("placement.fieldPackageHint"));
      const r = await api().post(`/api/v1/placement/drives/${driveId}/offers`, { studentMembershipId: candidate.studentMembershipId, packageRupees, letterFileId: null, ...(confirmedHigh ? { confirmedHigh: true } : {}) });
      if (!r.ok && r.status === 409 && r.issues?.packageRupees) throw new HighOffer(r.issues.packageRupees);
      return offerViewSchema.parse(unwrap(r));
    },
    onSuccess: () => {
      onSaved(t("placement.offerRecorded", { name: candidate.studentName }));
      void qc.invalidateQueries({ queryKey: ["placement"] });
    },
    onError: (e: Error) => {
      if (e instanceof HighOffer) {
        setHigh(e.message);
        setError(null);
      } else {
        setHigh(null);
        setError(e.message);
      }
    },
  });
  return (
    <Card title={`${t("placement.offerTitle")}: ${candidate.studentName}`}>
      <Text variant="sm" tone="muted">
        {t("placement.offerIntro")}
      </Text>
      <Field
        label={t("placement.fieldPackage")}
        hint={t("placement.fieldPackageHint")}
        value={lakh}
        onChangeText={(next) => {
          setLakh(next);
          setHigh(null);
        }}
        keyboardType="decimal-pad"
        error={high ?? error}
      />
      {high ? (
        <Button label={t("phoneJoins.confirmHighOffer")} disabled={save.isPending} busy={save.isPending} onPress={() => save.mutate(true)} />
      ) : (
        <Button label={t("placement.recordOffer")} disabled={rupeesOfLakh(lakh) === null || save.isPending} busy={save.isPending} onPress={() => save.mutate(false)} />
      )}
    </Card>
  );
}
