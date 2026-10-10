import { BackTo } from "@/components/back-to";
import { ExpulsionsScreen } from "@/screens/hostel/expulsions";

/** Not a tab: "‹ Back" above the title. Hostel expulsions: proposed, withdrawn, decided (the parity batch, 10 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <ExpulsionsScreen />
    </BackTo>
  );
}
