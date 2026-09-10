import { BackTo } from "@/components/back-to";
import { StaffCalendar } from "@/screens/staff/calendar";
import { useRole } from "@/lib/session";

function RouteInner() {
  const role = useRole();
  void role;
  return <StaffCalendar />;
}

/** Not a tab: "‹ Back" above the title. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <RouteInner />
    </BackTo>
  );
}
