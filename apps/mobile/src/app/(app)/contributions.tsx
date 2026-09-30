import { BackTo } from "@/components/back-to";
import { useRole } from "@/lib/session";
import { useT } from "@/lib/i18n";
import { GenericScreen } from "@/components/generic-screen";
import { TeacherContributions } from "@/screens/teacher/contributions";

/** A teacher's questions for the practice bank (gigs): what they have sent, what it earned, where they are paid. */
function RouteInner() {
  const role = useRole();
  const t = useT();
  if (role === "TEACHER") return <TeacherContributions />;
  return <GenericScreen title={t("nav.contributions")} />;
}

/** Not a tab: "‹ Back" above the title. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <RouteInner />
    </BackTo>
  );
}
