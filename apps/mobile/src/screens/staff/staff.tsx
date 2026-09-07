import { Empty, Screen } from "@/components";
import { useT } from "@/lib/i18n";

/** The staff roster — built in Phase 4; a placeholder until then. */
export function StaffRoster() {
  const t = useT();
  return (
    <Screen title={t("nav.staff")}>
      <Empty title={t("common.comingSoon")} body={t("common.comingSoonBody")} />
    </Screen>
  );
}
