import { useRole } from "@/lib/session";
import { useT } from "@/lib/i18n";
import { GenericScreen } from "@/components/generic-screen";
import { FamilyMeetings } from "@/screens/family/meetings";
import { TeacherMeetings } from "@/screens/teacher/meetings";

export default function Route() {
  const role = useRole();
  const t = useT();
  if (role === "TEACHER") return <TeacherMeetings />;
  if (role === "PARENT" || role === "STUDENT") return <FamilyMeetings />;
  return <GenericScreen title={t("nav.meetings")} />;
}
