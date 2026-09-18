import { BackTo } from "@/components/back-to";
import { MessagingNew } from "@/screens/staff/messaging-new";

/** Not a tab: "‹ Back" above the title, to the messaging overview when the app was opened straight onto it. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/messaging">
      <MessagingNew />
    </BackTo>
  );
}
