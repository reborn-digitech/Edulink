import { useRole } from "@/lib/session";
import { useT } from "@/lib/i18n";
import { GenericScreen } from "@/components/generic-screen";
import { FamilyAssignments } from "@/screens/family/assignments";
import { TeacherAssignments } from "@/screens/teacher/assignments";

export default function Route() {
  const role = useRole();
  const t = useT();
  if (role === "PARENT" || role === "STUDENT") return <FamilyAssignments />;
  if (role === "TEACHER" || role === "ADMIN") return <TeacherAssignments />;
  return <GenericScreen title={t("nav.assignments")} />;
}
