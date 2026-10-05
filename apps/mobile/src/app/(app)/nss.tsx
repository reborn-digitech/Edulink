import { BackTo } from "@/components/back-to";
import { CorpsScreen } from "@/screens/college/duty-desks";

/** Not a tab: "‹ Back" above the title. The NSS unit, for its programme officer and the office (5 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)">
      <CorpsScreen corps="NSS" />
    </BackTo>
  );
}
