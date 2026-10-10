import { BackTo } from "@/components/back-to";
import { ScholarshipClaimsScreen } from "@/screens/college-office/claims";

/** Not a tab: "‹ Back" above the title. The scholarship claims and their steps (the parity batch, 10 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <ScholarshipClaimsScreen />
    </BackTo>
  );
}
