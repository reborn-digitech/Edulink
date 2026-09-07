import { TeacherClasses } from "@/screens/teacher/classes";
import { StaffClasses } from "@/screens/staff/classes";
import { useRole } from "@/lib/session";
import { GenericScreen } from "@/components/generic-screen";
import { useT } from "@/lib/i18n";

export default function Route() {
  const role = useRole();
  const t = useT();
  if (role === "TEACHER") return <TeacherClasses />;
  if (role === "PRINCIPAL" || role === "ADMIN") return <StaffClasses />;
  return <GenericScreen title={t("nav.classes")} />;
}
