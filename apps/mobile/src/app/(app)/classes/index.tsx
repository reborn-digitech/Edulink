import { BackTo } from "@/components/back-to";
import { TeacherClasses } from "@/screens/teacher/classes";
import { StaffClasses } from "@/screens/staff/classes";
import { useRole } from "@/lib/session";
import { GenericScreen } from "@/components/generic-screen";
import { useT } from "@/lib/i18n";

function RouteInner() {
  const role = useRole();
  const t = useT();
  if (role === "TEACHER") return <TeacherClasses />;
  if (role === "PRINCIPAL" || role === "ADMIN") return <StaffClasses />;
  return <GenericScreen title={t("nav.classes")} />;
}

/** Not a tab for this role: "‹ Back" above the title. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more" unlessTab="classes">
      <RouteInner />
    </BackTo>
  );
}
