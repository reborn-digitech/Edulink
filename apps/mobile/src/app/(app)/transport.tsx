import { BackTo } from "@/components/back-to";
import { FamilyTransport } from "@/screens/family/transport";

/** Not a tab: "‹ Back" above the title. A child's bus for the guardian, or the pupil's own. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <FamilyTransport />
    </BackTo>
  );
}
