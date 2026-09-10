import { BackTo } from "@/components/back-to";
import { AvatarPicker } from "@/screens/shared/avatar-picker";

/** Not a tab: "‹ Back" above the title, to /(app)/profile when the app was opened straight onto it. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/profile">
      <AvatarPicker />
    </BackTo>
  );
}
