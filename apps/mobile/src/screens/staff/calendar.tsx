import { Empty, Screen } from "@/components";
import { useT } from "@/lib/i18n";

/** The school calendar — built in Phase 4; a placeholder until then. */
export function StaffCalendar() {
  const t = useT();
  return (
    <Screen title={t("nav.calendar")}>
      <Empty title={t("common.comingSoon")} body={t("common.comingSoonBody")} />
    </Screen>
  );
}
