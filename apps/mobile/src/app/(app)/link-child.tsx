import { BackTo } from "@/components/back-to";
import { LinkChild } from "@/screens/family/link-child";

/** Not a tab: "‹ Back" above the title, to /(app)/settings when the app was opened straight onto it. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/settings">
      <LinkChild />
    </BackTo>
  );
}
