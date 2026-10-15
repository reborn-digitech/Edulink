import { BackTo } from "@/components/back-to";
import { useRole, useSession } from "@/lib/session";
import { featuresOf } from "@/lib/nav";
import { useT } from "@/lib/i18n";
import { GenericScreen } from "@/components/generic-screen";
import { TeacherContribution } from "@/screens/teacher/contribution";

/** One question for the bank: a new one, or (with ?id=) one the teacher has sent. */
function RouteInner() {
  const role = useRole();
  const session = useSession();
  const t = useT();
  // The generic screen while the QUESTION_GIG platform feature is off (15 Oct 2026; /me's `features`, review-queue before it).
  const gigOn = featuresOf(session.status === "signed-in" ? session.me : null).includes("QUESTION_GIG");
  if (role === "TEACHER" && gigOn) return <TeacherContribution />;
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
