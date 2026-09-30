import { BackTo } from "@/components/back-to";
import { useRole } from "@/lib/session";
import { useT } from "@/lib/i18n";
import { GenericScreen } from "@/components/generic-screen";
import { FamilySessions } from "@/screens/family/sessions";
import { ProviderSessions } from "@/screens/shared/provider-sessions";
import { OfficeSessions } from "@/screens/staff/sessions";

/** Sessions and workshops (gigs): the family books, a teacher or an expert offers, the office reads and cancels. */
function RouteInner() {
  const role = useRole();
  const t = useT();
  if (role === "STUDENT" || role === "PARENT") return <FamilySessions />;
  if (role === "TEACHER" || role === "EXPERT") return <ProviderSessions />;
  if (role === "ADMIN" || role === "PRINCIPAL") return <OfficeSessions />;
  return <GenericScreen title={t("nav.sessions")} />;
}

/** A tab for an expert; for everybody else not a tab: "‹ Back" above the title. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more" unlessTab="sessions">
      <RouteInner />
    </BackTo>
  );
}
