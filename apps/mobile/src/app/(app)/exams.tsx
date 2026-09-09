import { useRole } from "@/lib/session";
import { useT } from "@/lib/i18n";
import { GenericScreen } from "@/components/generic-screen";
import { FamilyExams } from "@/screens/family/exams";
import { TeacherExams } from "@/screens/teacher/exams";
import { AdminExams, PrincipalExams } from "@/screens/staff/exams";

export default function Route() {
  const role = useRole();
  const t = useT();
  if (role === "PARENT" || role === "STUDENT") return <FamilyExams />;
  if (role === "TEACHER") return <TeacherExams />;
  if (role === "ADMIN") return <AdminExams />;
  if (role === "PRINCIPAL") return <PrincipalExams />;
  return <GenericScreen title={t("nav.exams")} />;
}
