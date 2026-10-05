import { BackTo } from "@/components/back-to";
import { ExamSquadScreen } from "@/screens/college/duty-desks";

/** Not a tab: "‹ Back" above the title. The exam flying squad's desk, for a member of the squad, the office and the exam controller (5 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)">
      <ExamSquadScreen />
    </BackTo>
  );
}
