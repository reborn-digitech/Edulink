import type { Metadata } from "next";
import { HourglassIcon } from "@phosphor-icons/react/ssr";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { dutyPageContext } from "@/components/stream-records/duty-page";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("duties.STUDIO_COORDINATOR.name") };
}

/**
 * A DUTY WHOSE RECORDS ARE COMING (5 Oct 2026): STUDIO_COORDINATOR is offered and can be
 * given, but the records its council asks for are not built yet (the preset's
 * notBuilt, STUDIOS). The page says so in the preset's own sentence rather than
 * drawing an empty desk.
 */
export default async function ComingDutyPage() {
  await dutyPageContext("STUDIO_COORDINATOR", "ACADEMICS");
  const t = await getT();
  return (
    <div className="space-y-6">
      <PageHeader title={t("duties.STUDIO_COORDINATOR.name")} description={t("duties.STUDIO_COORDINATOR.what")} />
      <EmptyState icon={<HourglassIcon weight="duotone" className="size-6" />} title={t("duties.comingTitle")} description={t("streams.notBuilt.STUDIOS")} />
    </div>
  );
}
