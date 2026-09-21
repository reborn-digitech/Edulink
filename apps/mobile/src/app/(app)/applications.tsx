import { BackTo } from "@/components/back-to";
import { StaffApplications } from "@/screens/staff/applications";

/** Not a tab: "‹ Back" above the title, to the cycles when the app was opened straight onto it. The office's pipeline of applications. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/admissions">
      <StaffApplications />
    </BackTo>
  );
}
