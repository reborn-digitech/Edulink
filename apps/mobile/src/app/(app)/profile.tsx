import { BackTo } from "@/components/back-to";
import { useRole } from "@/lib/session";
import { useT } from "@/lib/i18n";
import { GenericScreen } from "@/components/generic-screen";
import { TeacherProfile } from "@/screens/teacher/profile";
import { StudentProfile } from "@/screens/family/student-profile";
import { ExpertProfile } from "@/screens/expert/profile";

/** "Me": the web's /teacher/profile, /student/profile and /expert/profile. */
function RouteInner() {
  const role = useRole();
  const t = useT();
  if (role === "TEACHER") return <TeacherProfile />;
  if (role === "STUDENT") return <StudentProfile />;
  if (role === "EXPERT") return <ExpertProfile />;
  return <GenericScreen title={t("nav.me")} />;
}

/** Not a tab: "‹ Back" above the title. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <RouteInner />
    </BackTo>
  );
}
