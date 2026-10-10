import { BackTo } from "@/components/back-to";
import { OfficeAcademicsScreen } from "@/screens/staff/office-college";

/** Not a tab: "‹ Back" above the title. A college's departments, programmes and terms, read (the parity batch, 10 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <OfficeAcademicsScreen />
    </BackTo>
  );
}
