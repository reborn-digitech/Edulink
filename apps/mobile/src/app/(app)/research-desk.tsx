import { BackTo } from "@/components/back-to";
import { ResearchDeskScreen } from "@/screens/college/duty-desks";

/** Not a tab: "‹ Back" above the title. The research dean's read of the research register (5 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)">
      <ResearchDeskScreen />
    </BackTo>
  );
}
