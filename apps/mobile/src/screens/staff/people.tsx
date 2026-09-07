import { Empty, Screen } from "@/components";
import { useT } from "@/lib/i18n";

/** People search and invites — built in Phase 4; a placeholder until then. */
export function People() {
  const t = useT();
  return (
    <Screen title={t("nav.people")}>
      <Empty title={t("common.comingSoon")} body={t("common.comingSoonBody")} />
    </Screen>
  );
}
