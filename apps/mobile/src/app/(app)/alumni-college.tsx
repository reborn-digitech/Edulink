import { BackTo } from "@/components/back-to";
import { AlumniCollegeScreen } from "@/screens/alumni/college";

/** Not a tab: "‹ Back" above the title. A college alumnus's mentoring, referrals, meets and gifts (5 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <AlumniCollegeScreen />
    </BackTo>
  );
}
