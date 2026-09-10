import { BackTo } from "@/components/back-to";
import { MentoringSetup } from "@/screens/shared/mentoring-setup";

/** Not a tab: "‹ Back" above the title, to /(app)/mentoring when the app was opened straight onto it. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/mentoring">
      <MentoringSetup />
    </BackTo>
  );
}
