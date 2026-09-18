import { BackTo } from "@/components/back-to";
import { SyllabusCoverage } from "@/screens/staff/syllabus-coverage";

/** Not a tab: "‹ Back" above the title. The head's picture of how far every class has got through its syllabus. */
export default function Route() {
  return (
    <BackTo fallback="/(app)">
      <SyllabusCoverage />
    </BackTo>
  );
}
