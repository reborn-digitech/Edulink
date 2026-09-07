import { Empty, Screen } from "@/components";
import { useT } from "@/lib/i18n";

/** The principal's dashboard with the window picker — built in Phase 4; a placeholder until then. */
export function PrincipalHome() {
  const t = useT();
  return (
    <Screen title={t("nav.dashboard")}>
      <Empty title={t("common.comingSoon")} body={t("common.comingSoonBody")} />
    </Screen>
  );
}
