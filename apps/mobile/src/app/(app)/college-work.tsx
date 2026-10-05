import { BackTo } from "@/components/back-to";
import { CollegeWorkScreen } from "@/screens/academics/college-work";

/** Not a tab: "‹ Back" above the title. Homework at a college, for FACULTY and HOD from More (R-48, risks batch 5 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <CollegeWorkScreen />
    </BackTo>
  );
}
