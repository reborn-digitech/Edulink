import type { Metadata } from "next";
import Link from "next/link";
import { SealCheckIcon } from "@phosphor-icons/react/ssr";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ModuleOff } from "@/components/module-off";
import { OfficeTop } from "@/components/academics/parts";
import { CondonationList } from "@/components/academics/condonation-list";
import { listCondonations } from "@/lib/academics-attendance";
import { getT } from "@/lib/i18n/server";
import { academicsGate, one, type SearchParams } from "../shared";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("academics.tabCondonations") };
}

/** Condonations: what the HODs forwarded, for the principal to decide; the office reads every ask. */
export default async function CondonationsAdminPage({ searchParams }: { searchParams: SearchParams }) {
  const { ctx, t, on, college } = await academicsGate();
  if (!on) return <ModuleOff module="ACADEMICS" t={t} college={college} />;
  const params = await searchParams;
  const all = one(params.all) === "1";
  const list = await listCondonations(ctx, all ? "ALL" : "OPEN");
  return (
    <div className="space-y-6">
      <OfficeTop t={t} current="condonations" params={params} />
      <Card>
        <CardHeader icon={<SealCheckIcon weight="duotone" className="size-5" />} title={t(ctx.role === "PRINCIPAL" ? "academics.forwardedTitle" : "academics.condonationsTitle")} description={t("academics.condonationsBody")} />
        <CardBody className="space-y-3">
          <p className="text-sm">
            <Link className="font-medium text-accent-strong underline underline-offset-2" href={all ? "/admin/academics/condonations" : "/admin/academics/condonations?all=1"}>
              {t(all ? "academics.showOpen" : "academics.showAll")}
            </Link>
          </p>
          <CondonationList t={t} items={list.items} decider={ctx.role === "PRINCIPAL" ? "PRINCIPAL" : null} back="/admin/academics/condonations" />
        </CardBody>
      </Card>
    </div>
  );
}
