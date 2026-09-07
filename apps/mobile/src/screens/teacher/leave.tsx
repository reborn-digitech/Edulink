import { Empty, Screen } from "@/components";
import { useT } from "@/lib/i18n";

/** Leave: balance and requests — built in Phase 4; a placeholder until then. */
export function TeacherLeave() {
  const t = useT();
  return (
    <Screen title={t("nav.leave")}>
      <Empty title={t("common.comingSoon")} body={t("common.comingSoonBody")} />
    </Screen>
  );
}
