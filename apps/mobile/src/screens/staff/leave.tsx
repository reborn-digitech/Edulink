import { Empty, Screen } from "@/components";
import { useT } from "@/lib/i18n";

/** Leave decisions with cover — built in Phase 4; a placeholder until then. */
export function LeaveDesk() {
  const t = useT();
  return (
    <Screen title={t("nav.leave")}>
      <Empty title={t("common.comingSoon")} body={t("common.comingSoonBody")} />
    </Screen>
  );
}
