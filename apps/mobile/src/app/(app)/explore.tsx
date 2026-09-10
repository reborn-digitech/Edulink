import { BackTo } from "@/components/back-to";
import { Explore } from "@/screens/shared/explore";

function RouteInner() {
  return <Explore />;
}

/** Not a tab: "‹ Back" above the title. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <RouteInner />
    </BackTo>
  );
}
