import { FamilyPractice } from "@/screens/family/practice";
import { useRole } from "@/lib/session";
import { GenericScreen } from "@/components/generic-screen";
import { useT } from "@/lib/i18n";

export default function Route() {
  const role = useRole();
  const t = useT();
  if (role === "PARENT" || role === "STUDENT") return <FamilyPractice />;
  return <GenericScreen title={t("nav.practice")} />;
}
