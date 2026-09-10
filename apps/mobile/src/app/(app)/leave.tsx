import { BackTo } from "@/components/back-to";
import { TeacherLeave } from "@/screens/teacher/leave";
import { LeaveDesk } from "@/screens/staff/leave";
import { useRole } from "@/lib/session";
import { GenericScreen } from "@/components/generic-screen";
import { useT } from "@/lib/i18n";

function RouteInner() {
  const role = useRole();
  const t = useT();
  if (role === "TEACHER") return <TeacherLeave />;
  if (role === "PRINCIPAL" || role === "ADMIN") return <LeaveDesk />;
  return <GenericScreen title={t("nav.leave")} />;
}

/** Not a tab for this role: "‹ Back" above the title. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more" unlessTab="leave">
      <RouteInner />
    </BackTo>
  );
}
