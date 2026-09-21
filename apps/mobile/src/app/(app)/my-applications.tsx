import { BackTo } from "@/components/back-to";
import { FamilyApplications } from "@/screens/family/applications";

/** Not a tab: "‹ Back" above the title. The guardian's applications, everywhere. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <FamilyApplications />
    </BackTo>
  );
}
