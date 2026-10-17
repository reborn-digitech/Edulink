import { BackTo } from "@/components/back-to";
import { StaffWebsite } from "@/screens/staff/website";

/** Not a tab: "‹ Back" above the title. The school's website at a glance, read-only; editing is on the web (website-three, 17 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <StaffWebsite />
    </BackTo>
  );
}
