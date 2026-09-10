import { BackTo } from "@/components/back-to";
import { QuestionBank } from "@/screens/operator/question-bank";

/** Not a tab: "‹ Back" above the title, to /(app) when the app was opened straight onto it. */
export default function Route() {
  return (
    <BackTo fallback="/(app)">
      <QuestionBank />
    </BackTo>
  );
}
