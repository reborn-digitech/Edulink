import { BackTo } from "@/components/back-to";
import { RecruiterDriveScreen } from "@/screens/placement/recruiter";

/** Not a tab: "‹ Back" to the recruiter's home. One live drive of the recruiter's company (the placement module, 4 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)">
      <RecruiterDriveScreen />
    </BackTo>
  );
}
