import { BackTo } from "@/components/back-to";
import { SupervisionScreen } from "@/screens/placement/supervision";

/** Not a tab: "‹ Back" above the title. Internships to approve and evaluate and projects to review, by role (the parity batch, 10 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <SupervisionScreen />
    </BackTo>
  );
}
