import { BackTo } from "@/components/back-to";
import { ClassAnalytics } from "@/screens/teacher/class-analytics";

/** Not a tab: "‹ Back" above the title. A class as numbers, recomputed on every read. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/classes">
      <ClassAnalytics />
    </BackTo>
  );
}
