import { BackTo } from "@/components/back-to";
import { CompetitionNew } from "@/screens/shared/competition-new";

/** Not a tab: "‹ Back" above the title, to /(app)/competitions when the app was opened straight onto it. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/competitions">
      <CompetitionNew />
    </BackTo>
  );
}
