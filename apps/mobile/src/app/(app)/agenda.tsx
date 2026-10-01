import { BackTo } from "@/components/back-to";
import { FamilyAgenda } from "@/screens/family/agenda";

/** Not a tab: "‹ Back" above the title. The fortnight ahead for a pupil, or a guardian's child. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <FamilyAgenda />
    </BackTo>
  );
}
