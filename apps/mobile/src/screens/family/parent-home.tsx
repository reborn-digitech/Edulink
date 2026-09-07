import { Empty, Screen } from "@/components";
import { useT } from "@/lib/i18n";

/** The guardian's overview with the child switcher — built in Phase 4; a placeholder until then. */
export function ParentHome() {
  const t = useT();
  return (
    <Screen title={t("nav.overview")}>
      <Empty title={t("common.comingSoon")} body={t("common.comingSoonBody")} />
    </Screen>
  );
}
