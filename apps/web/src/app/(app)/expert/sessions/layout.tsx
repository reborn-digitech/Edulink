import { featurePageLock } from "@/lib/feature-page";
import { PlanCard } from "@/components/plan-card";

/** An expert's sessions and workshops: the app's 404 while the operator has the EXPERT_SESSIONS platform feature off (15 Oct 2026; src/lib/platform-features.ts). */
export default async function FeatureLayout({ children }: { children: React.ReactNode }) {
  const lock = await featurePageLock("EXPERT_SESSIONS");
  return lock ? <PlanCard {...lock} /> : children;
}
