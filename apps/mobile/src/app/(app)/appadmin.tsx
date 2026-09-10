import { BackTo } from "@/components/back-to";
import { AppAdminHome } from "@/screens/operator/app-admin";

/** Hidden from the bar; reached from More by a content-team member who also belongs to a school. */
function RouteInner() {
  return <AppAdminHome />;
}

/** Not a tab: "‹ Back" above the title. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <RouteInner />
    </BackTo>
  );
}
