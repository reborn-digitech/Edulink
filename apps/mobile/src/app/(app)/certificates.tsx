import { BackTo } from "@/components/back-to";
import { FamilyCertificates } from "@/screens/family/certificates";

/** Not a tab: "‹ Back" above the title. The certificates the school has issued to the pupil or a guardian's children. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <FamilyCertificates />
    </BackTo>
  );
}
