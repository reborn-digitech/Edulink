import { BackTo } from "@/components/back-to";
import { StudentPlacementScreen } from "@/screens/placement/student";

/** Not a tab: "‹ Back" above the title. A student's placement — drives, offers, internships, practice (the placement module, 4 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <StudentPlacementScreen />
    </BackTo>
  );
}
