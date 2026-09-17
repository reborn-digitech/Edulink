import { BackTo } from "@/components/back-to";
import { useRole } from "@/lib/session";
import { useT } from "@/lib/i18n";
import { GenericScreen } from "@/components/generic-screen";
import { FamilyFees } from "@/screens/family/fees";
import { StaffFees } from "@/screens/staff/fees";

/** Fees: a guardian's dues and ways to pay; the office's and the head's overview. */
function RouteInner() {
  const role = useRole();
  const t = useT();
  if (role === "PARENT" || role === "STUDENT") return <FamilyFees />;
  if (role === "ADMIN" || role === "PRINCIPAL") return <StaffFees />;
  return <GenericScreen title={t("nav.fees")} />;
}

/** Not a tab: "‹ Back" above the title. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <RouteInner />
    </BackTo>
  );
}
