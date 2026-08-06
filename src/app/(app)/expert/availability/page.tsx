import type { Metadata } from "next";
import { CalendarIcon } from "@phosphor-icons/react/ssr";
import { requireExpert } from "@/lib/tenancy";
import { listOwnSlots } from "@/lib/experts";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { SlotManager } from "./slots";
import { getT } from "@/lib/i18n/server";

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {t("expert.availability")}
        </h1>
        <p className="mt-1 text-sm text-fg-muted">{t("expert.availabilityBody")}</p>
      </div>

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
