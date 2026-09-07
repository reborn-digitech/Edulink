import { Empty, Screen } from "@/components";
import { useT } from "@/lib/i18n";

/** The week's timetable — built in Phase 4; a placeholder until then. */
export function FamilyTimetable() {
  const t = useT();
  return (
    <Screen title={t("nav.timetable")}>
      <Empty title={t("common.comingSoon")} body={t("common.comingSoonBody")} />
    </Screen>
  );
}
