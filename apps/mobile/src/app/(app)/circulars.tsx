import { BackTo } from "@/components/back-to";
import { StaffCirculars } from "@/screens/staff/circulars";

/** Not a tab: "‹ Back" above the title. Every circular of the school with its reach, for the office and the head. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <StaffCirculars />
    </BackTo>
  );
}
