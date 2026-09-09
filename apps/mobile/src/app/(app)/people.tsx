import { useRole } from "@/lib/session";
import { People } from "@/screens/staff/people";
import { Directory } from "@/screens/shared/directory";

/** The office's roll (the web's /admin/people); for everyone else, the people they may write to. */
export default function Route() {
  const role = useRole();
  if (role === "ADMIN" || role === "PRINCIPAL") return <People />;
  return <Directory />;
}
