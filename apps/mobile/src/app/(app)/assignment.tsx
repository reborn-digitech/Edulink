import { BackTo } from "@/components/back-to";
import { AssignmentDetail } from "@/screens/teacher/assignment-detail";

/** Not a tab: "‹ Back" above the title, to /(app)/assignments when the app was opened straight onto it. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/assignments">
      <AssignmentDetail />
    </BackTo>
  );
}
