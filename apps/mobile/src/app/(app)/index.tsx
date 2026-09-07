import { View } from "react-native";
import { useRouter } from "expo-router";
import { Button, Card, Row, Screen, Stat, Text } from "@/components";
import { useRole, useSession } from "@/lib/session";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { TABS } from "@/lib/nav";

/**
 * The home tab, before the role's own screen replaces it: who is signed in,
 * where, and the doors this role has. Each role's "today" or "overview"
 * (the plan's weeks 3–6) lands here.
 */
import { TeacherHome } from "@/screens/teacher/home";
import { ParentHome } from "@/screens/family/parent-home";
import { StudentHome } from "@/screens/family/student-home";
import { PrincipalHome } from "@/screens/staff/principal-home";
import { AdminHome } from "@/screens/staff/admin-home";

export default function Home() {
  const role = useRole();
  if (role === "TEACHER") return <TeacherHome />;
  if (role === "PARENT") return <ParentHome />;
  if (role === "STUDENT") return <StudentHome />;
  if (role === "PRINCIPAL") return <PrincipalHome />;
  if (role === "ADMIN") return <AdminHome />;
  return <GenericHome />;
}

function GenericHome() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const session = useSession();
  if (session.status !== "signed-in") return null;
  const { me } = session;
  const name = me.user.preferredName ?? me.user.name;
  const school = me.contexts.find((c) => c.schoolId === me.active.schoolId && c.role === me.active.role)?.schoolName ?? me.contexts[0]?.schoolName ?? "";
  return (
    <Screen title={t("shell.helloName", { name })} description={school}>
      <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
        <Stat label={t("shell.switchRole")} value={me.active.role ? t(`role.${me.active.role.toLowerCase()}` as never) : "—"} tone="accent" />
        <Stat label={t("account.belongTitle")} value={me.contexts.length} />
      </View>
      <Card title={t("nav.more")}>
        {TABS[me.active.role ?? "TEACHER"].filter((tab) => tab.name !== "index").map((tab) => (
          <Row key={tab.name} title={t(tab.labelKey)} onPress={() => router.push(`/(app)/${tab.name}` as never)} />
        ))}
      </Card>
      <Text variant="xs" tone="subtle">
        {me.user.email ?? ""}
      </Text>
      <Button label={t("shell.notifications")} variant="secondary" onPress={() => router.push("/(app)/notifications")} />
    </Screen>
  );
}
