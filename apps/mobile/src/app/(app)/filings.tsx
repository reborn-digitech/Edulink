import { BackTo } from "@/components/back-to";
import { Filings } from "@/screens/staff/filings";

/** Not a tab: "‹ Back" above the title. The UDISE+ and board filings, for the office and the head. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <Filings />
    </BackTo>
  );
}
