import { BackTo } from "@/components/back-to";
import { Competitions } from "@/screens/shared/competitions";

function RouteInner() {
  return <Competitions />;
}

/** Not a tab: "‹ Back" above the title. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <RouteInner />
    </BackTo>
  );
}
