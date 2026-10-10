import { BackTo } from "@/components/back-to";
import { TpoStudentsScreen } from "@/screens/placement/tpo-students";

/** Not a tab: "‹ Back" above the title. The placement roll with each student's record and the dream flag (the parity batch, 10 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)">
      <TpoStudentsScreen />
    </BackTo>
  );
}
