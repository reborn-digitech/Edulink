import { View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { placementSummarySchema, presetUnion, streamRecordsSummarySchema, type HomeTileCode, type NotBuiltCode, type SchoolModuleCode, type StreamCode, type StreamRecordsSummary } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Card, Row, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";

/** Each stream's name, as the web's streamLabel says it. */
export const STREAM_KEY: Record<StreamCode, TranslationKey> = {
  ARTS: "streams.ARTS.name",
  SCIENCE: "streams.SCIENCE.name",
  COMMERCE: "streams.COMMERCE.name",
  MANAGEMENT: "streams.MANAGEMENT.name",
  ENGINEERING: "streams.ENGINEERING.name",
  PHARMACY: "streams.PHARMACY.name",
  LAW: "streams.LAW.name",
  EDUCATION: "streams.EDUCATION.name",
  HEALTH_SCIENCES: "streams.HEALTH_SCIENCES.name",
  ARCHITECTURE: "streams.ARCHITECTURE.name",
  AGRICULTURE: "streams.AGRICULTURE.name",
  VOCATIONAL: "streams.VOCATIONAL.name",
};

/** A tile's words, the module its page needs, and whether that page is built (the web's HOME_TILE_META). */
const TILE: Record<HomeTileCode, { key: TranslationKey; module?: SchoolModuleCode; built: boolean }> = {
  people: { key: "streams.tile.people", built: true },
  academics: { key: "streams.tile.academics", module: "ACADEMICS", built: true },
  exams: { key: "streams.tile.exams", module: "EXAMS", built: true },
  admissions: { key: "streams.tile.admissions", module: "ADMISSIONS", built: true },
  scholarships: { key: "streams.tile.scholarships", module: "SCHOLARSHIPS", built: true },
  iqac: { key: "streams.tile.iqac", module: "IQAC", built: true },
  library: { key: "streams.tile.library", module: "LIBRARY", built: true },
  labs: { key: "streams.tile.labs", module: "ACADEMICS", built: true },
  placement: { key: "streams.tile.placement", module: "PLACEMENT", built: true },
  internships: { key: "streams.tile.internships", module: "PLACEMENT", built: true },
  nba: { key: "streams.tile.nba", module: "IQAC", built: true },
  mootCourt: { key: "streams.tile.mootCourt", module: "ACADEMICS", built: true },
  teachingPractice: { key: "streams.tile.teachingPractice", module: "ACADEMICS", built: true },
  // The clinical desk, which the office and the head read (R-56, the clinical half; 10 Oct 2026).
  clinicalPostings: { key: "streams.tile.clinicalPostings", module: "ACADEMICS", built: true },
  // The studio desk (R-56, the studio half, 10 Oct 2026): the office reads it on the web; the teachers' and students' screens are in More.
  studios: { key: "streams.tile.studios", module: "ACADEMICS", built: true },
  fieldWork: { key: "streams.tile.fieldWork", built: false },
};

const NOT_BUILT_KEY: Record<NotBuiltCode, TranslationKey> = {
  CLINICAL_POSTINGS: "streams.notBuilt.CLINICAL_POSTINGS",
  LOGBOOKS: "streams.notBuilt.LOGBOOKS",
  HOSPITAL: "streams.notBuilt.HOSPITAL",
  STUDIOS: "streams.notBuilt.STUDIOS",
  JURIES: "streams.notBuilt.JURIES",
  FARM: "streams.notBuilt.FARM",
  FIELD_WORK: "streams.notBuilt.FIELD_WORK",
};

/** The phone screens a tile opens for the office and the head; the rest are the web's pages. */
const OPENS: Partial<Record<HomeTileCode, Partial<Record<"ADMIN" | "PRINCIPAL", string>>>> = {
  people: { ADMIN: "/(app)/people", PRINCIPAL: "/(app)/staff" },
  labs: { ADMIN: "/(app)/lab-desk", PRINCIPAL: "/(app)/lab-desk" },
  teachingPractice: { ADMIN: "/(app)/teaching-practice", PRINCIPAL: "/(app)/teaching-practice" },
  clinicalPostings: { ADMIN: "/(app)/clinical-desk", PRINCIPAL: "/(app)/clinical-desk" },
  // The placement cell at a glance, which the office and the head have on the phone (TA-492): its drives and what waits, internships among it.
  placement: { ADMIN: "/(app)/placement-cell", PRINCIPAL: "/(app)/placement-cell" },
  internships: { ADMIN: "/(app)/placement-cell", PRINCIPAL: "/(app)/placement-cell" },
};

/** A drive the web's home counts as open (stream-home.ts's OPEN_DRIVES). */
const OPEN_DRIVES = ["OPEN", "SHORTLISTING", "ROUNDS", "OFFERS"];

/** The figures the stream-records summary gives a tile, as the web's home words them. */
export function tileFigure(tile: HomeTileCode, s: StreamRecordsSummary, t: (key: TranslationKey, values?: Record<string, string | number>) => string): string | null {
  if (tile === "labs" && s.labs) return t("streams.figure.labs", { batches: s.practical.batches, signed: s.practical.signed, records: s.practical.records });
  if (tile === "mootCourt" && s.law) return t("streams.figure.mootCourt", { count: s.lawInternships.mootCourts.total });
  if (tile === "teachingPractice" && s.education) return t("streams.figure.teachingPractice", { postings: s.teachingPractice.postings, observed: s.teachingPractice.lessonsObserved, planned: s.teachingPractice.lessonsPlanned });
  return null;
}

/**
 * THE COLLEGE'S STREAMS ON THE PHONE (5 Oct 2026), the web's StreamHome for
 * the registrar's and the principal's homes: the streams, a row per tile the
 * preset puts on the home in its order (switched off or coming where so, the
 * labs, moot court and teaching practice with the year's figures from the
 * stream records' summary), the NSS unit's year, and the banner for records a
 * stream asks for that the app does not keep yet. Nothing at a school or at a
 * college with no stream recorded.
 */
export function StreamTilesCard({ role }: { role: "ADMIN" | "PRINCIPAL" }) {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const session = useSession();
  const me = session.status === "signed-in" ? session.me : null;
  const streams = (me?.streams ?? []) as StreamCode[];
  const modules = me?.modules ?? [];
  const summary = useQuery({
    queryKey: ["stream-records", "summary"],
    enabled: streams.length > 0 && modules.includes("ACADEMICS"),
    queryFn: async () => streamRecordsSummarySchema.parse(unwrap(await api().get("/api/v1/stream-records/summary"))),
  });
  const preset = presetUnion(streams);
  // The placement tile's figure, "Drives open: n" as on the web (TA-492), from the cell's home the placement-cell screen reads.
  const cell = useQuery({
    queryKey: ["placement", "summary"],
    enabled: streams.length > 0 && preset.homeTiles.includes("placement") && modules.includes("PLACEMENT"),
    queryFn: async () => placementSummarySchema.parse(unwrap(await api().get("/api/v1/placement/summary"))),
  });
  if (streams.length === 0) return null;
  const s = summary.data;
  // The college's own drives only, as the web counts them: the cell's list also holds other colleges' pooled drives it is a guest of.
  const drivesOpen = cell.data ? cell.data.drives.filter((x) => x.hosted && OPEN_DRIVES.includes(x.status)).length : null;
  return (
    <View style={{ gap: th.space[3] }} testID="stream-tiles">
      <Card title={t("streams.homeTitle")}>
        <Text variant="sm" tone="muted">{streams.map((code) => t(STREAM_KEY[code])).join(" · ")}</Text>
        {preset.homeTiles.map((tile) => {
          const meta = TILE[tile];
          const off = meta.module ? !modules.includes(meta.module) : false;
          const note = !meta.built ? t("streams.tileComing") : off ? t("streams.tileOff") : tile === "placement" && drivesOpen !== null ? t("streams.figure.placement", { count: drivesOpen }) : s ? tileFigure(tile, s, t) : null;
          const target = !off && meta.built ? OPENS[tile]?.[role] : undefined;
          return <Row key={tile} title={t(meta.key)} caption={note ?? undefined} onPress={target ? () => router.push(target as never) : undefined} />;
        })}
        {s && s.corps.nss.enrolled + s.corps.nss.hours > 0 ? <Text variant="sm" tone="muted">{t("streams.figure.nss", { enrolled: s.corps.nss.enrolled, hours: s.corps.nss.hours })}</Text> : null}
      </Card>
      {preset.notBuilt.length > 0 ? (
        <Card title={t("streams.comingTitle")} testID="streams-coming">
          {preset.notBuilt.map((n) => (
            <Text key={n} variant="sm" tone="muted">{t(NOT_BUILT_KEY[n])}</Text>
          ))}
        </Card>
      ) : null}
    </View>
  );
}
