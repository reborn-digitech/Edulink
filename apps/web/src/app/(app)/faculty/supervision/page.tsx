import type { Metadata } from "next";
import { requireRole } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { listInternships, internshipRule } from "@/lib/placement-internships";
import { listProjects } from "@/lib/placement-projects";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleOff } from "@/components/module-off";
import { Flash } from "@/components/placement/parts";
import { InternshipStaffList } from "@/components/placement/internships";
import { ProjectList } from "@/components/placement/projects";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("placement.supervisionTitle"), robots: { index: false, follow: false } };
}

/** A faculty member's students' work (the placement module, 4 Oct 2026): the internships they supervise — diary, report, grade, visit, viva — and the projects they guide. */
export default async function SupervisionPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const ctx = await requireRole("FACULTY", "HOD");
  const t = await getT();
  const { ok, error } = await searchParams;
  const [on, kind] = await Promise.all([isModuleOn(ctx.schoolId, "PLACEMENT"), institutionKindOf(ctx.schoolId)]);
  if (!on) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("placement.supervisionTitle")} />
        <ModuleOff module="PLACEMENT" t={t} college={isCollegeKind(kind)} />
      </div>
    );
  }
  const [internships, projects] = await Promise.all([listInternships(ctx), listProjects(ctx)]);
  const mine = internships.internships.filter((i) => i.facultyMembershipId === ctx.membershipId);
  return (
    <div className="space-y-5">
      <PageHeader title={t("placement.supervisionTitle")} description={t("placement.supervisionIntro")} />
      <Flash ok={ok} error={error} />
      {/* canDecide is the library's (TPO and HOD): an HOD who supervises sets the credits here too. A supervisor is named by the
          approval, so a faculty member's own list never holds a proposal and the approve/refuse forms (which need the supervisors list) never draw. */}
      <InternshipStaffList internships={mine} t={t} back="/faculty/supervision" canDecide={internships.canDecide} supervisors={[]} rule={internshipRule} ruleKinds={internships.ruleKinds} />
      <ProjectList projects={projects.projects.filter((p) => p.guideMembershipId === ctx.membershipId)} t={t} back="/faculty/supervision" myMembershipId={ctx.membershipId} />
    </div>
  );
}
