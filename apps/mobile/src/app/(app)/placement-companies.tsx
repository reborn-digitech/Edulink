import { BackTo } from "@/components/back-to";
import { TpoCompaniesScreen } from "@/screens/placement/tpo-companies";

/** Not a tab: "‹ Back" above the title. The companies with the GSTIN or CIN check and the cell's word (the parity batch, 10 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)">
      <TpoCompaniesScreen />
    </BackTo>
  );
}
