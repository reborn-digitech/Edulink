import { BackTo } from "@/components/back-to";
import { FamilyIncidents } from "@/screens/family/incidents";

/** Not a tab: "‹ Back" above the title. A child's incidents and sick-room visits, for the guardian. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <FamilyIncidents />
    </BackTo>
  );
}
