import { BackTo } from "@/components/back-to";
import { CompetitionDetail } from "@/screens/shared/competition-detail";

function RouteInner() {
  return <CompetitionDetail />;
}

/** Not a tab: "‹ Back" above the title. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/competitions">
      <RouteInner />
    </BackTo>
  );
}
