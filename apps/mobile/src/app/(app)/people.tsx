import { BackTo } from "@/components/back-to";
import { useRole } from "@/lib/session";
import { People } from "@/screens/staff/people";
import { Directory } from "@/screens/shared/directory";

/** The office's roll (the web's /admin/people); for everyone else, the people they may write to. */
function RouteInner() {
  const role = useRole();
  if (role === "ADMIN" || role === "PRINCIPAL") return <People />;
  return <Directory />;
}

/** Not a tab for this role: "‹ Back" above the title. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more" unlessTab="people">
      <RouteInner />
    </BackTo>
  );
}
