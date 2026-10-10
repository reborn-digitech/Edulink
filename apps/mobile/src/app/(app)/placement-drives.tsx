import { BackTo } from "@/components/back-to";
import { TpoDrivesScreen } from "@/screens/placement/tpo-drives";

/** Not a tab: "‹ Back" above the title. The cell's drives, the live ones first (the parity batch, 10 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)">
      <TpoDrivesScreen />
    </BackTo>
  );
}
