import { Empty, Screen } from "@/components";
import { useT } from "@/lib/i18n";

/** The teacher's classes — built in Phase 4; a placeholder until then. */
export function TeacherClasses() {
  const t = useT();
  return (
    <Screen title={t("nav.classes")}>
      <Empty title={t("common.comingSoon")} body={t("common.comingSoonBody")} />
    </Screen>
  );
}
