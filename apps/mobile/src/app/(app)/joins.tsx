import { BackTo } from "@/components/back-to";
import { Joins } from "@/screens/shared/joins";

/** Not a tab: "‹ Back" above the title. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <Joins />
    </BackTo>
  );
}
