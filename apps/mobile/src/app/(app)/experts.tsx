import { BackTo } from "@/components/back-to";
import { Experts } from "@/screens/shared/experts";

function RouteInner() {
  return <Experts />;
}

/** Not a tab: "‹ Back" above the title. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <RouteInner />
    </BackTo>
  );
}
