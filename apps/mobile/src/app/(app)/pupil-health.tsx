import { BackTo } from "@/components/back-to";
import { PupilHealth } from "@/screens/staff/pupil-health";

/** Not a tab: "‹ Back" above the title, to the classes when the app was opened straight onto it. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/classes">
      <PupilHealth />
    </BackTo>
  );
}
