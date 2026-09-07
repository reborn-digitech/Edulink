import { Empty, Screen } from "@/components";
import { useT } from "@/lib/i18n";

/** The review desk — built in Phase 4; a placeholder until then. */
export function ReviewDesk() {
  const t = useT();
  return (
    <Screen title={t("nav.reviews")}>
      <Empty title={t("common.comingSoon")} body={t("common.comingSoonBody")} />
    </Screen>
  );
}
