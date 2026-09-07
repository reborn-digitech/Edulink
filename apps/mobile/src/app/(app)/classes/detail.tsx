import { TeacherClassDetail } from "@/screens/teacher/class-detail";
import { StaffClassDetail } from "@/screens/staff/class-detail";
import { useRole } from "@/lib/session";
import { GenericScreen } from "@/components/generic-screen";
import { useT } from "@/lib/i18n";

export default function Route() {
  const role = useRole();
  const t = useT();
  if (role === "TEACHER") return <TeacherClassDetail />;
  if (role === "PRINCIPAL" || role === "ADMIN") return <StaffClassDetail />;
  return <GenericScreen title={t("nav.classes")} />;
}
