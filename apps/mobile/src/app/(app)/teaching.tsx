import { BackTo } from "@/components/back-to";
import { FacultyHomeScreen } from "@/screens/academics/faculty";

/** An HOD's tab (no "‹ Back" for a tab). An HOD's own teaching — the faculty member's day (the college's academics, 4 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)" unlessTab="teaching">
      <FacultyHomeScreen asTeaching />
    </BackTo>
  );
}
