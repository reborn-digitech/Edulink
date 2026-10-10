import { BackTo } from "@/components/back-to";
import { Assistant } from "@/screens/shared/assistant";

/** Not a tab: "‹ Back" above the title. The assistant, from More (a conversation by its `id`). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <Assistant />
    </BackTo>
  );
}
