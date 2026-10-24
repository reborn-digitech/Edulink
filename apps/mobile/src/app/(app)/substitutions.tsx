import { BackTo } from "@/components/back-to";
import { OfficeOnly } from "@/components/office-only";
import { Substitutions } from "@/screens/staff/substitutions";

/** Not a tab: "‹ Back" above the title. The substitution board for a day, for the office and the head. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <OfficeOnly own={{ TEACHER: "/(app)/my-covers" }}>
        <Substitutions />
      </OfficeOnly>
    </BackTo>
  );
}
