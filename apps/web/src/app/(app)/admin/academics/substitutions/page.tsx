import type { Metadata } from "next";
import { ArrowsClockwiseIcon } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DateField } from "@/components/ui/field";
import { ModuleOff } from "@/components/module-off";
import { OfficeTop } from "@/components/academics/parts";
import { SubstitutionBoard } from "@/components/academics/substitution-board";
import { lectureSubstitutions } from "@/lib/academics";
import { getLocale, getT } from "@/lib/i18n/server";
import { formatDateKey } from "@/lib/dates";
import { academicsGate, one, type SearchParams } from "../shared";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("academics.tabSubstitutions") };
}

/** The lecture substitution board: lectures whose faculty member is on leave or absent on the staff register, and who stands in. */
export default async function SubstitutionsPage({ searchParams }: { searchParams: SearchParams }) {
  const { ctx, t, on, college, canEdit } = await academicsGate();
  if (!on) return <ModuleOff module="ACADEMICS" t={t} college={college} />;
  const params = await searchParams;
  const [board, locale] = await Promise.all([lectureSubstitutions(ctx, one(params.date)), getLocale()]);
  return (
    <div className="space-y-6">
      <OfficeTop t={t} current="substitutions" params={params} />
      <Card>
        <CardHeader icon={<ArrowsClockwiseIcon weight="duotone" className="size-5" />} title={t("academics.boardTitle", { date: formatDateKey(board.dateKey, { weekday: "long", day: "numeric", month: "long" }, locale) })} description={t("academics.boardBody")} />
        <CardBody className="space-y-4">
          <form method="get" className="flex items-end gap-2">
            <DateField label={t("academics.fieldDate")} name="date" defaultValue={board.dateKey} />
            <Button type="submit" variant="secondary">{t("academics.show")}</Button>
          </form>
          <SubstitutionBoard t={t} board={board} canAssign={canEdit} back={`/admin/academics/substitutions?date=${board.dateKey}`} />
        </CardBody>
      </Card>
    </div>
  );
}
