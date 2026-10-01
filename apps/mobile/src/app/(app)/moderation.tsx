import { BackTo } from "@/components/back-to";
import { PlatformModeration } from "@/screens/operator/moderation";

/** Not a tab: "‹ Back" above the title, to the content team's console when the app was opened straight onto it. The platform's moderation of the global feed. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/appadmin">
      <PlatformModeration />
    </BackTo>
  );
}
