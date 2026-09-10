import { BackTo } from "@/components/back-to";
import { Room } from "@/screens/teacher/room";
import { useRole } from "@/lib/session";

function RouteInner() {
  const role = useRole();
  void role;
  return <Room />;
}

/** Not a tab: "‹ Back" above the title. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/messages">
      <RouteInner />
    </BackTo>
  );
}
