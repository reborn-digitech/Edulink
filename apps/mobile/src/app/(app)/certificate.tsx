import { BackTo } from "@/components/back-to";
import { CertificateView } from "@/screens/shared/certificate";

/** Not a tab: "‹ Back" above the title, to the list when the app was opened straight onto it (a notification). One certificate, with its PDF. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/certificates">
      <CertificateView />
    </BackTo>
  );
}
