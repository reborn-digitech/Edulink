import { BackTo } from "@/components/back-to";
import { ReportProblem } from "@/screens/shared/report-problem";

/** Hidden from the tab bar (see _layout.tsx); reached from More with ?from=. */
function RouteInner() {
  return <ReportProblem />;
}

/** Not a tab: "‹ Back" above the title. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <RouteInner />
    </BackTo>
  );
}
