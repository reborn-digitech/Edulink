import { BackTo } from "@/components/back-to";
import { OperatorNewSchool } from "@/screens/operator/new-school";

/** Not a tab: "‹ Back" above the title, to /(app) when the app was opened straight onto it. */
export default function Route() {
  return (
    <BackTo fallback="/(app)">
      <OperatorNewSchool />
    </BackTo>
  );
}
