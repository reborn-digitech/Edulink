import { BackTo } from "@/components/back-to";
import { InvitePeople } from "@/screens/staff/invites";

/** Not a tab: "‹ Back" above the title, to /(app)/people when the app was opened straight onto it. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/people">
      <InvitePeople />
    </BackTo>
  );
}
