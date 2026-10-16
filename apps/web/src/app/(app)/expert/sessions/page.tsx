import type { Metadata } from "next";
import { requireExpert } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";
import { ProviderScreen } from "@/components/gigs/provider-screen";
import { featurePageLock } from "@/lib/feature-page";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("gigs.providerTitle"), robots: { index: false, follow: false } };
}

/** An expert's one-to-one sessions and workshops with pupils of every school. */
export default async function ExpertSessionsPage() {
  const ctx = await requireExpert();
  // The layout draws the plan card in place of this page for a person without the plan; Next renders the page beside it
  // all the same, so it returns nothing first rather than reading what the plan locks (website-two, 16 Oct 2026: the
  // plan refusal left a not-found marker in a payload the browser never drew).
  if (await featurePageLock("EXPERT_SESSIONS")) return null;
  return <ProviderScreen ctx={ctx} />;
}
