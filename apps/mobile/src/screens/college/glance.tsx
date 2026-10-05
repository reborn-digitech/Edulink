import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { isCollegeKind, principalCollegeSchema, type PrincipalCollegeGlance } from "@edulink/contracts";
import { formatPaise, type TranslationKey } from "@edulink/i18n";
import { Card, Failed, Loading, Row, Screen, Stat, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { openWeb } from "@/screens/family/shared";

/**
 * The college at a glance and what waits for the head's word (campaign
 * 2026-10-04, G-4): the web's /principal/college as a card on the head's
 * phone home and a screen in the registrar's More, read from
 * GET /api/v1/principal/college — the same function as the web page, so the
 * two never disagree. The decisions are made on the web, on each module's
 * own page; a row opens it there and says so.
 */
const APPROVAL_KEY: Record<PrincipalCollegeGlance["approvals"][number]["key"], TranslationKey> = {
  leave: "collegeHub.approvalLeave",
  condonation: "collegeHub.approvalCondonation",
  concession: "collegeHub.approvalConcession",
  grace: "collegeHub.approvalGrace",
  lateRegistration: "collegeHub.approvalLate",
  signoff: "collegeHub.approvalSignoff",
  payroll: "collegeHub.approvalPayroll",
  refundException: "collegeDesks.approvalRefund",
  expulsion: "collegeDesks.approvalExpulsion",
};

/** True at a college whose ACADEMICS is on: the door's module, and the web's "is a college". */
export function useIsCollege(): boolean {
  const session = useSession();
  if (session.status !== "signed-in") return false;
  return isCollegeKind(session.me.institutionKind) && (session.me.modules ?? []).includes("ACADEMICS");
}

function useGlance(enabled = true) {
  return useQuery({
    queryKey: ["principal", "college"],
    enabled,
    queryFn: async () => principalCollegeSchema.parse(unwrap(await api().get("/api/v1/principal/college"))),
  });
}

/** The two cards: the approvals waiting, then the numbers. */
export function CollegeGlance({ d }: { d: PrincipalCollegeGlance }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const waiting = d.approvals.filter((a) => a.count > 0);
  const money = (paise: number) => formatPaise(paise, locale);
  return (
    <>
      <Card title={t("collegeHub.approvalsTitle")}>
        {waiting.length === 0 ? <Text tone="muted">{t("collegeHub.approvalsNone")}</Text> : null}
        {waiting.map((a) => (
          <Row
            key={a.key}
            title={t(APPROVAL_KEY[a.key], { count: a.count })}
            caption={t("mobile.openOnWeb")}
            right={
              <Text variant="lg" bold tone="warn">
                {a.count}
              </Text>
            }
            onPress={() => openWeb(a.href)}
          />
        ))}
      </Card>
      <Card title={t("collegeHub.glanceTitle", { date: d.today })}>
        <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
          {d.faculty ? <Stat label={t("collegeHub.facultyPresent")} value={d.faculty.closed ? "—" : t("collegeHub.ofTotal", { n: d.faculty.present, total: d.faculty.total })} tone="accent" /> : null}
          {d.fees ? <Stat label={t("collegeHub.feesCollected", { year: d.fees.year ?? "—" })} value={money(d.fees.collectedPaise)} tone={d.fees.outstandingPaise > 0 ? "warn" : "ok"} /> : null}
          {d.grievances ? <Stat label={t("collegeHub.grievances")} value={d.grievances.open} tone={d.grievances.overdue > 0 ? "danger" : "fg"} /> : null}
          {d.incidentsOpen !== null ? <Stat label={t("collegeHub.incidents")} value={d.incidentsOpen} /> : null}
          {d.hostel ? <Stat label={t("collegeHub.hostel")} value={`${d.hostel.occupancyPercent} %`} /> : null}
          {d.predictor && d.predictor.cgpa !== null ? <Stat label={t("collegeHub.predictor")} value={`${d.predictor.cgpa.toFixed(2)} · ${d.predictor.grade ?? "—"}`} tone="accent" /> : null}
        </View>
        {/* Each figure's detail, named, under the tiles. */}
        {d.faculty ? <Text variant="sm" tone="muted">{`${t("collegeHub.facultyPresent")}: ${d.faculty.closed ? t("collegeHub.closedToday") : t("collegeHub.facultyHint", { leave: d.faculty.onLeave, absent: d.faculty.absent, unmarked: d.faculty.unmarked })}`}</Text> : null}
        {d.fees ? <Text variant="sm" tone="muted">{`${t("collegeHub.feesReceived")}: ${t("collegeHub.feesHint", { demand: money(d.fees.demandPaise), outstanding: money(d.fees.outstandingPaise), defaulters: d.fees.defaulters })}`}</Text> : null}
        {d.grievances ? <Text variant="sm" tone="muted">{`${t("collegeHub.grievances")}: ${t("collegeHub.grievancesHint", { overdue: d.grievances.overdue })}`}</Text> : null}
        {d.predictor ? <Text variant="sm" tone="muted">{`${t("collegeHub.predictor")}: ${d.predictor.nextGrade && d.predictor.distance !== null ? t("collegeHub.nextBand", { grade: d.predictor.nextGrade, distance: d.predictor.distance.toFixed(2) }) : t("collegeHub.notAScore")}`}</Text> : null}
      </Card>
      {d.lectures.length ? (
        <Card title={t("collegeHub.lecturesTitle")}>
          {d.lectures.every((l) => l.lectures === 0) ? <Text tone="muted">{t("collegeHub.lecturesNone")}</Text> : null}
          {d.lectures
            .filter((l) => l.lectures > 0)
            .map((l) => (
              <Row key={l.departmentId} title={l.name} caption={`${t("collegeHub.lecturesMarked")} ${l.marked} / ${l.lectures}${l.presentPercent === null ? "" : ` · ${l.presentPercent} %`}`} />
            ))}
        </Card>
      ) : null}
    </>
  );
}

/** On the head's home at a college: the card above the school overview. */
export function CollegeGlanceCard() {
  const college = useIsCollege();
  const q = useGlance(college);
  if (!college) return null;
  if (q.isPending) return <Loading />;
  if (q.isError) return <Failed message={q.error.message} onRetry={() => void q.refetch()} />;
  return <CollegeGlance d={q.data} />;
}

/** The registrar's (and the head's) screen from More. */
export function CollegeGlanceScreen() {
  const t = useT();
  const q = useGlance();
  const d = q.data;
  return (
    <Screen
      title={t("collegeHub.title")}
      description={d ? [d.school.name, d.school.affiliatingUniversity, d.term ? d.term.name : t("collegeHub.noTerm")].filter(Boolean).join(" · ") : undefined}
      refreshing={q.isRefetching}
      onRefresh={() => void q.refetch()}
    >
      {q.isPending ? <Loading /> : null}
      {q.isError ? <Failed message={q.error.message} onRetry={() => void q.refetch()} /> : null}
      {d ? <CollegeGlance d={d} /> : null}
    </Screen>
  );
}
