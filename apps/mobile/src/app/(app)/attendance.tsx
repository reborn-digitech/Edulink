import { Register } from "@/screens/teacher/register";
import { FamilyAttendance } from "@/screens/family/attendance";
import { useRole } from "@/lib/session";
import { GenericScreen } from "@/components/generic-screen";
import { useT } from "@/lib/i18n";

export default function Route() {
  const role = useRole();
  const t = useT();
  if (role === "TEACHER" || role === "ADMIN") return <Register />;
  if (role === "PARENT" || role === "STUDENT") return <FamilyAttendance />;
  return <GenericScreen title={t("nav.attendance")} />;
}
