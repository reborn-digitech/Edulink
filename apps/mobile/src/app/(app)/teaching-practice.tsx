import { BackTo } from "@/components/back-to";
import { TeachingPracticeScreen } from "@/screens/college/duty-desks";

/** Not a tab: "‹ Back" above the title. Teaching practice, for the practice teaching coordinator and the office (5 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)">
      <TeachingPracticeScreen />
    </BackTo>
  );
}
