import { BackTo } from "@/components/back-to";
import { EnquiryDetail } from "@/screens/shared/enquiry-detail";

function RouteInner() {
  return <EnquiryDetail />;
}

/** Not a tab: "‹ Back" above the title. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/enquiries">
      <RouteInner />
    </BackTo>
  );
}
