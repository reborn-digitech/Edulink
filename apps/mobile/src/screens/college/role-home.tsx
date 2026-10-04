import { View } from "react-native";
import { useRouter } from "expo-router";
import { isCollegeKind, MODULE_OF_ROLE, type CollegeRoleCode } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Empty, Screen } from "@/components";
import { useSession } from "@/lib/session";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { MODULE_KEYS } from "@/screens/modules/role-home";

/** Each college staff role's name, as on the web's ROLE_META. */
export const COLLEGE_ROLE_KEY: Record<CollegeRoleCode, TranslationKey> = {
  FACULTY: "role.faculty",
  HOD: "role.hod",
  EXAM_CONTROLLER: "role.examController",
  IQAC: "role.iqac",
  TPO: "role.tpo",
  ACCOUNTS: "role.accounts",
};

/**
 * The home of a college staff role (4 Oct 2026) — the web's /faculty, /hod,
 * /exam-cell, /iqac, /placement and /accounts. Whether the college has the
 * role's own module on comes from /api/v1/me's `modules` (FACULTY and HOD
 * hang on ACADEMICS, the exam controller on EXAMS, IQAC on IQAC, the
 * placement officer on PLACEMENT; ACCOUNTS on none). Off, the home says so
 * and offers More; on, it says the role's screens are coming, with the
 * college's feed and the account. Each module's builder replaces the
 * "coming" half with the role's day.
 */
export function CollegeRoleHome({ role }: { role: CollegeRoleCode }) {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const session = useSession();
  const me = session.status === "signed-in" ? session.me : null;
  const name = t(COLLEGE_ROLE_KEY[role]);
  const noun = t(`institution.noun.${me?.institutionKind ?? "SCHOOL"}`);
  const own = MODULE_OF_ROLE[role];
  const on = !own || (me?.modules ?? []).includes(own);
  const place = me?.contexts.find((c) => c.schoolId === me.active.schoolId && c.role === role)?.schoolName ?? noun;
  const more = <Button label={t("nav.more")} variant="secondary" onPress={() => router.push("/(app)/more" as never)} />;
  if (own && !on) {
    const moduleName = t(MODULE_KEYS[own].name);
    return (
      <Screen title={name}>
        <Empty icon="puzzle" title={t("modules.offTitle", { module: moduleName })} body={t(isCollegeKind(me?.institutionKind) ? "modules.offBodyCollege" : "modules.offBody", { module: moduleName })} action={more} />
      </Screen>
    );
  }
  return (
    <Screen title={name} description={t("college.homeIntro", { role: name, place })}>
      <Empty icon="puzzle" title={t("college.homeComingTitle", { role: name })} body={t("college.homeComingBody", { role: name, noun })} action={more} />
      <View style={{ gap: th.space[2] }}>
        <Button label={t("college.homeFeed", { noun })} onPress={() => router.push("/(app)/bulletin" as never)} />
        <Button label={t("nav.account")} variant="secondary" onPress={() => router.push("/(app)/account" as never)} />
      </View>
    </Screen>
  );
}
