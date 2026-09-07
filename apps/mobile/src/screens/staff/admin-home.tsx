import { Empty, Screen } from "@/components";
import { useT } from "@/lib/i18n";

/** The admin's overview — built in Phase 4; a placeholder until then. */
export function AdminHome() {
  const t = useT();
  return (
    <Screen title={t("nav.overview")}>
      <Empty title={t("common.comingSoon")} body={t("common.comingSoonBody")} />
    </Screen>
  );
}
