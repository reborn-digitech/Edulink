import { BackTo } from "@/components/back-to";
import { OperatorSchool } from "@/screens/operator/school";

/** Not a tab: "‹ Back" above the title, to /(app) when the app was opened straight onto it. */
export default function Route() {
  return (
    <BackTo fallback="/(app)">
      <OperatorSchool />
    </BackTo>
  );
}
