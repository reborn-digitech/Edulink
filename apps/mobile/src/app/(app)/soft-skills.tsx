import { BackTo } from "@/components/back-to";
import { SoftSkillsScreen } from "@/screens/placement/soft-skills";

/** Not a tab: "‹ Back" to the home. Soft-skills training: a student's enrolment, the TPO's session marks (R-2, 5 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)">
      <SoftSkillsScreen />
    </BackTo>
  );
}
