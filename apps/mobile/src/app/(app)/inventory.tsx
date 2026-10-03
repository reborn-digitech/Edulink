import { BackTo } from "@/components/back-to";
import { StaffInventory } from "@/screens/staff/inventory";

/** Not a tab: "‹ Back" above the title. Inventory and assets, read-only, for the office and the head. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <StaffInventory />
    </BackTo>
  );
}
