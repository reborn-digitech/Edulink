import { BackTo } from "@/components/back-to";
import { Apply } from "@/screens/family/apply";

/** Not a tab: "‹ Back" above the title, to the directory when the app was opened straight onto it. Apply to a school's open cycle. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/explore">
      <Apply />
    </BackTo>
  );
}
