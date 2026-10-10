import { BackTo } from "@/components/back-to";
import { ClinicalDeskScreen } from "@/screens/college/clinical";

/** Not a tab: "‹ Back" above the title. The clinical desk, for the coordinator, the office and the head, and a supervising teacher's own side (R-56, 10 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)">
      <ClinicalDeskScreen />
    </BackTo>
  );
}
