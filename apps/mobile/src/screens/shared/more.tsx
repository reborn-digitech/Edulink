import { Pressable, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { isLimitedRoleCode, type RoleCode } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Icon, Row, Screen, Text } from "@/components";
import { Avatar } from "@/components/avatar";
import { useSession } from "@/lib/session";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { menuFor, MENU_GROUP_KEY, type MenuItem } from "@/lib/nav";
import { contextPlace } from "@/lib/institution";
import { LanguageRow } from "@/components/language-row";
import { openWeb } from "@/screens/family/shared";
import { useHeldBySchool, useSwitchContext } from "@/lib/outbox-held";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

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
  const switchTo = useSwitchContext();
  const held = useHeldBySchool();
  const qc = useQueryClient();
  // The language goes to the account too (B-24, campaign 2026-10-04): the server answers in prefs.locale,
  // so a refusal read after switching here came back in the old language. Then every screen reads afresh.
  const saveLocale = (code: string) =>
    void api()
      .post("/api/v1/account/locale", { locale: code })
      .then((r) => {
        if (r.ok) void qc.invalidateQueries();
      });
  if (session.status !== "signed-in") return null;
  const { me } = session;
  const role = me.active.role;
  const here = me.contexts.find((c) => c.schoolId === me.active.schoolId && c.role === me.active.role);
  // A college reads with its kind ("ZZ Vidya College · College"), a school as its name (4 Oct 2026).
  const school = here ? contextPlace(here, t) : null;
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
        ? menuFor(role, me.modules ?? []).map(({ group, items }) => (
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
          // What was saved there and not sent waits for the person to come back (PH-6).
          const waiting = active ? 0 : (held.get(c.schoolId) ?? 0);
          const roleName = t(`role.${c.role.toLowerCase()}` as TranslationKey);
          return (
            <Row
              key={`${c.schoolId}:${c.role}`}
              title={contextPlace(c, t) ?? t("account.belongNone")}
              caption={waiting > 0 ? `${roleName} · ${t("shell.outboxCount", { count: waiting })}` : roleName}
              right={active ? <Text variant="xs" tone="accent" bold>{t("account.hereNow")}</Text> : null}
              onPress={active ? undefined : () => void switchTo({ schoolId: c.schoolId, role: c.role as RoleCode })}
            />
          );
        })}
      </Card>
      <Card title={t("language.groupLabel")}>
        <LanguageRow onChosen={saveLocale} />
      </Card>
      <View style={{ gap: th.space[2] }}>
        {/* One search across the school, for every role with a school; an expert has none to search. */}
        {/* Not for a module role (a driver, the library's desk, a warden, an alumnus): the search door is not theirs. */}
        {/* …nor for a college staff role or a recruiter (4 Oct 2026): the gate opens the search door to no limited role. */}
        {role && role !== "EXPERT" && !isLimitedRoleCode(role) ? <Button label={t("search.title")} variant="secondary" onPress={() => router.push("/(app)/search")} /> : null}
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
