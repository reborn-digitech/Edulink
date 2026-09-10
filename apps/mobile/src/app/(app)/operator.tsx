import { BackTo } from "@/components/back-to";
import { OperatorHome } from "@/screens/operator/home";

/** Hidden from the bar; reached from More by an operator who also belongs to a school. */
function RouteInner() {
  return <OperatorHome />;
}

/** Not a tab: "‹ Back" above the title. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <RouteInner />
    </BackTo>
  );
}
