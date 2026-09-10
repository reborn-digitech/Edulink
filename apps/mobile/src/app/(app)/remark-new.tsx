import { BackTo } from "@/components/back-to";
import { RemarkNew } from "@/screens/shared/remark-new";

/** Not a tab: "‹ Back" above the title, to /(app)/messages when the app was opened straight onto it. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/messages">
      <RemarkNew />
    </BackTo>
  );
}
