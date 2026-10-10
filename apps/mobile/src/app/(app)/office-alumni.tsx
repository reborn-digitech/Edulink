import { BackTo } from "@/components/back-to";
import { OfficeAlumniScreen } from "@/screens/staff/office-college";

/** Not a tab: "‹ Back" above the title. The alumni by batch, read (the parity batch, 10 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <OfficeAlumniScreen />
    </BackTo>
  );
}
