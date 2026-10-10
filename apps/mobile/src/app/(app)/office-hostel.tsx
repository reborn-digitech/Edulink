import { BackTo } from "@/components/back-to";
import { OfficeHostelScreen } from "@/screens/staff/office-college";

/** Not a tab: "‹ Back" above the title. The hostel at a glance, read (the parity batch, 10 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <OfficeHostelScreen />
    </BackTo>
  );
}
