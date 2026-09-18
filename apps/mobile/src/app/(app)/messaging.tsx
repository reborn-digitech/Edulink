import { BackTo } from "@/components/back-to";
import { useRole } from "@/lib/session";
import { useT } from "@/lib/i18n";
import { GenericScreen } from "@/components/generic-screen";
import { StaffMessaging } from "@/screens/staff/messaging";

/** Texts & WhatsApp: the office's channels, notices and delivery reports; the head reads. */
function RouteInner() {
  const role = useRole();
  const t = useT();
  if (role === "ADMIN" || role === "PRINCIPAL") return <StaffMessaging />;
  return <GenericScreen title={t("nav.messaging")} />;
}

/** Not a tab: "‹ Back" above the title. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <RouteInner />
    </BackTo>
  );
}
