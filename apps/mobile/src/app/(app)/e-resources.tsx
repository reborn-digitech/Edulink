import { BackTo } from "@/components/back-to";
import { EResourcesScreen } from "@/screens/library/e-resources";

/** Not a tab: "‹ Back" above the title. A college's e-resources, each opened through the app so the open counts (campaign 2026-10-04, G-3). */
export default function Route() {
  return (
    <BackTo fallback="/(app)">
      <EResourcesScreen />
    </BackTo>
  );
}
