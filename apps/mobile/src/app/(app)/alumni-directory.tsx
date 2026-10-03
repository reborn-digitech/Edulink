import { BackTo } from "@/components/back-to";
import { AlumniDirectory } from "@/screens/alumni/directory";

/** Not a tab: "‹ Back" above the title. The alumni directory, for a former pupil and the school's staff. */
export default function Route() {
  return (
    <BackTo fallback="/(app)">
      <AlumniDirectory />
    </BackTo>
  );
}
