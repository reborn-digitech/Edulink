import { BackTo } from "@/components/back-to";
import { PracticalsScreen } from "@/screens/college/duty-desks";

/** Not a tab: "‹ Back" above the title. The practical record of a course with practicals, kept and signed by its teacher (5 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)">
      <PracticalsScreen />
    </BackTo>
  );
}
