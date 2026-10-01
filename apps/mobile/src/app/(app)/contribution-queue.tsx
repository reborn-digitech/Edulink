import { BackTo } from "@/components/back-to";
import { ContributionsQueue } from "@/screens/operator/contributions";

/** Not a tab: "‹ Back" above the title, to the content team's console when the app was opened straight onto it. The review queue, and one question with ?id=. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/appadmin">
      <ContributionsQueue />
    </BackTo>
  );
}
