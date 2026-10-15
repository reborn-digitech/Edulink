import { requireFeaturePage } from "@/lib/feature-page";

/** A guardian's view of a child's practice: the app's 404 while the operator has the QUESTION_BANK platform feature off (15 Oct 2026; src/lib/platform-features.ts). */
export default async function FeatureLayout({ children }: { children: React.ReactNode }) {
  await requireFeaturePage("QUESTION_BANK");
  return children;
}
