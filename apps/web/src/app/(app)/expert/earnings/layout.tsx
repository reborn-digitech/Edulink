import { requireFeatureSwitchPage } from "@/lib/feature-page";

/** An expert's earnings: the app's 404 while the operator has the EXPERT_SESSIONS platform feature off (15 Oct 2026; src/lib/platform-features.ts). */
/* Plan-free (16 Oct 2026): an expert whose plan has ended still reads what was booked with them and what they earned; only the platform switch closes it. */
export default async function FeatureLayout({ children }: { children: React.ReactNode }) {
  await requireFeatureSwitchPage("EXPERT_SESSIONS");
  return children;
}
