import { Empty, Screen } from "@/components";
import { useT } from "@/lib/i18n";

/** The social feed — built in Phase 4; a placeholder until then. */
export function FamilyBulletin() {
  const t = useT();
  return (
    <Screen title={t("nav.bulletin")}>
      <Empty title={t("common.comingSoon")} body={t("common.comingSoonBody")} />
    </Screen>
  );
}
