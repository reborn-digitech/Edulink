import { BackTo } from "@/components/back-to";
import { LectureSubstitutionsScreen } from "@/screens/academics/substitutions";

/** Not a tab: "‹ Back" above the title. An HOD's lectures to cover and who stands in (5 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <LectureSubstitutionsScreen />
    </BackTo>
  );
}
