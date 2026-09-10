import { BackTo } from "@/components/back-to";
import { Intake } from "@/screens/staff/intake";

/** Not a tab: "‹ Back" above the title, to /(app)/people when the app was opened straight onto it. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/people">
      <Intake />
    </BackTo>
  );
}
