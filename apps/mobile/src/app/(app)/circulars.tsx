import { BackTo } from "@/components/back-to";
import { OfficeOnly } from "@/components/office-only";
import { StaffCirculars } from "@/screens/staff/circulars";

/** Not a tab: "‹ Back" above the title. Every circular of the school with its reach, for the office and the head. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <OfficeOnly>
        <StaffCirculars />
      </OfficeOnly>
    </BackTo>
  );
}
