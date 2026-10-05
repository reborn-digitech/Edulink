import { BackTo } from "@/components/back-to";
import { TpoDriveScreen } from "@/screens/placement/tpo-drive";

/** Not a tab: "‹ Back" to the TPO's home. One drive: its applicants, the shortlist and each round's outcomes (5 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)">
      <TpoDriveScreen />
    </BackTo>
  );
}
