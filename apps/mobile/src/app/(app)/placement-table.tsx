import { BackTo } from "@/components/back-to";
import { PlacementTableScreen } from "@/screens/placement/analytics";

/** Not a tab: "‹ Back" above the title. The placement table for the season and three years, read (the parity batch, 10 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <PlacementTableScreen />
    </BackTo>
  );
}
