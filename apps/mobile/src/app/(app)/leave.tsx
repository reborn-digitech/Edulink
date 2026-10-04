import { BackTo } from "@/components/back-to";
import { TeacherLeave } from "@/screens/teacher/leave";
import { LeaveDesk } from "@/screens/staff/leave";
import { useRole } from "@/lib/session";
import { GenericScreen } from "@/components/generic-screen";
import { useT } from "@/lib/i18n";

/**
 * Whose own leave this screen is: every role GET/POST /api/v1/staff/leave names but the head's desk —
 * the teacher, and since the integration (4 Oct 2026) the module staff and the college's six staff roles.
 */
const OWN_LEAVE: readonly string[] = ["TEACHER", "DRIVER", "LIBRARIAN", "WARDEN", "FACULTY", "HOD", "EXAM_CONTROLLER", "IQAC", "TPO", "ACCOUNTS"];

function RouteInner() {
  const role = useRole();
  const t = useT();
  if (role && OWN_LEAVE.includes(role)) return <TeacherLeave />;
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
