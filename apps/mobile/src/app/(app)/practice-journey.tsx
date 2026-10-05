import { BackTo } from "@/components/back-to";
import { PracticeJourney } from "@/screens/practice/journey";

/** Not a tab: "‹ Back" above the title. The pupil's own journey, from Practice (A3-inventory-14, risks batch 5 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/practice">
      <PracticeJourney />
    </BackTo>
  );
}
