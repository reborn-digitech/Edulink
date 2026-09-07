import { Empty, Screen } from "@/components";
import { useT } from "@/lib/i18n";

/** A conversation room — built in Phase 4; a placeholder until then. */
export function Room() {
  const t = useT();
  return (
    <Screen title={t("nav.messages")}>
      <Empty title={t("common.comingSoon")} body={t("common.comingSoonBody")} />
    </Screen>
  );
}
