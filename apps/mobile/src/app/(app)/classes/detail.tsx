import { BackTo } from "@/components/back-to";
import { TeacherClassDetail } from "@/screens/teacher/class-detail";
import { StaffClassDetail } from "@/screens/staff/class-detail";
import { useRole } from "@/lib/session";
import { GenericScreen } from "@/components/generic-screen";
import { useT } from "@/lib/i18n";

function RouteInner() {
  const role = useRole();
  const t = useT();
  if (role === "TEACHER") return <TeacherClassDetail />;
  if (role === "PRINCIPAL" || role === "ADMIN") return <StaffClassDetail />;
  return <GenericScreen title={t("nav.classes")} />;
}

/** Not a tab: "‹ Back" above the title. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/classes">
      <RouteInner />
    </BackTo>
  );
}
