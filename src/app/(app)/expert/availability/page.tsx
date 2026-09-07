import type { Metadata } from "next";
import { CalendarIcon } from "@phosphor-icons/react/ssr";
import { requireExpert } from "@/lib/tenancy";
import { listOwnSlots } from "@/lib/experts";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { SlotManager } from "./slots";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.availability") };
}

export default async function AvailabilityPage() {
  const t = await getT();
  const ctx = await requireExpert();
  const slots = await listOwnSlots(ctx);

  return (
    <div className="space-y-5">
      <PageHeader title={t("expert.availability")} description={t("expert.availabilityBody")} />

      <Card>
        <CardHeader
          title={t("expert.yourTimes")}
          description={t("expert.timesInUtc")}
          icon={<CalendarIcon weight="duotone" className="size-5" />}
        />
        <CardBody>
          <SlotManager
            slots={slots.map((slot) => ({
              id: slot.id,
              startsAt: slot.startsAt.toISOString(),
              endsAt: slot.endsAt.toISOString(),
              note: slot.note,
              bookedBy: slot.booking?.school.name ?? null,
            }))}
          />
        </CardBody>
      </Card>
    </div>
  );
}
