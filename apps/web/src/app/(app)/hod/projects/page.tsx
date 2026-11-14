import type { Metadata } from "next";
import { PlusIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { rollOf } from "@/lib/placement";
import { listInternships } from "@/lib/placement-internships";
import { listProjects, supervisors } from "@/lib/placement-projects";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { ModuleOff } from "@/components/module-off";
import { Flash } from "@/components/placement/parts";
import { InternshipStaffList } from "@/components/placement/internships";
import { ProjectList } from "@/components/placement/projects";
import { createProjectAction } from "@/app/(app)/placement/actions";
import { ActionForm } from "@/components/ui/action-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("placement.hodProjectsTitle"), robots: { index: false, follow: false } };
}

/** The HOD's students' work (the placement module, 4 Oct 2026): projects with their guides and reviews, set up here; the internships to approve, follow and credit. */
export default async function HodProjectsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const ctx = await requireRole("HOD");
  const t = await getT();
  const { ok, error } = await searchParams;
  const [on, kind] = await Promise.all([isModuleOn(ctx.schoolId, "PLACEMENT"), institutionKindOf(ctx.schoolId)]);
  if (!on) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("placement.hodProjectsTitle")} />
        <ModuleOff module="PLACEMENT" t={t} college={isCollegeKind(kind)} />
      </div>
    );
  }
  const [projects, internships, guides, students] = await Promise.all([listProjects(ctx), listInternships(ctx), supervisors(ctx.schoolId), rollOf(ctx.schoolId)]);
  const back = "/hod/projects";
  return (
    <div className="space-y-5">
      <PageHeader title={t("placement.hodProjectsTitle")} description={t("placement.hodProjectsIntro")} />
      <Flash ok={ok} error={error} />
      <Card>
        <CardHeader icon={<PlusIcon weight="bold" className="size-5" />} title={t("placement.newProject")} />
        <CardBody>
          <ActionForm action={createProjectAction} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="back" value={back} />
            <TextField label={t("placement.fieldProjectTitle")} name="title" required maxLength={200} />
            <SelectField label={t("placement.fieldGuide")} name="guideMembershipId" required>
              {guides.map((g) => <option key={g.membershipId} value={g.membershipId}>{g.name}</option>)}
            </SelectField>
            <fieldset className="grid gap-1 text-sm sm:col-span-2 sm:grid-cols-3">
              <legend className="mb-1 font-medium">{t("placement.fieldProjectStudents")}</legend>
              {students.map((s) => (
                <label key={s.id} className="flex items-center gap-2">
                  <input type="checkbox" name="studentMembershipIds" value={s.id} />
                  {s.name}
                </label>
              ))}
            </fieldset>
            <Button type="submit" className="sm:justify-self-start">{t("placement.createProject")}</Button>
          </ActionForm>
        </CardBody>
      </Card>
      <ProjectList projects={projects.projects} t={t} back={back} myMembershipId={ctx.membershipId} />
      <InternshipStaffList internships={internships.internships} t={t} back={back} canDecide={internships.canDecide} supervisors={guides} rule={internships.rule} ruleKinds={internships.ruleKinds} />
    </div>
  );
}
