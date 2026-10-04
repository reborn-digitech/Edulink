import { BackTo } from "@/components/back-to";
import { StudentScholarshipsScreen } from "@/screens/college-office/scholarships";

/** Not a tab: "‹ Back" above the title. A college student's scholarship claims and the schemes open to them (4 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)">
      <StudentScholarshipsScreen />
    </BackTo>
  );
}
