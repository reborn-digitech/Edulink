import { BackTo } from "@/components/back-to";
import { MentoringScreen } from "@/screens/academics/mentoring";

/** A faculty member's tab; for an HOD a More entry with "‹ Back" above the title. A mentor's groups and notes (the college's academics, 4 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more" unlessTab="academics-mentoring">
      <MentoringScreen />
    </BackTo>
  );
}
