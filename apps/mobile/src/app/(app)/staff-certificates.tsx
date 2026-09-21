import { BackTo } from "@/components/back-to";
import { StaffCertificates } from "@/screens/staff/certificates";

/** Not a tab: "‹ Back" above the title. Every certificate the school has issued, for the office. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <StaffCertificates />
    </BackTo>
  );
}
