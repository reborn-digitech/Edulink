import { BackTo } from "@/components/back-to";
import { StaffRoster } from "@/screens/staff/staff";
import { useRole } from "@/lib/session";

function RouteInner() {
  const role = useRole();
  void role;
  return <StaffRoster />;
}

/** Not a tab: "‹ Back" above the title. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <RouteInner />
    </BackTo>
  );
}
