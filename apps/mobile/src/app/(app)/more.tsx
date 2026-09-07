import { View } from "react-native";
import { useRouter } from "expo-router";
import { Button, Card, Row, Screen, Text } from "@/components";
import { useSession } from "@/lib/session";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { LanguageRow } from "@/components/language-row";

/**
 * More: switch school or role (the account page's "Where you belong"),
 * the language, notifications, and sign out. The heavy settings stay on the
 * web, as the plan says, and this links out.
 */
export default function More() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const session = useSession();
  if (session.status !== "signed-in") return null;
  const { me } = session;
  return (
    <Screen title={t("nav.more")}>
      <Card title={t("account.belongTitle")}>
        {me.contexts.map((c) => {
          const active = c.schoolId === me.active.schoolId && c.role === me.active.role;
          return (
            <Row
              key={`${c.schoolId}:${c.role}`}
              title={c.schoolName ?? t("account.belongNone")}
              caption={t(`role.${c.role.toLowerCase()}` as never)}
              right={active ? <Text variant="xs" tone="accent" bold>{t("account.hereNow")}</Text> : null}
              onPress={active ? undefined : () => void session.switchContext({ schoolId: c.schoolId, role: c.role })}
            />
          );
        })}
      </Card>
      <Card title={t("language.groupLabel")}>
        <LanguageRow />
      </Card>
      <View style={{ gap: th.space[2] }}>
        <Button label={t("shell.notifications")} variant="secondary" onPress={() => router.push("/(app)/notifications")} />
        <Button label={t("shell.signOut")} variant="danger" onPress={() => void session.signOut()} />
      </View>
    </Screen>
  );
}
