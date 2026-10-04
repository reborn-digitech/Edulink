import { BackTo } from "@/components/back-to";
import { VoiceScreen } from "@/screens/iqac/voice";

/** Not a tab: "‹ Back" above the title. The surveys open to me and, for a student, the grievance line (the IQAC module, 4 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)">
      <VoiceScreen />
    </BackTo>
  );
}
