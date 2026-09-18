import { BackTo } from "@/components/back-to";
import { FamilyHealth } from "@/screens/family/health";

/** Not a tab: "‹ Back" above the title. A child's health and emergency card, for the guardian. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <FamilyHealth />
    </BackTo>
  );
}
