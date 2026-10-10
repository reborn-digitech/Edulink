import { BackTo } from "@/components/back-to";
import { ResearchRegisterScreen } from "@/screens/iqac/research";

/** Not a tab: "‹ Back" above the title. The research register, mine, the department's or the college's by role (the parity batch, 10 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <ResearchRegisterScreen />
    </BackTo>
  );
}
