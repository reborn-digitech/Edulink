import type { Metadata } from "next";
import { requireExpert } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";
import { ProviderScreen } from "@/components/gigs/provider-screen";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("gigs.providerTitle"), robots: { index: false, follow: false } };
}

/** An expert's one-to-one sessions and workshops with pupils of every school. */
export default async function ExpertSessionsPage() {
  return <ProviderScreen ctx={await requireExpert()} />;
}
