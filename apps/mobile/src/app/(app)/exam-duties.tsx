import { BackTo } from "@/components/back-to";
import { ExamDutiesScreen } from "@/screens/exams/duties";

/** Not a tab: "‹ Back" above the title. A faculty member's exam duties (the exam cell, 4 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <ExamDutiesScreen />
    </BackTo>
  );
}
