import { BackTo } from "@/components/back-to";
import { SquadRoundsScreen } from "@/screens/hostel/squad";

/** Not a tab: "‹ Back" above the title. The anti-ragging squad's rounds, logged here (the parity batch, 10 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <SquadRoundsScreen />
    </BackTo>
  );
}
