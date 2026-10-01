import { BackTo } from "@/components/back-to";
import { Search } from "@/screens/shared/search";

/** Not a tab: "‹ Back" above the title, to the More sheet when the app was opened straight onto it. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <Search />
    </BackTo>
  );
}
