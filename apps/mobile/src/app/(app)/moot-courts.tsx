import { BackTo } from "@/components/back-to";
import { MootCourtsScreen } from "@/screens/college/moot-courts";

/** Not a tab: "‹ Back" above the title. A law college's moot courts, for FACULTY and HOD from More (A3-inventory-4, audit of 5 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <MootCourtsScreen />
    </BackTo>
  );
}
