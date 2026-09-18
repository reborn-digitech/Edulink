import { BackTo } from "@/components/back-to";
import { MyCovers } from "@/screens/teacher/my-covers";

/** Not a tab: "‹ Back" above the title. The lessons a member of staff is covering on a day. */
export default function Route() {
  return (
    <BackTo fallback="/(app)">
      <MyCovers />
    </BackTo>
  );
}
