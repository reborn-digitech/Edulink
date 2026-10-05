import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { collegeFilingsSchema, iqacOverviewSchema, type CollegeFilingKind } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Stat, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useSession } from "@/lib/session";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { CollegeRoleHome } from "@/screens/college/role-home";

/**
 * The IQAC coordinator's home on the phone (the IQAC module, 4 Oct 2026), the
 * web's /iqac at a glance: the cycle's predicted CGPA and band, the distance
 * to the next, the ten cheapest metrics, the open surveys and grievances, and
 * the regulators' calendar — with the sentence that the platform does not
 * score for NAAC. The predictor's detail, the filings and the registers are
 * on the web. While the college has IQAC off, the foundation's home says so.
 *
 * The filings' states (5 Oct 2026, the campaign's IQAC phone recommendation):
 * each filing generated, its year and where it stands — a draft, with the
 * principal, signed off, returned or filed — read from GET /api/v1/iqac/filings.
 * Generating, sending and marking filed stay on the web's /iqac/documents.
 */
export function IqacHome() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const session = useSession();
  const me = session.status === "signed-in" ? session.me : null;
  const on = (me?.modules ?? []).includes("IQAC");
  const query = useQuery({ queryKey: ["iqac", "overview"], enabled: on, queryFn: async () => iqacOverviewSchema.parse(unwrap(await api().get("/api/v1/iqac/overview"))) });
  const filings = useQuery({ queryKey: ["iqac", "filings"], enabled: on, queryFn: async () => collegeFilingsSchema.parse(unwrap(await api().get("/api/v1/iqac/filings"))) });
  if (!on) return <CollegeRoleHome role="IQAC" />;
  const o = query.data;
  return (
    <Screen title={t("iqac.title")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Text variant="sm" tone="muted">
        {t("iqac.notAScore")}
      </Text>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {o ? (
        <>
          {o.cycle ? (
            <Card title={t("iqac.cycleTitle")}>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[3] }}>
                <Stat label={t("iqac.cgpaLabel")} value={o.cycle.cgpa?.toFixed(2) ?? "—"} />
                <Stat label={t("iqac.gradeLabel")} value={o.cycle.grade ?? "—"} />
              </View>
              <Text variant="sm" tone="muted">
                {o.nextBand ? t("iqac.nextBandLine", { distance: o.nextBand.distance.toFixed(2), grade: o.nextBand.grade, min: o.nextBand.min.toFixed(2) }) : t("iqac.topBand")}
              </Text>
            </Card>
          ) : (
            <Empty icon="medal" title={t("iqac.noCycleTitle")} body={t("iqac.noCycleBody")} action={<Button label={t("nav.bulletin")} variant="secondary" onPress={() => router.push("/(app)/bulletin" as never)} />} />
          )}
          {o.cheapest.length ? (
            <Card title={t("iqac.cheapestTitle")}>
              {o.cheapest.map((m) => (
                <Row key={m.code} title={`${m.code} ${m.text}`} caption={t("iqac.cheapestRow", { gain: m.gainPerUnit.toFixed(4), unit: m.unit })} />
              ))}
            </Card>
          ) : null}
          <Card title={t("insightsPhone.title")}>
            <Row title={t("insightsPhone.insightsButton")} onPress={() => router.push("/(app)/iqac-insights" as never)} />
            <Row title={t("insightsPhone.scenariosButton")} onPress={() => router.push("/(app)/iqac-scenarios" as never)} />
          </Card>
          <Card>
            <Row title={t("iqac.navSurveys")} caption={String(o.counts.openSurveys)} />
            <Row title={t("iqac.navGrievances")} caption={`${o.counts.openGrievances}${o.counts.overdueGrievances ? ` · ${t("iqac.overdueBadge")}` : ""}`} />
          </Card>
          <Card title={t("iqac.navDocuments")}>
            {filings.isError ? <Failed message={filings.error.message} onRetry={() => void filings.refetch()} /> : null}
            {filings.data && filings.data.items.length === 0 ? (
              <Text variant="sm" tone="muted">
                {t("iqac.noFilings")}
              </Text>
            ) : null}
            {filings.data?.items.slice(0, 12).map((f) => (
              <Row key={f.id} title={`${filingKindLabel(f.kind, t)} · ${f.year}-${String((f.year + 1) % 100).padStart(2, "0")}`} caption={t(FILING_STATUS_KEY[f.status])} />
            ))}
          </Card>
          <Card title={t("iqac.calendarTitle")}>
            {o.calendar.map((c) => (
              <Row key={c.code} title={c.label} caption={`${t("iqac.calendarDue", { from: c.from, to: c.to })}${c.filedThisYear ? ` · ${t("iqac.calendarFiled")}` : ""}`} />
            ))}
            <Text variant="xs" tone="muted">
              {t("iqac.calendarCheck")}
            </Text>
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

/** Where a filing stands, in the web's words (iqac/documents). */
const FILING_STATUS_KEY: Record<"DRAFT" | "AWAITING_SIGNOFF" | "SIGNED_OFF" | "RETURNED" | "FILED", TranslationKey> = {
  DRAFT: "iqac.filingStatus.DRAFT",
  AWAITING_SIGNOFF: "iqac.filingStatus.AWAITING_SIGNOFF",
  SIGNED_OFF: "iqac.filingStatus.SIGNED_OFF",
  RETURNED: "iqac.filingStatus.RETURNED",
  FILED: "iqac.filingStatus.FILED",
};

/** The filings the phone has words for; a kind added since (a council's return) reads as its code until it has them. */
const FILING_KIND_KEY: Record<CollegeFilingKind, TranslationKey> = {
  SSR: "iqac.filingKind.SSR",
  AQAR: "iqac.filingKind.AQAR",
  IIQA: "iqac.filingKind.IIQA",
  NIRF: "iqac.filingKind.NIRF",
  AISHE: "iqac.filingKind.AISHE",
  AICTE_DISCLOSURE: "iqac.filingKind.AICTE_DISCLOSURE",
  AFFILIATION_RETURN: "iqac.filingKind.AFFILIATION_RETURN",
  // The councils' returns (5 Oct 2026): pharmacy, law, education and an engineering department's NBA report.
  PCI_INSPECTION: "iqac.filingKind.PCI_INSPECTION",
  BCI_RETURN: "iqac.filingKind.BCI_RETURN",
  NCTE_RETURN: "iqac.filingKind.NCTE_RETURN",
  NBA_SAR: "iqac.filingKind.NBA_SAR",
};

export function filingKindLabel(kind: CollegeFilingKind, t: (key: TranslationKey) => string): string {
  const key = FILING_KIND_KEY[kind] as TranslationKey | undefined;
  return key ? t(key) : kind.replace(/_/g, " ");
}
