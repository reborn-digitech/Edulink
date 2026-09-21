import { BackTo } from "@/components/back-to";
import { CertificateIssue } from "@/screens/staff/certificate-issue";

/** Not a tab: "‹ Back" above the title, to the records list when the app was opened straight onto it. Issue one certificate to one pupil. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/pupil-records">
      <CertificateIssue />
    </BackTo>
  );
}
