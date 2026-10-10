import { BackTo } from "@/components/back-to";
import { FacultyRecordsScreen } from "@/screens/iqac/faculty-records";

/** Not a tab: "‹ Back" above the title. Every teacher's record, read (the parity batch, 10 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <FacultyRecordsScreen />
    </BackTo>
  );
}
