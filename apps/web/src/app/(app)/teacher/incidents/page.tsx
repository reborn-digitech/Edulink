import type { Metadata } from "next";
import { requireRole } from "@/lib/tenancy";
import { IncidentLog, type IncidentLogParams } from "@/components/incident-list";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("incidents.metaTitle"), robots: { index: false, follow: false } };
}

/** A teacher's incident log: the pupils of the classes they teach, scoped by the library. */
export default async function TeacherIncidentsPage({ searchParams }: { searchParams: Promise<IncidentLogParams> }) {
  const ctx = await requireRole("TEACHER");
  const params = await searchParams;
  return <IncidentLog ctx={ctx} basePath="/teacher/incidents" params={params} teacher />;
}
