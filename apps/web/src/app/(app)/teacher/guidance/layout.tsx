import { featurePageLock } from "@/lib/feature-page";
import { PlanCard } from "@/components/plan-card";

/** A teacher's guidance one-to-ones: the app's 404 while the operator has the TEACHER_SESSIONS platform feature off (15 Oct 2026; src/lib/platform-features.ts). */
export default async function FeatureLayout({ children }: { children: React.ReactNode }) {
  const lock = await featurePageLock("TEACHER_SESSIONS");
  return lock ? <PlanCard {...lock} /> : children;
}
