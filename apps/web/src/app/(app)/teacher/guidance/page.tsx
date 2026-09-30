import type { Metadata } from "next";
import { requireRole } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";
import { ProviderScreen } from "@/components/gigs/provider-screen";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("nav.guidance"), robots: { index: false, follow: false } };
}

/** A teacher's free one-to-one guidance for pupils of their own school, once the school has switched it on. */
export default async function TeacherGuidancePage() {
  return <ProviderScreen ctx={await requireRole("TEACHER")} />;
}
