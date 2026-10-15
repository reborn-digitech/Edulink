import { View } from "react-native";
import { useRouter } from "expo-router";
import { MODULE_OF_ROLE, type ModuleRoleCode, type SchoolModuleCode } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Empty, Screen } from "@/components";
import { useSession } from "@/lib/session";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { openWeb } from "@/screens/family/shared";

/** The module's name and what it does, as on the web's MODULE_META (apps/web/src/lib/module-meta.ts). */
export const MODULE_KEYS: Record<SchoolModuleCode, { name: TranslationKey; what: TranslationKey }> = {
  TRANSPORT: { name: "modules.transportName", what: "modules.transportWhat" },
  LIBRARY: { name: "modules.libraryName", what: "modules.libraryWhat" },
  HOSTEL: { name: "modules.hostelName", what: "modules.hostelWhat" },
  INVENTORY: { name: "modules.inventoryName", what: "modules.inventoryWhat" },
  PAYROLL: { name: "modules.payrollName", what: "modules.payrollWhat" },
  ALUMNI: { name: "modules.alumniName", what: "modules.alumniWhat" },
  ASSISTANT: { name: "modules.assistantName", what: "modules.assistantWhat" },
  // website-builder A (15 Oct 2026): the school's public website, built on the web only.
  WEBSITE: { name: "modules.websiteName", what: "modules.websiteWhat" },
  // The college's six (4 Oct 2026).
  ACADEMICS: { name: "modules.academicsName", what: "modules.academicsWhat" },
  EXAMS: { name: "modules.examsName", what: "modules.examsWhat" },
  IQAC: { name: "modules.iqacName", what: "modules.iqacWhat" },
  PLACEMENT: { name: "modules.placementName", what: "modules.placementWhat" },
  ADMISSIONS: { name: "modules.admissionsName", what: "modules.admissionsWhat" },
  SCHOLARSHIPS: { name: "modules.scholarshipsName", what: "modules.scholarshipsWhat" },
};

/**
 * The home of a module role (3 Oct 2026) — the web's /driver, /library,
 * /hostel and /alumni. Whether the school has the module on comes from
 * /api/v1/me's `modules`; off, the home says so and offers More (where the
 * person can switch to another role); on, the driver's, the library's and the
 * warden's say their screens are coming, and the alumnus's opens the school's
 * feed, its staff to write to, and their leaving record on the web. A module
 * builder replaces the "coming" half with the role's day.
 */
export function ModuleRoleHome({ role }: { role: ModuleRoleCode }) {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const session = useSession();
  const me = session.status === "signed-in" ? session.me : null;
  const mod = MODULE_OF_ROLE[role];
  const name = t(MODULE_KEYS[mod].name);
  const on = (me?.modules ?? []).includes(mod);
  const more = <Button label={t("nav.more")} variant="secondary" onPress={() => router.push("/(app)/more" as never)} />;
  if (!on) {
    return (
      <Screen title={name}>
        <Empty icon="puzzle" title={t("modules.offTitle", { module: name })} body={t("modules.offBody", { module: name })} action={more} />
      </Screen>
    );
  }
  if (role !== "ALUMNUS") {
    return (
      <Screen title={name} description={t(MODULE_KEYS[mod].what)}>
        <Empty icon="puzzle" title={t("modules.comingTitle", { module: name })} body={t("modules.comingBody", { module: name })} action={more} />
      </Screen>
    );
  }
  const school = me?.contexts.find((c) => c.schoolId === me.active.schoolId && c.role === role)?.schoolName ?? "";
  return (
    <Screen title={name} description={t("modules.alumniWelcome", { school })}>
      <View style={{ gap: th.space[2] }}>
        <Button label={t("modules.alumniFeed")} onPress={() => router.push("/(app)/bulletin" as never)} />
        <Button label={t("modules.alumniMessages")} variant="secondary" onPress={() => router.push("/(app)/messages" as never)} />
        <Button label={t("modules.alumniRecord")} variant="secondary" onPress={() => openWeb("/record")} />
      </View>
    </Screen>
  );
}
