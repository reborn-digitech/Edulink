import { Empty, Screen } from "@/components";
import { useT } from "@/lib/i18n";

/** The pupil's Today — built in Phase 4; a placeholder until then. */
export function StudentHome() {
  const t = useT();
  return (
    <Screen title={t("nav.today")}>
      <Empty title={t("common.comingSoon")} body={t("common.comingSoonBody")} />
    </Screen>
  );
}
