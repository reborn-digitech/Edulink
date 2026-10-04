import { useLocalSearchParams } from "expo-router";
import { BackTo } from "@/components/back-to";
import { LectureScreen } from "@/screens/academics/lecture";

/** Not a tab: "‹ Back" above the title. Marking one lecture (the college's academics, 4 Oct 2026). */
export default function Route() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return (
    <BackTo fallback="/(app)">
      <LectureScreen lectureId={id ?? ""} />
    </BackTo>
  );
}
