import { BackTo } from "@/components/back-to";
import { VacancyDetail } from "@/screens/shared/vacancy-detail";

/** Not a tab: "‹ Back" above the title, to /(app)/vacancies when the app was opened straight onto it. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/vacancies">
      <VacancyDetail />
    </BackTo>
  );
}
