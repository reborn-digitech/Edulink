import { BackTo } from "@/components/back-to";
import { PostDetail } from "@/screens/family/post-detail";

/** Not a tab: "‹ Back" above the title, to /(app)/bulletin when the app was opened straight onto it. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/bulletin">
      <PostDetail />
    </BackTo>
  );
}
