import { BackTo } from "@/components/back-to";
import { AccountsHomeScreen } from "@/screens/college-office/accounts-home";

/** Not a tab: "‹ Back" above the title. The accounts desk at a glance, for the office and the head (the parity batch, 10 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <AccountsHomeScreen />
    </BackTo>
  );
}
