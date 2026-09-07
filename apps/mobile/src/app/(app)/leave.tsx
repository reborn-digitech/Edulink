import { TeacherLeave } from "@/screens/teacher/leave";
import { LeaveDesk } from "@/screens/staff/leave";
import { useRole } from "@/lib/session";
import { GenericScreen } from "@/components/generic-screen";
import { useT } from "@/lib/i18n";

export default function Route() {
  const role = useRole();
  const t = useT();
  if (role === "TEACHER") return <TeacherLeave />;
  if (role === "PRINCIPAL" || role === "ADMIN") return <LeaveDesk />;
  return <GenericScreen title={t("nav.leave")} />;
}
