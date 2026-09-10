import { BackTo } from "@/components/back-to";
import { FamilyBulletin } from "@/screens/family/bulletin";
import { useRole } from "@/lib/session";

function RouteInner() {
  const role = useRole();
  void role;
  return <FamilyBulletin />;
}

/** Not a tab: "‹ Back" above the title. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <RouteInner />
    </BackTo>
  );
}
