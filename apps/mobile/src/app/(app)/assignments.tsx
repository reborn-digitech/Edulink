import { FamilyAssignments } from "@/screens/family/assignments";
import { useRole } from "@/lib/session";
import { GenericScreen } from "@/components/generic-screen";
import { useT } from "@/lib/i18n";

export default function Route() {
  const role = useRole();
  const t = useT();
  if (role === "PARENT" || role === "STUDENT") return <FamilyAssignments />;
  return <GenericScreen title={t("nav.assignments")} />;
}
