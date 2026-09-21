import { BackTo } from "@/components/back-to";
import { FamilyApplication } from "@/screens/family/application";

/** Not a tab: "‹ Back" above the title, to the list when the app was opened straight onto it (a notification does). One of the guardian's applications. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/my-applications">
      <FamilyApplication />
    </BackTo>
  );
}
