import { BackTo } from "@/components/back-to";
import { useRole } from "@/lib/session";
import { useT } from "@/lib/i18n";
import { GenericScreen } from "@/components/generic-screen";
import { FamilyAssignments } from "@/screens/family/assignments";
import { TeacherAssignments } from "@/screens/teacher/assignments";

function RouteInner() {
  const role = useRole();
  const t = useT();
  if (role === "PARENT" || role === "STUDENT") return <FamilyAssignments />;
  if (role === "TEACHER" || role === "ADMIN") return <TeacherAssignments />;
  return <GenericScreen title={t("nav.assignments")} />;
}

/** Not a tab for this role: "‹ Back" above the title. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more" unlessTab="assignments">
      <RouteInner />
    </BackTo>
  );
}
