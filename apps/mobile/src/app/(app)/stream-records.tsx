import { BackTo } from "@/components/back-to";
import { StreamRecordsScreen } from "@/screens/college/stream-records";

/** Not a tab: "‹ Back" above the title. The year's stream records for the office and the head, read (the parity batch, 10 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <StreamRecordsScreen />
    </BackTo>
  );
}
