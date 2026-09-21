import { BackTo } from "@/components/back-to";
import { FamilyRecord } from "@/screens/family/record";

/** Not a tab: "‹ Back" above the title. The pupil record the family fills in for a certificate. */
export default function Route() {
  return (
    <BackTo fallback="/(app)">
      <FamilyRecord />
    </BackTo>
  );
}
