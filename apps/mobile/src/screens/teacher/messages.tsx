import { Empty, Screen } from "@/components";
import { useT } from "@/lib/i18n";

/** The inbox: rooms and threads — built in Phase 4; a placeholder until then. */
export function Inbox() {
  const t = useT();
  return (
    <Screen title={t("nav.messages")}>
      <Empty title={t("common.comingSoon")} body={t("common.comingSoonBody")} />
    </Screen>
  );
}
