import { requireFeaturePage } from "@/lib/feature-page";

/** The vacancies board: the app's 404 while the operator has the JOB_BOARD platform feature off (15 Oct 2026; src/lib/platform-features.ts). */
export default async function FeatureLayout({ children }: { children: React.ReactNode }) {
  await requireFeaturePage("JOB_BOARD");
  return children;
}
