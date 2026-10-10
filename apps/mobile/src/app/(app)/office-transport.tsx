import { BackTo } from "@/components/back-to";
import { OfficeTransportScreen } from "@/screens/staff/office-college";

/** Not a tab: "‹ Back" above the title. Transport's routes and buses, read (the parity batch, 10 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <OfficeTransportScreen />
    </BackTo>
  );
}
