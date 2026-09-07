import { Empty, Screen } from "@/components";
import { useT } from "@/lib/i18n";

/** The register with the offline outbox — built in Phase 4; a placeholder until then. */
export function Register() {
  const t = useT();
  return (
    <Screen title={t("nav.register")}>
      <Empty title={t("common.comingSoon")} body={t("common.comingSoonBody")} />
    </Screen>
  );
}
