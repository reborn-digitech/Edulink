import { BackTo } from "@/components/back-to";
import { ReportCardRules } from "@/screens/staff/report-card-rules";

/** Not a tab: "‹ Back" above the title, to More when the app was opened straight onto it. The school's report card rules. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <ReportCardRules />
    </BackTo>
  );
}
