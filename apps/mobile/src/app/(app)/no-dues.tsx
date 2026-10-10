import { BackTo } from "@/components/back-to";
import { NoDuesDeskScreen } from "@/screens/college-office/no-dues";

/** Not a tab: "‹ Back" above the title. The no-dues queue for an event and a desk's own line to clear (the parity batch, 10 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <NoDuesDeskScreen />
    </BackTo>
  );
}
