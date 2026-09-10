import { BackTo } from "@/components/back-to";
import { useRole } from "@/lib/session";
import { useT } from "@/lib/i18n";
import { GenericScreen } from "@/components/generic-screen";
import { FamilyExams } from "@/screens/family/exams";
import { TeacherExams } from "@/screens/teacher/exams";
import { AdminExams, PrincipalExams } from "@/screens/staff/exams";

function RouteInner() {
  const role = useRole();
  const t = useT();
  if (role === "PARENT" || role === "STUDENT") return <FamilyExams />;
  if (role === "TEACHER") return <TeacherExams />;
  if (role === "ADMIN") return <AdminExams />;
  if (role === "PRINCIPAL") return <PrincipalExams />;
  return <GenericScreen title={t("nav.exams")} />;
}

/** Not a tab: "‹ Back" above the title. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <RouteInner />
    </BackTo>
  );
}
