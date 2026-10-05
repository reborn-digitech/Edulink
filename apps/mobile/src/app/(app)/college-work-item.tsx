import { BackTo } from "@/components/back-to";
import { CollegeWorkItemScreen } from "@/screens/academics/college-work-item";

/** Not a tab: "‹ Back" above the title, to the college's homework when the app was opened straight onto it (R-48). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/college-work">
      <CollegeWorkItemScreen />
    </BackTo>
  );
}
