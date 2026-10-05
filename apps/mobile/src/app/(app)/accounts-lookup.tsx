import { BackTo } from "@/components/back-to";
import { AccountsLookupScreen } from "@/screens/college-office/lookup";

/** Not a tab: "‹ Back" above the title. The accounts desk's look-up of a student by PRN (5 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)">
      <AccountsLookupScreen />
    </BackTo>
  );
}
