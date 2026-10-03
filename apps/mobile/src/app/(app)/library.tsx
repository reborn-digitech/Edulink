import { BackTo } from "@/components/back-to";
import { MyLibraryScreen } from "@/screens/library/mine";

/** Not a tab: "‹ Back" above the title. A member's own library — a pupil's, a teacher's, or a guardian's child's (the library module, 3 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <MyLibraryScreen />
    </BackTo>
  );
}
