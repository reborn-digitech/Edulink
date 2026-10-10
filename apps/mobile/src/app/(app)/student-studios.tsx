import { BackTo } from "@/components/back-to";
import { StudentStudiosScreen } from "@/screens/college/studios";

/** Not a tab: "‹ Back" above the title. An architecture student's studios, stages, submissions and signed results, from More (R-56, the studio half, 10 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <StudentStudiosScreen />
    </BackTo>
  );
}
