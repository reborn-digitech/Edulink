import { BackTo } from "@/components/back-to";
import { Thread } from "@/screens/teacher/thread";
import { useRole } from "@/lib/session";

function RouteInner() {
  const role = useRole();
  void role;
  return <Thread />;
}

/** Not a tab: "‹ Back" above the title. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/messages">
      <RouteInner />
    </BackTo>
  );
}
