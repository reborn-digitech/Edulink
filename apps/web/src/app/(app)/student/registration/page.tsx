import type { Metadata } from "next";
import { ListChecksIcon } from "@phosphor-icons/react/ssr";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleOff } from "@/components/module-off";
import { ModuleFlash } from "@/components/module-flash";
import { RegistrationForm } from "@/components/academics/registration-form";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { registrationView } from "@/lib/academics-registration";
import { getT } from "@/lib/i18n/server";
import { registerAction } from "../academics/actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("academics.registrationTitle") };
}

/** My course registration for the term: the core courses, the electives, minors and honours I choose within the credits, while the window is open. */
export default async function StudentRegistrationPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireRole("STUDENT");
  const t = await getT();
  const [on, kind] = await Promise.all([isModuleOn(ctx.schoolId, "ACADEMICS"), institutionKindOf(ctx.schoolId)]);
  if (!on) return <ModuleOff module="ACADEMICS" t={t} college={isCollegeKind(kind)} />;
  const view = await registrationView(ctx, {});
  return (
    <div className="space-y-6">
      <PageHeader title={t("academics.registrationTitle")} description={view.term ? view.term.name : t("academics.registrationIntro")} />
      <ModuleFlash t={t} params={await searchParams} />
      <Card>
        <CardHeader icon={<ListChecksIcon weight="duotone" className="size-5" />} title={t("academics.chooseCourses")} description={t("academics.chooseCoursesBody")} />
        <CardBody>
          <RegistrationForm t={t} view={view} action={registerAction} />
        </CardBody>
      </Card>
    </div>
  );
}
