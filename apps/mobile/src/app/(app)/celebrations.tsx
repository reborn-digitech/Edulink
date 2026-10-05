import { BackTo } from "@/components/back-to";
import { Celebrations } from "@/screens/shared/celebrations";

/** Not a tab: "‹ Back" above the title. Birthdays and work anniversaries, from a home's card (A3-inventory-14, risks batch 5 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)">
      <Celebrations />
    </BackTo>
  );
}
