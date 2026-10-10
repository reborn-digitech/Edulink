import { BackTo } from "@/components/back-to";
import { IqacHome } from "@/screens/iqac/home";

/** Not a tab: "‹ Back" above the title. The IQAC desk at a glance, for the office and the head (the parity batch, 10 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <IqacHome />
    </BackTo>
  );
}
