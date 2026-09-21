import { BackTo } from "@/components/back-to";
import { OfficePupilRecord } from "@/screens/staff/pupil-record";

/** Not a tab: "‹ Back" above the title, to the records list when the app was opened straight onto it. One pupil's record, for the office to correct. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/pupil-records">
      <OfficePupilRecord />
    </BackTo>
  );
}
