import { useLocalSearchParams } from "expo-router";
import { BackTo } from "@/components/back-to";
import { OfferingScreen } from "@/screens/academics/offering";

/** Not a tab: "‹ Back" above the title. One course I teach: its course file and internal marks (the college's academics, 4 Oct 2026). */
export default function Route() {
  const { id, tab } = useLocalSearchParams<{ id?: string; tab?: string }>();
  return (
    <BackTo fallback="/(app)">
      <OfferingScreen offeringId={id ?? ""} initialTab={tab === "marks" ? "marks" : "file"} />
    </BackTo>
  );
}
