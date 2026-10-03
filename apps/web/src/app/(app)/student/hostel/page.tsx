import type { Metadata } from "next";
import { requireRole } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";
import { FamilyHostelView } from "@/components/hostel/family";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("modules.hostelName"), robots: { index: false, follow: false } };
}

/** The boarder's own hostel: the room, tonight's roll call, today's menu, and leave to ask for. */
export default async function StudentHostelPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const ctx = await requireRole("STUDENT");
  const { ok, error } = await searchParams;
  return <FamilyHostelView ctx={ctx} schoolId={ctx.schoolId} path="/student/hostel" ok={ok} error={error} />;
}
