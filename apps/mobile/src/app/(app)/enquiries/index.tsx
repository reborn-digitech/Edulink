import { BackTo } from "@/components/back-to";
import { Enquiries } from "@/screens/shared/enquiries";

function RouteInner() {
  return <Enquiries />;
}

/** Not a tab: "‹ Back" above the title. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <RouteInner />
    </BackTo>
  );
}
