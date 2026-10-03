import { BackTo } from "@/components/back-to";
import { FamilyHostelScreen } from "@/screens/hostel/family";

/** Not a tab: "‹ Back" above the title. A boarder's hostel, for the pupil or a guardian (the hostel module, 3 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <FamilyHostelScreen />
    </BackTo>
  );
}
