import { Pressable, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import type { RoleCode } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Icon, Row, Screen, Text } from "@/components";
import { Avatar } from "@/components/avatar";
import { useSession } from "@/lib/session";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { menuFor, MENU_GROUP_KEY, type MenuItem } from "@/lib/nav";
import { LanguageRow } from "@/components/language-row";
import { openWeb } from "@/screens/family/shared";

/**
 * More: everything the web's rail and More sheet list for this role that
 * the bar does not carry — grouped the web's way (Day to day, School life,
 * Running things) — then where the person belongs (the account page's
 * "Where you belong"), the language, notifications, a way to report a
 * problem, and sign out. An entry the phone has no screen for opens the
 * same page on the web and says so on its row, so nobody taps into a
 * browser by surprise.
 */
export function More() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const session = useSession();
  if (session.status !== "signed-in") return null;
  const { me } = session;
  const role = me.active.role;
  const school = me.contexts.find((c) => c.schoolId === me.active.schoolId && c.role === me.active.role)?.schoolName ?? null;
  const name = me.user.preferredName ?? me.user.name;
  const description = [role ? t(`role.${role.toLowerCase()}` as TranslationKey) : null, school].filter(Boolean).join(" · ");
  return (
    <Screen title={t("nav.more")} description={description ? `${name} · ${description}` : name}>
      {/* The person first — their avatar and name, which open their account. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${name}, ${t("nav.account")}`}
        onPress={() => router.push("/(app)/account" as never)}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, minHeight: th.tap, flexDirection: "row", alignItems: "center", gap: th.space[3] })}
      >
        <Avatar avatarKey={me.user.avatarKey} name={name} size={56} decorative />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="lg" bold>
            {name}
          </Text>
          <Text variant="sm" tone="muted">
            {t("nav.account")}
          </Text>
        </View>
        <Icon name="caretRight" size={18} color={th.fgSubtle} weight="bold" />
      </Pressable>
      {role
        ? menuFor(role).map(({ group, items }) => (
            <Card key={group} title={t(MENU_GROUP_KEY[group])}>
              {items.map((item) => (
                <MenuRow key={item.labelKey} item={item} />
              ))}
            </Card>
          ))
        : null}
      {me.user.isSuperuser || me.user.isAppAdmin ? (
        <Card title={t("root.serverBadge")}>
          {me.user.isSuperuser ? <MenuRow item={{ labelKey: "root.serverAdministration", icon: "shield", group: "running", screen: "/(app)/operator" }} /> : null}
          {me.user.isAppAdmin ? <MenuRow item={{ labelKey: "root.contentTeam", icon: "trophy", group: "running", screen: "/(app)/appadmin" }} /> : null}
        </Card>
      ) : null}
      <Card title={t("account.belongTitle")}>
        {me.contexts.length === 0 ? (
          <Text variant="sm" tone="muted">
            {t("account.belongNone")}
          </Text>
        ) : null}
        {me.contexts.map((c) => {
          const active = c.schoolId === me.active.schoolId && c.role === me.active.role;
          return (
            <Row
              key={`${c.schoolId}:${c.role}`}
              title={c.schoolName ?? t("account.belongNone")}
              caption={t(`role.${c.role.toLowerCase()}` as TranslationKey)}
              right={active ? <Text variant="xs" tone="accent" bold>{t("account.hereNow")}</Text> : null}
              onPress={active ? undefined : () => void session.switchContext({ schoolId: c.schoolId, role: c.role as RoleCode })}
            />
          );
        })}
      </Card>
      <Card title={t("language.groupLabel")}>
        <LanguageRow />
      </Card>
      <View style={{ gap: th.space[2] }}>
        <Button label={t("shell.notifications")} variant="secondary" onPress={() => router.push("/(app)/notifications")} />
        <Button label={t("report.title")} variant="secondary" onPress={() => router.push({ pathname: "/(app)/report", params: { from: pathname } })} />
        <Button label={t("shell.signOut")} variant="danger" onPress={() => void session.signOut()} />
      </View>
    </Screen>
  );
}

/** One entry: its icon, its name, "Open on the web" when that is where it goes, and a chevron. */
function MenuRow({ item }: { item: MenuItem }) {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const label = t(item.labelKey);
  const onWeb = item.web !== undefined;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={onWeb ? `${label}, ${t("mobile.openOnWeb")}` : label}
      onPress={() => (item.web !== undefined ? openWeb(item.web) : router.push(item.screen as never))}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, minHeight: th.tap, flexDirection: "row", alignItems: "center", gap: th.space[3], paddingVertical: th.space[2] })}
    >
      <View style={{ width: th.tap, height: th.tap, borderRadius: th.radius.md, backgroundColor: th.accentSoft, alignItems: "center", justifyContent: "center" }}>
        <Icon name={item.icon} size={22} color={th.accentStrong} weight="duotone" />
      </View>
      <View style={{ flex: 1, gap: 1 }}>
        <Text variant="base" bold>
          {label}
        </Text>
        {onWeb ? (
          <Text variant="xs" tone="muted">
            {t("mobile.openOnWeb")}
          </Text>
        ) : null}
      </View>
      <Icon name="caretRight" size={18} color={th.fgSubtle} weight="bold" />
    </Pressable>
  );
}
