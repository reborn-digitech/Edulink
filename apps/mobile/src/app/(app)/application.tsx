import { BackTo } from "@/components/back-to";
import { StaffApplication } from "@/screens/staff/application";

/** Not a tab: "‹ Back" above the title, to the pipeline when the app was opened straight onto it (a notification does). One application as the office sees it. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/applications">
      <StaffApplication />
    </BackTo>
  );
}
