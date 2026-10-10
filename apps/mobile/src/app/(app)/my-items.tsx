import { BackTo } from "@/components/back-to";
import { MyItemsScreen } from "@/screens/shared/my-items";

/** Not a tab: "‹ Back" above the title. Things issued to me and the assets in my care (the parity batch, 10 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <MyItemsScreen />
    </BackTo>
  );
}
