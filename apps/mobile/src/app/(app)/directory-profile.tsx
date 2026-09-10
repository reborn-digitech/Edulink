import { BackTo } from "@/components/back-to";
import { SchoolDirectoryProfile } from "@/screens/staff/directory-profile";

/** Not a tab: "‹ Back" above the title, to /(app)/settings when the app was opened straight onto it. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/settings">
      <SchoolDirectoryProfile />
    </BackTo>
  );
}
