import { Empty, Screen } from "@/components";
import { useT } from "@/lib/i18n";

/** Practice drills — built in Phase 4; a placeholder until then. */
export function FamilyPractice() {
  const t = useT();
  return (
    <Screen title={t("nav.practice")}>
      <Empty title={t("common.comingSoon")} body={t("common.comingSoonBody")} />
    </Screen>
  );
}
