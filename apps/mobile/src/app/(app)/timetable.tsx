import { useRole } from "@/lib/session";
import { useT } from "@/lib/i18n";
import { GenericScreen } from "@/components/generic-screen";
import { FamilyTimetable } from "@/screens/family/timetable";
import { TeacherTimetable } from "@/screens/teacher/timetable";
import { StaffTimetable } from "@/screens/staff/timetable";

export default function Route() {
  const role = useRole();
  const t = useT();
  if (role === "PARENT" || role === "STUDENT") return <FamilyTimetable />;
  if (role === "TEACHER") return <TeacherTimetable />;
  if (role === "ADMIN" || role === "PRINCIPAL") return <StaffTimetable />;
  return <GenericScreen title={t("nav.timetable")} />;
}
