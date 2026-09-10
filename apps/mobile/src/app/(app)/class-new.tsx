import { BackTo } from "@/components/back-to";
import { ClassNew } from "@/screens/staff/class-new";

/** Not a tab: "‹ Back" above the title, to /(app)/classes when the app was opened straight onto it. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/classes">
      <ClassNew />
    </BackTo>
  );
}
