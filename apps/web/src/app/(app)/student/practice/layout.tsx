import { featurePageLock } from "@/lib/feature-page";
import { PlanCard } from "@/components/plan-card";
import { OnceSetsCard } from "@/components/practice/once-sets";

/**
 * A pupil's practice: the app's 404 while the operator has the QUESTION_BANK platform feature off (15 Oct 2026;
 * src/lib/platform-features.ts); the plan card in place of every page here for a pupil without the Student plan —
 * and, since decision 0008 (7 Nov 2026), beside it the sets a teacher assigned, each of which opens ONCE without
 * the plan at /student/practice-once/{assignmentId} (outside this layout, so the card never covers it).
 */
export default async function FeatureLayout({ children }: { children: React.ReactNode }) {
  const lock = await featurePageLock("QUESTION_BANK");
  if (!lock) return children;
  return (
    <div className="space-y-6">
      <PlanCard {...lock} />
      <OnceSetsCard />
    </div>
  );
}
