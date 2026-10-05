import { BackTo } from "@/components/back-to";
import { LabDeskScreen } from "@/screens/college/duty-desks";

/** Not a tab: "‹ Back" above the title. The lab in-charge's desk, for a FACULTY or HOD holding LAB_INCHARGE and the office (5 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)">
      <LabDeskScreen />
    </BackTo>
  );
}
