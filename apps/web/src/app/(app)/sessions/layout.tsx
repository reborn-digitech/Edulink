import { requireFeaturePage } from "@/lib/feature-page";
import { SESSION_FEATURES } from "@/lib/nav";

/** Sessions for a pupil and their family (expert workshops and one-to-ones, a teacher's guidance): the app's 404 while the operator has both the EXPERT_SESSIONS and the TEACHER_SESSIONS platform features off; while one is on, the page shows what is on and hides what is off (15 Oct 2026; src/lib/platform-features.ts). */
export default async function FeatureLayout({ children }: { children: React.ReactNode }) {
  await requireFeaturePage(SESSION_FEATURES);
  return children;
}
