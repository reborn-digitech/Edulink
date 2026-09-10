import { BackTo } from "@/components/back-to";
import { SchoolProfile } from "@/screens/shared/school-profile";

/** Not a tab: "‹ Back" above the title, to /(app)/explore when the app was opened straight onto it. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/explore">
      <SchoolProfile />
    </BackTo>
  );
}
