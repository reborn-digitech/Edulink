import { Empty, Screen } from "@/components";
import { useT } from "@/lib/i18n";

/** Placeholder until this role's screen lands (plan: weeks 3–6). */
export default function AvailabilityScreen() {
  const t = useT();
  return (
    <Screen title={t("nav.availability")}>
      <Empty title={t("common.comingSoon")} body={t("common.comingSoonBody")} />
    </Screen>
  );
}
