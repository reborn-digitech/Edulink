import { BackTo } from "@/components/back-to";
import { ApplicationNew } from "@/screens/staff/application-new";

/** Not a tab: "‹ Back" above the title, to the pipeline when the app was opened straight onto it. A walk-in family's application. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/applications">
      <ApplicationNew />
    </BackTo>
  );
}
