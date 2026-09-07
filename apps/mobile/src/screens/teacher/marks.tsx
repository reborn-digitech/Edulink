import { Empty, Screen } from "@/components";
import { useT } from "@/lib/i18n";

/** The marks grid — built in Phase 4; a placeholder until then. */
export function MarksGrid() {
  const t = useT();
  return (
    <Screen title={t("nav.exams")}>
      <Empty title={t("common.comingSoon")} body={t("common.comingSoonBody")} />
    </Screen>
  );
}
