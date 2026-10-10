import { BackTo } from "@/components/back-to";
import { OfficeAdmissionsScreen } from "@/screens/staff/office-college";

/** Not a tab: "‹ Back" above the title. A college's admission rounds, read (the parity batch, 10 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <OfficeAdmissionsScreen />
    </BackTo>
  );
}
