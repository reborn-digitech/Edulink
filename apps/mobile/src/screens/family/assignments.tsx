import { Empty, Screen } from "@/components";
import { useT } from "@/lib/i18n";

/** Assignments, with hand-in for a pupil — built in Phase 4; a placeholder until then. */
export function FamilyAssignments() {
  const t = useT();
  return (
    <Screen title={t("nav.assignments")}>
      <Empty title={t("common.comingSoon")} body={t("common.comingSoonBody")} />
    </Screen>
  );
}
