import { BackTo } from "@/components/back-to";
import { ExamAfterScreen } from "@/screens/exams/after";

/** Not a tab: "‹ Back" above the title. After results: the revaluations to decide and the open backlogs (the parity batch, 10 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)">
      <ExamAfterScreen />
    </BackTo>
  );
}
