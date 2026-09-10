import { BackTo } from "@/components/back-to";
import { useRole } from "@/lib/session";
import { useT } from "@/lib/i18n";
import { GenericScreen } from "@/components/generic-screen";
import { FamilyMeetings } from "@/screens/family/meetings";
import { TeacherMeetings } from "@/screens/teacher/meetings";

function RouteInner() {
  const role = useRole();
  const t = useT();
  if (role === "TEACHER") return <TeacherMeetings />;
  if (role === "PARENT" || role === "STUDENT") return <FamilyMeetings />;
  return <GenericScreen title={t("nav.meetings")} />;
}

/** Not a tab: "‹ Back" above the title. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <RouteInner />
    </BackTo>
  );
}
