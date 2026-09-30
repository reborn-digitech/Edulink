import { BackTo } from "@/components/back-to";
import { useRole } from "@/lib/session";
import { useT } from "@/lib/i18n";
import { GenericScreen } from "@/components/generic-screen";
import { TeacherContribution } from "@/screens/teacher/contribution";

/** One question for the bank: a new one, or (with ?id=) one the teacher has sent. */
function RouteInner() {
  const role = useRole();
  const t = useT();
  if (role === "TEACHER") return <TeacherContribution />;
  return <GenericScreen title={t("nav.contributions")} />;
}

/** Not a tab: "‹ Back" above the title. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/contributions">
      <RouteInner />
    </BackTo>
  );
}
