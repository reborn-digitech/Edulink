import type { ReactNode } from "react";
import { Redirect, useRouter } from "expo-router";
import type { RoleCode } from "@edulink/contracts";
import { useRole } from "@/lib/session";
import { useT } from "@/lib/i18n";
import { Screen } from "./screen";
import { Button } from "./button";

/**
 * AN OFFICE SCREEN OPENED BY ANOTHER ROLE (QA-70, QA campaign of 24 October 2026). A path such as /circulars,
 * /applications or /substitutions names the office's and the head's screen; a guardian or a teacher who reached it
 * (a typed address, an old link) met "Wrong role for this action" with a Try again that could only fail. Such a person
 * is sent to their own screen where they have one (`own`: a guardian's applications, a teacher's covers), and is told
 * otherwise that the page is the office's, with the way home. The office and the head see the screen as before.
 */
export function OfficeOnly({ children, own = {} }: { children: ReactNode; own?: Partial<Record<RoleCode, string>> }) {
  const role = useRole();
  const t = useT();
  const router = useRouter();
  if (role === null || role === "ADMIN" || role === "PRINCIPAL") return <>{children}</>;
  const to = own[role];
  if (to) return <Redirect href={to as never} />;
  return (
    <Screen title={t("qaInterface.officeOnlyTitle")} description={t("qaInterface.officeOnlyBody")}>
      <Button label={t("notFound.home")} variant="secondary" onPress={() => router.replace("/(app)" as never)} />
    </Screen>
  );
}
