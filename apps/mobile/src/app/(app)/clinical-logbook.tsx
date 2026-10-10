import { BackTo } from "@/components/back-to";
import { ClinicalLogbookScreen } from "@/screens/college/clinical";

/** Not a tab: "‹ Back" above the title. A health-sciences or pharmacy student's clinical logbook (R-56, 10 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)">
      <ClinicalLogbookScreen />
    </BackTo>
  );
}
