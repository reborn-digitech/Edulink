import { useRole } from "@/lib/session";
import { useT } from "@/lib/i18n";
import { GenericScreen } from "@/components/generic-screen";
import { FamilyPractice } from "@/screens/family/practice";
import { TeacherPractice } from "@/screens/teacher/practice";

export default function Route() {
  const role = useRole();
  const t = useT();
  if (role === "PARENT" || role === "STUDENT") return <FamilyPractice />;
  if (role === "TEACHER") return <TeacherPractice />;
  return <GenericScreen title={t("nav.practice")} />;
}
