import { BackTo } from "@/components/back-to";
import { TpoHome } from "@/screens/placement/tpo";

/** Not a tab: "‹ Back" above the title. The placement cell at a glance, for the office and the head (the parity batch, 10 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <TpoHome />
    </BackTo>
  );
}
