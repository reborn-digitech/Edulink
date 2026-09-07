import { Empty, Screen } from "@/components";
import { useT } from "@/lib/i18n";

/** Classes and a class's roll — built in Phase 4; a placeholder until then. */
export function StaffClasses() {
  const t = useT();
  return (
    <Screen title={t("nav.classes")}>
      <Empty title={t("common.comingSoon")} body={t("common.comingSoonBody")} />
    </Screen>
  );
}
