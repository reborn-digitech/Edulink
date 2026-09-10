import { BackTo } from "@/components/back-to";
import { useRole } from "@/lib/session";
import { ReviewDesk } from "@/screens/staff/reviews";
import { FamilyFeedback } from "@/screens/family/feedback";

/** The office runs the rounds (the web's /admin/reviews); a pupil or guardian answers them (/reviews). */
function RouteInner() {
  const role = useRole();
  if (role === "STUDENT" || role === "PARENT") return <FamilyFeedback />;
  return <ReviewDesk />;
}

/** Not a tab: "‹ Back" above the title. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <RouteInner />
    </BackTo>
  );
}
