import { BackTo } from "@/components/back-to";
import { FamilyBulletin } from "@/screens/family/bulletin";
import { useRole } from "@/lib/session";

function RouteInner() {
  const role = useRole();
  void role;
  return <FamilyBulletin />;
}

/** A tab for the college's staff (4 Oct 2026); for everyone else "‹ Back" above the title. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more" unlessTab="bulletin">
      <RouteInner />
    </BackTo>
  );
}
