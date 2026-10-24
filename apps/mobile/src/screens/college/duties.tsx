import { View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { antiRaggingRegisterSchema, type DutyCode, type SchoolModuleCode } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Stat, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { usePrivateScreen } from "@/lib/private-screen";
import { useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { formatDate } from "@/lib/dates";

/**
 * A COLLEGE TEACHER'S DUTIES ON THE PHONE (5 Oct 2026). /api/v1/me's `duties`
 * are the active membership's (a FACULTY's or HOD's); the More entries and
 * tabs carrying `duty` hide without one (lib/nav.ts), the card on the home
 * lists them, and each duty with a screen opens it. ANTI_RAGGING_SQUAD is the
 * model; the duties builder adds the rest to DUTY_SCREENS.
 */
export const DUTY_SCREENS: Partial<Record<DutyCode, { screen: string; module: SchoolModuleCode }>> = {
  ANTI_RAGGING_SQUAD: { screen: "/(app)/anti-ragging", module: "IQAC" },
  // The duties' desks (S2, 5 Oct 2026): screens/college/duty-desks.tsx. CLINICAL_COORDINATOR has none yet.
  LAB_INCHARGE: { screen: "/(app)/lab-desk", module: "ACADEMICS" },
  PRACTICE_TEACHING_COORDINATOR: { screen: "/(app)/teaching-practice", module: "ACADEMICS" },
  NSS_OFFICER: { screen: "/(app)/nss", module: "IQAC" },
  NCC_OFFICER: { screen: "/(app)/ncc", module: "IQAC" },
  RESEARCH_DEAN: { screen: "/(app)/research-desk", module: "IQAC" },
  EXAM_SQUAD: { screen: "/(app)/exam-squad", module: "EXAMS" },
  // The clinical desk (R-56, the clinical half; 10 Oct 2026): screens/college/clinical.tsx.
  CLINICAL_COORDINATOR: { screen: "/(app)/clinical-desk", module: "ACADEMICS" },
  // The studio desk (R-56, the studio half, 10 Oct 2026): the coordinator's own juries and studios are the faculty screen's.
  STUDIO_COORDINATOR: { screen: "/(app)/studios", module: "ACADEMICS" },
};

/** The card on a FACULTY's or HOD's home: one row per duty; nothing when they hold none. */
export function DutyCard() {
  const t = useT();
  const router = useRouter();
  const session = useSession();
  const me = session.status === "signed-in" ? session.me : null;
  const duties = me?.duties ?? [];
  if (duties.length === 0) return null;
  const modules = me?.modules ?? [];
  return (
    <Card title={t("duties.homeTitle")}>
      <Text variant="sm" tone="muted">
        {t("duties.homeBody")}
      </Text>
      {duties.map((duty) => {
        const page = DUTY_SCREENS[duty];
        const open = page && modules.includes(page.module);
        return (
          <Row
            key={duty}
            icon="shield"
            title={t(`duties.${duty}.name` as TranslationKey)}
            caption={open ? t(`duties.${duty}.what` as TranslationKey) : t(page ? "duties.moduleOff" : "duties.pageComing")}
            right={open ? <Button label={t("duties.open")} accessibilityLabel={t("qaInterface.openDuty", { name: t(`duties.${duty}.name` as TranslationKey) })} variant="secondary" onPress={() => router.push(page.screen as never)} /> : undefined}
          />
        );
      })}
    </Card>
  );
}

const STATUS_KEY: Record<string, TranslationKey> = {
  OPEN: "duties.antiRagging.statusOPEN",
  ACKNOWLEDGED: "duties.antiRagging.statusACKNOWLEDGED",
  RESOLVED: "duties.antiRagging.statusRESOLVED",
  ESCALATED: "duties.antiRagging.statusESCALATED",
};

/**
 * The anti-ragging register on the phone, the web's /duties/anti-ragging:
 * GET /api/v1/duties/anti-ragging, which the gate opens to a FACULTY or HOD
 * holding ANTI_RAGGING_SQUAD (and the office and the head). The squad's
 * rounds, the complaints by state and due day without their words, the
 * committee.
 */
export function AntiRaggingScreen() {
  // No screenshots while it is up (A3-S-12, audit of 5 Oct 2026): the anti-ragging register: complaints and the students named.
  usePrivateScreen();
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const session = useSession();
  const me = session.status === "signed-in" ? session.me : null;
  const holds = me?.active.role === "ADMIN" || me?.active.role === "PRINCIPAL" || (me?.duties ?? []).includes("ANTI_RAGGING_SQUAD");
  const on = (me?.modules ?? []).includes("IQAC");
  const register = useQuery({ queryKey: ["duties", "anti-ragging"], enabled: holds && on, queryFn: async () => antiRaggingRegisterSchema.parse(unwrap(await api().get("/api/v1/duties/anti-ragging"))) });
  const home = <Button label={t("nav.more")} variant="secondary" onPress={() => router.push("/(app)/more" as never)} />;
  if (!holds) {
    return (
      <Screen title={t("duties.antiRagging.title")}>
        <Empty icon="shield" title={t("duties.antiRagging.title")} body={t("duties.refuseNoDuty")} action={home} />
      </Screen>
    );
  }
  if (!on) {
    return (
      <Screen title={t("duties.antiRagging.title")}>
        <Empty icon="puzzle" title={t("duties.antiRagging.title")} body={t("duties.moduleOff")} action={home} />
      </Screen>
    );
  }
  const r = register.data;
  return (
    <Screen title={t("duties.antiRagging.title")} description={t("duties.antiRagging.intro")} refreshing={register.isRefetching} onRefresh={() => void register.refetch()}>
      {register.isPending ? <Loading /> : null}
      {register.isError ? <Failed message={register.error.message} onRetry={() => void register.refetch()} /> : null}
      {r ? (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
            <Stat label={t("duties.antiRagging.statRounds")} value={r.summary.rounds30} />
            <Stat label={t("duties.antiRagging.statFlagged")} value={r.summary.flagged30} tone={r.summary.flagged30 ? "warn" : "fg"} />
            <Stat label={t("duties.antiRagging.statOpen")} value={r.summary.open} tone={r.summary.open ? "warn" : "ok"} />
            <Stat label={t("duties.antiRagging.statOverdue")} value={r.summary.overdue} tone={r.summary.overdue ? "danger" : "ok"} />
          </View>
          <Card title={t("duties.antiRagging.roundsTitle")}>
            {!r.hostelOn ? <Text tone="muted">{t("duties.antiRagging.noHostel")}</Text> : null}
            {r.hostelOn && r.rounds.length === 0 ? <Text tone="muted">{t("duties.antiRagging.roundsNoneBody")}</Text> : null}
            {r.rounds.map((round) => (
              <Row key={round.id} title={`${round.hostelName} · ${formatDate(round.at)}`} caption={[round.members, round.flagged ? t("duties.antiRagging.flagged") : t("duties.antiRagging.nothingFound")].join(" · ")} />
            ))}
          </Card>
          <Card title={t("duties.antiRagging.complaintsTitle")}>
            {r.complaints.length === 0 ? <Text tone="muted">{t("duties.antiRagging.complaintsNoneBody")}</Text> : null}
            {r.complaints.map((c) => (
              <Row key={c.id} title={t("duties.antiRagging.complaintLine", { filed: c.filedOn, due: c.dueOn })} caption={[t(STATUS_KEY[c.status]!), c.overdue ? t("duties.antiRagging.overdue") : null].filter(Boolean).join(" · ")} />
            ))}
          </Card>
          <Card title={t("duties.antiRagging.committeeTitle")}>
            <Text variant="sm" tone="muted">
              {r.committee?.name ?? t("duties.antiRagging.committeeNone")}
            </Text>
            {(r.committee?.members ?? []).map((m) => (
              <Text key={m} variant="sm">
                {m}
              </Text>
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
