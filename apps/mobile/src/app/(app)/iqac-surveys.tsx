import { BackTo } from "@/components/back-to";
import { SurveysDeskScreen } from "@/screens/iqac/surveys";

/** Not a tab: "‹ Back" above the title. The college's surveys, their aggregates and the close (the parity batch, 10 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <SurveysDeskScreen />
    </BackTo>
  );
}
