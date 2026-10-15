import { requireFeaturePage } from "@/lib/feature-page";

/** The assistant's pages: the app's 404 while the operator has the ASSISTANT platform feature off (15 Oct 2026; src/lib/platform-features.ts). */
export default async function FeatureLayout({ children }: { children: React.ReactNode }) {
  await requireFeaturePage("ASSISTANT");
  return children;
}
