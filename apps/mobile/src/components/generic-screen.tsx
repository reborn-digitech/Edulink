import { Empty, Screen } from "@/components";
import { useT } from "@/lib/i18n";

/** A tab this role has no screen for yet. */
export function GenericScreen({ title }: { title: string }) {
  const t = useT();
  return (
    <Screen title={title}>
      <Empty title={t("common.comingSoon")} body={t("common.comingSoonBody")} />
    </Screen>
  );
}
