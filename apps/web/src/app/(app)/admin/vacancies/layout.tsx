import { featurePageLock } from "@/lib/feature-page";
import { PlanCard } from "@/components/plan-card";

/** The school's own vacancies: the app's 404 while the operator has the JOB_BOARD platform feature off (15 Oct 2026; src/lib/platform-features.ts). */
export default async function FeatureLayout({ children }: { children: React.ReactNode }) {
  const lock = await featurePageLock("JOB_BOARD");
  return lock ? <PlanCard {...lock} /> : children;
}
