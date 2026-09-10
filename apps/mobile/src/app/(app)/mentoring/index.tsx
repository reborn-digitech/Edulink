import { BackTo } from "@/components/back-to";
import { Mentoring } from "@/screens/shared/mentoring";

function RouteInner() {
  return <Mentoring />;
}

/** Not a tab for this role: "‹ Back" above the title. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more" unlessTab="mentoring">
      <RouteInner />
    </BackTo>
  );
}
