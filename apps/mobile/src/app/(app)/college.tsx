import { BackTo } from "@/components/back-to";
import { CollegeGlanceScreen } from "@/screens/college/glance";

/** Not a tab: "‹ Back" above the title. The college at a glance and the approvals waiting (the web's /principal/college). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <CollegeGlanceScreen />
    </BackTo>
  );
}
