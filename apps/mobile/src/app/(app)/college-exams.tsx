import { BackTo } from "@/components/back-to";
import { CollegeExamsScreen } from "@/screens/exams/mine";

/** Not a tab: "‹ Back" above the title. A college student's exams, or a guardian's child's results (the exam cell, 4 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <CollegeExamsScreen />
    </BackTo>
  );
}
