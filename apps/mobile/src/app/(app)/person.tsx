import { BackTo } from "@/components/back-to";
import { Person } from "@/screens/staff/person";

/** Not a tab: "‹ Back" above the title, to the directory when the app was opened straight onto it. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/people">
      <Person />
    </BackTo>
  );
}
