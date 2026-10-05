import type { Metadata } from "next";
import Link from "next/link";
import { SealCheckIcon } from "@phosphor-icons/react/ssr";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleOff } from "@/components/module-off";
import { ModuleFlash } from "@/components/module-flash";
import { CondonationList } from "@/components/academics/condonation-list";
import { requireRole } from "@/lib/tenancy";
import { isModuleOn } from "@/lib/modules";
import { listCondonations } from "@/lib/academics-attendance";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("academics.condonationsTitle") };
}

/** The department's condonation asks: approve above the floor, forward to the principal, or refuse. */
export default async function HodCondonationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireRole("HOD");
  const t = await getT();
  if (!(await isModuleOn(ctx.schoolId, "ACADEMICS"))) return <ModuleOff page module="ACADEMICS" t={t} college />;
  const params = await searchParams;
  const all = params.all === "1";
  const list = await listCondonations(ctx, all ? "ALL" : "OPEN");
  return (
    <div className="space-y-6">
      <PageHeader title={t("academics.condonationsTitle")} description={t("academics.hodCondonationsIntro")} />
      <ModuleFlash t={t} params={params} />
      <Card>
        <CardHeader icon={<SealCheckIcon weight="duotone" className="size-5" />} title={t(all ? "academics.showAll" : "academics.waitingForYou")} />
        <CardBody className="space-y-3">
          <p className="text-sm">
            <Link className="font-medium text-accent-strong underline underline-offset-2" href={all ? "/hod/condonations" : "/hod/condonations?all=1"}>
              {t(all ? "academics.showOpen" : "academics.showAll")}
            </Link>
          </p>
          <CondonationList t={t} items={list.items} decider="HOD" back="/hod/condonations" />
        </CardBody>
      </Card>
    </div>
  );
}
