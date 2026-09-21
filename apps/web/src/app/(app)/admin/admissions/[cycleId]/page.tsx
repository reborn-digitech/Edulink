import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarCheckIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { cyclesView, listSlots } from "@/lib/admissions";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { getT } from "@/lib/i18n/server";
import {
  CYCLE_STATUS_KEY,
  CYCLE_STATUS_TONE,
} from "@/components/admissions/labels";
import { CycleEditor } from "../cycle-editor";
import { CycleRowActions } from "../cycle-row-actions";
import { SlotsPanel } from "./slots";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("admissions.editCycle") };
}

const CUID = /^c[a-z0-9]{20,}$/;

/** One cycle: its editor, and the entrance-test sittings the office has published for it. */
export default async function EditCyclePage({
  params,
}: {
  params: Promise<{ cycleId: string }>;
}) {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const t = await getT();
  const { cycleId } = await params;
  if (!CUID.test(cycleId)) notFound();
  const view = await cyclesView(ctx);
  const cycle = view.cycles.find((c) => c.id === cycleId);
  if (!cycle) notFound();
  const [{ slots }, school] = await Promise.all([
    listSlots(ctx, cycleId),
    db.school.findUniqueOrThrow({
      where: { id: ctx.schoolId },
      select: { timezone: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={cycle.name}
        description={cycle.academicYearName}
        meta={
          <Badge tone={CYCLE_STATUS_TONE[cycle.status]} size="sm">
            {t(CYCLE_STATUS_KEY[cycle.status])}
          </Badge>
        }
        actions={
          <CycleRowActions
            cycleId={cycle.id}
            status={cycle.status}
            name={cycle.name}
          />
        }
        back={{ href: "/admin/admissions", label: t("admissions.title") }}
      />
      <CycleEditor
        key={cycle.updatedAt}
        years={view.years}
        structures={view.structures}
        cycle={cycle}
      />

      <Card>
        <CardHeader
          icon={<CalendarCheckIcon weight="duotone" className="size-5" />}
          title={t("admissions.slotsTitle")}
          description={
            cycle.testRequired
              ? t("admissions.testRequiredHint")
              : t("admissions.refuseNoTest")
          }
        />
        <CardBody>
          <SlotsPanel
            cycleId={cycle.id}
            slots={slots}
            timezone={school.timezone}
          />
        </CardBody>
      </Card>
    </div>
  );
}
