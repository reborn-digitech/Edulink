import { BackTo } from "@/components/back-to";
import { Safety } from "@/screens/staff/safety";

function RouteInner() {
  return <Safety />;
}

/** Not a tab: "‹ Back" above the title. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <RouteInner />
    </BackTo>
  );
}
