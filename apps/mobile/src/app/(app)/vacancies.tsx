import { BackTo } from "@/components/back-to";
import { Vacancies } from "@/screens/staff/vacancies";

function RouteInner() {
  return <Vacancies />;
}

/** Not a tab: "‹ Back" above the title. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <RouteInner />
    </BackTo>
  );
}
