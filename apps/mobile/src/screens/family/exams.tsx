import { Empty, Screen } from "@/components";
import { useT } from "@/lib/i18n";

/** Exams and report cards — built in Phase 4; a placeholder until then. */
export function FamilyExams() {
  const t = useT();
  return (
    <Screen title={t("nav.exams")}>
      <Empty title={t("common.comingSoon")} body={t("common.comingSoonBody")} />
    </Screen>
  );
}
