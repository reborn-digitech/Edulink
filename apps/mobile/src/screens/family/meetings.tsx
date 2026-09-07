import { Empty, Screen } from "@/components";
import { useT } from "@/lib/i18n";

/** Meetings and bookings — built in Phase 4; a placeholder until then. */
export function FamilyMeetings() {
  const t = useT();
  return (
    <Screen title={t("nav.meetings")}>
      <Empty title={t("common.comingSoon")} body={t("common.comingSoonBody")} />
    </Screen>
  );
}
