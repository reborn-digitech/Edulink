import { requireFeaturePage } from "@/lib/feature-page";

/** An expert's offered times: the app's 404 while the operator has the EXPERT_SESSIONS platform feature off (15 Oct 2026; src/lib/platform-features.ts). */
export default async function FeatureLayout({ children }: { children: React.ReactNode }) {
  await requireFeaturePage("EXPERT_SESSIONS");
  return children;
}
