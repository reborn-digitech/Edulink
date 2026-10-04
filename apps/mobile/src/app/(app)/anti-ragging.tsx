import { BackTo } from "@/components/back-to";
import { AntiRaggingScreen } from "@/screens/college/duties";

/** Not a tab: "‹ Back" above the title. The anti-ragging register, for a member of the squad (5 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)">
      <AntiRaggingScreen />
    </BackTo>
  );
}
