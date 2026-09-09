import { useRole } from "@/lib/session";
import { useT } from "@/lib/i18n";
import { GenericScreen } from "@/components/generic-screen";
import { AdminSettings } from "@/screens/staff/settings";
import { ParentSettings } from "@/screens/family/settings";

export default function Route() {
  const role = useRole();
  const t = useT();
  if (role === "ADMIN") return <AdminSettings />;
  if (role === "PARENT") return <ParentSettings />;
  return <GenericScreen title={t("nav.settings")} />;
}
