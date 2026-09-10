import { BackTo } from "@/components/back-to";
import { CompetitionEntries } from "@/screens/shared/competition-entries";

/** Not a tab: "‹ Back" above the title, to /(app)/competitions when the app was opened straight onto it. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/competitions">
      <CompetitionEntries />
    </BackTo>
  );
}
