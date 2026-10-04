import { BackTo } from "@/components/back-to";
import { StudentMoneyScreen } from "@/screens/college-office/money";

/** Not a tab: "‹ Back" above the title. A college student's ledger net of the scholarship (4 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)">
      <StudentMoneyScreen />
    </BackTo>
  );
}
