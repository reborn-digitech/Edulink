import { BackTo } from "@/components/back-to";
import { Account } from "@/screens/shared/account";

/** Not a tab: "‹ Back" above the title, to /(app)/more when the app was opened straight onto it. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <Account />
    </BackTo>
  );
}
