import { BackTo } from "@/components/back-to";
import { MarksGrid } from "@/screens/teacher/marks";
import { useRole } from "@/lib/session";

function RouteInner() {
  const role = useRole();
  void role;
  return <MarksGrid />;
}

/** Not a tab: "‹ Back" above the title. */
export default function Route() {
  return (
    <BackTo fallback="/(app)">
      <RouteInner />
    </BackTo>
  );
}
