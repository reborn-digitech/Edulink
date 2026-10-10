import { BackTo } from "@/components/back-to";
import { FacultyProfileScreen } from "@/screens/iqac/faculty-profile";

/** Not a tab: "‹ Back" above the title. My public page: the preview, up or down (the parity batch, 10 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <FacultyProfileScreen />
    </BackTo>
  );
}
