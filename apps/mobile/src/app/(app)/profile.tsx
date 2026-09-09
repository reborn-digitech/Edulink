import { useRole } from "@/lib/session";
import { useT } from "@/lib/i18n";
import { GenericScreen } from "@/components/generic-screen";
import { TeacherProfile } from "@/screens/teacher/profile";
import { StudentProfile } from "@/screens/family/student-profile";
import { ExpertProfile } from "@/screens/expert/profile";

/** "Me": the web's /teacher/profile, /student/profile and /expert/profile. */
export default function Route() {
  const role = useRole();
  const t = useT();
  if (role === "TEACHER") return <TeacherProfile />;
  if (role === "STUDENT") return <StudentProfile />;
  if (role === "EXPERT") return <ExpertProfile />;
  return <GenericScreen title={t("nav.me")} />;
}
