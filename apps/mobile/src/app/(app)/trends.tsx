import { BackTo } from "@/components/back-to";
import { StaffTrends } from "@/screens/staff/trends";

/** Not a tab: "‹ Back" above the title. The school across terms and years, recomputed on every read. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <StaffTrends />
    </BackTo>
  );
}
