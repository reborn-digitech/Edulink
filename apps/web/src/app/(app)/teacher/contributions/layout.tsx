import { requireRole } from "@/lib/tenancy";
import { featurePageLock } from "@/lib/feature-page";
import { PlanCard } from "@/components/plan-card";

/**
 * The teachers' question gig, switched off (the owner, 10 October 2026): every page under
 * /teacher/contributions answers 404 while the QUESTION_GIG platform feature is off (15 October 2026;
 * src/lib/question-gig.ts, src/lib/platform-features.ts). Nothing is deleted; switching it back on brings
 * the pages back as they were. While it is on and the teacher does not hold the TEACHER plan (16 October 2026;
 * src/lib/person-plans.ts), the plan card stands in their place.
 */
export default async function ContributionsLayout({ children }: { children: React.ReactNode }) {
  await requireRole("TEACHER");
  const lock = await featurePageLock("QUESTION_GIG");
  return lock ? <PlanCard {...lock} /> : children;
}
