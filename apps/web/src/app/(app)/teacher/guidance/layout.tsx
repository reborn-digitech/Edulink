import { requireFeaturePage } from "@/lib/feature-page";

/** A teacher's guidance one-to-ones: the app's 404 while the operator has the TEACHER_SESSIONS platform feature off (15 Oct 2026; src/lib/platform-features.ts). */
export default async function FeatureLayout({ children }: { children: React.ReactNode }) {
  await requireFeaturePage("TEACHER_SESSIONS");
  return children;
}
