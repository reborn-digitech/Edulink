import type { Metadata } from "next";
import { requireRole } from "@/lib/tenancy";
import { IncidentLog, type IncidentLogParams } from "@/components/incident-list";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("incidents.metaTitle"), robots: { index: false, follow: false } };
}

/** The school's whole incident log, for the office and the head. */
export default async function AdminIncidentsPage({ searchParams }: { searchParams: Promise<IncidentLogParams> }) {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const params = await searchParams;
  return <IncidentLog ctx={ctx} basePath="/admin/incidents" params={params} teacher={false} />;
}
