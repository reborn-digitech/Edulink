import { BackTo } from "@/components/back-to";
import { ExamSessionScreen } from "@/screens/exams/session";

/** Not a tab: "‹ Back" above the title. One exam session: the forms waiting, the runs to publish, the step on (the parity batch, 10 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)">
      <ExamSessionScreen />
    </BackTo>
  );
}
