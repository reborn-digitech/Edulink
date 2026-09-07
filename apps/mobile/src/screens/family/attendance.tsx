import { Empty, Screen } from "@/components";
import { useT } from "@/lib/i18n";

/** The attendance calendar — built in Phase 4; a placeholder until then. */
export function FamilyAttendance() {
  const t = useT();
  return (
    <Screen title={t("nav.attendance")}>
      <Empty title={t("common.comingSoon")} body={t("common.comingSoonBody")} />
    </Screen>
  );
}
