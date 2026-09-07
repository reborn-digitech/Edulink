import { People } from "@/screens/staff/people";
import { useRole } from "@/lib/session";
import { GenericScreen } from "@/components/generic-screen";
import { useT } from "@/lib/i18n";

export default function Route() {
  const role = useRole();
  const t = useT();
  if (role === "ADMIN" || role === "PRINCIPAL") return <People />;
  return <GenericScreen title={t("nav.people")} />;
}
