import { BackTo } from "@/components/back-to";
import { StudentAccountScreen } from "@/screens/college-office/student-account";

/** Not a tab: "‹ Back" above the title. An adult student's own account: grants, two-step sign-in, no-dues (4 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)">
      <StudentAccountScreen />
    </BackTo>
  );
}
