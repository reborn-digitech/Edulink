import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { listInternships } from "@/lib/placement-internships";
import { supervisors } from "@/lib/placement-projects";
import { CellFrame, cellContext } from "@/components/placement/parts";
import { InternshipStaffList } from "@/components/placement/internships";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("placement.tabInternships"), robots: { index: false, follow: false } };
}

/** Every internship of the college under the AICTE policy, for the cell to approve, follow and credit. */
export default async function InternshipsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { ctx, t, on, college } = await cellContext();
  const { ok, error } = await searchParams;
  if (!on) return <CellFrame t={t} on={false} college={college} current="internships" title={t("placement.tabInternships")}>{null}</CellFrame>;
  const [list, people] = await Promise.all([listInternships(ctx), supervisors(ctx.schoolId)]);
  return (
    <CellFrame t={t} on college={college} current="internships" title={t("placement.tabInternships")} description={t("placement.internshipsIntro")} ok={ok} error={error}>
      <InternshipStaffList internships={list.internships} t={t} back="/placement/internships" canDecide={list.canDecide} supervisors={people} rule={list.rule} ruleKinds={list.ruleKinds} />
    </CellFrame>
  );
}
