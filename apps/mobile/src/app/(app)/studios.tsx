import { BackTo } from "@/components/back-to";
import { FacultyStudiosScreen } from "@/screens/college/studios";

/** Not a tab: "‹ Back" above the title. An architecture college's studios and juries for a FACULTY or HOD, from More and the duty card (R-56, the studio half, 10 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <FacultyStudiosScreen />
    </BackTo>
  );
}
