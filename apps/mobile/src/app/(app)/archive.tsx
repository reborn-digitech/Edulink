import { BackTo } from "@/components/back-to";
import { Archive } from "@/screens/shared/archive";

function RouteInner() {
  return <Archive />;
}

/** Not a tab: "‹ Back" above the title. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <RouteInner />
    </BackTo>
  );
}
