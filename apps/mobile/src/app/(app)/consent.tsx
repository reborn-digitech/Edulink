import { BackTo } from "@/components/back-to";
import { StudentConsentScreen } from "@/screens/college/consent";

/** Not a tab: "‹ Back" above the title. What an adult student at a college lets their guardians see (4 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)">
      <StudentConsentScreen />
    </BackTo>
  );
}
