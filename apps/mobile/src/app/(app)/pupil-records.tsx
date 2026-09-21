import { BackTo } from "@/components/back-to";
import { PupilRecords } from "@/screens/staff/pupil-records";

/** Not a tab: "‹ Back" above the title. Which pupils' records can carry a certificate, for the office. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <PupilRecords />
    </BackTo>
  );
}
