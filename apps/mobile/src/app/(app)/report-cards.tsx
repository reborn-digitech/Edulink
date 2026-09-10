import { BackTo } from "@/components/back-to";
import { ReportCardBuilder } from "@/screens/teacher/report-cards";

/** Not a tab: "‹ Back" above the title, to /(app)/exams when the app was opened straight onto it. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/exams">
      <ReportCardBuilder />
    </BackTo>
  );
}
