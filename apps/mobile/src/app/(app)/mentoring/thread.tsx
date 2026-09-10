import { BackTo } from "@/components/back-to";
import { MentoringThread } from "@/screens/shared/mentoring-thread";

function RouteInner() {
  return <MentoringThread />;
}

/** Not a tab: "‹ Back" above the title. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/mentoring">
      <RouteInner />
    </BackTo>
  );
}
