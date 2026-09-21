import { BackTo } from "@/components/back-to";
import { AdmissionSlots } from "@/screens/staff/admission-slots";

/** Not a tab: "‹ Back" above the title, to the cycles when the app was opened straight onto it. One cycle's entrance-test sittings. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/admissions">
      <AdmissionSlots />
    </BackTo>
  );
}
