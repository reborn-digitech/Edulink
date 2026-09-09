import { useRole } from "@/lib/session";
import { ReviewDesk } from "@/screens/staff/reviews";
import { FamilyFeedback } from "@/screens/family/feedback";

/** The office runs the rounds (the web's /admin/reviews); a pupil or guardian answers them (/reviews). */
export default function Route() {
  const role = useRole();
  if (role === "STUDENT" || role === "PARENT") return <FamilyFeedback />;
  return <ReviewDesk />;
}
