import { BackTo } from "@/components/back-to";
import { Substitutions } from "@/screens/staff/substitutions";

/** Not a tab: "‹ Back" above the title. The substitution board for a day, for the office and the head. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <Substitutions />
    </BackTo>
  );
}
