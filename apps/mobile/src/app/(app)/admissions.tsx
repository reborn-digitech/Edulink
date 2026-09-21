import { BackTo } from "@/components/back-to";
import { StaffAdmissions } from "@/screens/staff/admissions";

/** Not a tab: "‹ Back" above the title. The office's admission cycles with their seats, their status and the door to the pipeline. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <StaffAdmissions />
    </BackTo>
  );
}
