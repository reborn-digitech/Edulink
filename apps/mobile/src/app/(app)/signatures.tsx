import { BackTo } from "@/components/back-to";
import { Signatures } from "@/screens/staff/signatures";

/** Not a tab: "‹ Back" above the title, to More when the app was opened straight onto it. The reader's signature, the seal, and the papers waiting. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <Signatures />
    </BackTo>
  );
}
