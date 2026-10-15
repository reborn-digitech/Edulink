import { featurePageLock } from "@/lib/feature-page";
import { PlanCard } from "@/components/plan-card";

/** A guardian's view of a child's practice: the app's 404 while the operator has the QUESTION_BANK platform feature off (15 Oct 2026; src/lib/platform-features.ts). */
export default async function FeatureLayout({ children }: { children: React.ReactNode }) {
  const lock = await featurePageLock("QUESTION_BANK");
  return lock ? <PlanCard {...lock} /> : children;
}
