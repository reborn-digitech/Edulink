import { BackTo } from "@/components/back-to";
import { TalksScreen } from "@/screens/placement/talks";

/** Not a tab: "‹ Back" to the home. Pre-placement talks: a student's answers, the TPO's attendance (R-2, 5 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)">
      <TalksScreen />
    </BackTo>
  );
}
