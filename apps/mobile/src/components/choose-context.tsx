import { useState } from "react";
import type { RoleCode } from "@edulink/contracts";
import { Button, Card, Row, Screen, Text } from "@/components";
import { useSession } from "@/lib/session";
import { useT } from "@/lib/i18n";
import { NoSchool } from "@/screens/shared/no-school";
import { contextPlace } from "@/lib/institution";
import { useSwitchContext } from "@/lib/outbox-held";

/**
 * "Choose where to go": a person who belongs to more than one school, or is
 * both a teacher and a parent, signs in with no active context — the web
 * sends them to /switch for the same reason. One tap binds the session to
 * a school and a role through /me/context; the tab bar appears after it.
 */
export function ChooseContext({ consoles = [], onConsole }: { consoles?: ("operator" | "appadmin")[]; onConsole?: (which: "operator" | "appadmin") => void }) {
  const t = useT();
  const session = useSession();
  const switchTo = useSwitchContext();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (session.status !== "signed-in") return null;
  const { me } = session;
  // Nobody to be at any school: the web's /switch says so and offers the join page.
  if (me.contexts.length === 0) return <NoSchool />;
  return (
    <Screen title={t("switch.whereToGo")} description={t("switch.switchAnyTime")}>
      <Card>
        {me.contexts.map((c) => {
          const key = `${c.schoolId}:${c.role}`;
          return (
            <Row
              key={key}
              title={contextPlace(c, t) ?? t("account.belongNone")}
              caption={t(`role.${c.role.toLowerCase()}` as never)}
              right={busy === key ? <Text variant="xs" tone="muted">{t("common.saving")}</Text> : null}
              onPress={async () => {
                setBusy(key);
                setError(null);
                try {
                  await switchTo({ schoolId: c.schoolId, role: c.role as RoleCode });
                } catch (e) {
                  setError(e instanceof Error ? e.message : t("common.tryAgain"));
                } finally {
                  setBusy(null);
                }
              }}
            />
          );
        })}
      </Card>
      {consoles.length > 0 ? (
        <Card title={t("root.serverBadge")}>
          {consoles.includes("operator") ? <Row title={t("root.serverAdministration")} caption={t("root.serverBadge")} onPress={() => onConsole?.("operator")} /> : null}
          {consoles.includes("appadmin") ? <Row title={t("root.contentTeam")} caption={t("root.serverBadge")} onPress={() => onConsole?.("appadmin")} /> : null}
        </Card>
      ) : null}
      {error ? (
        <Text variant="sm" tone="danger" accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
      <Button label={t("shell.signOut")} variant="ghost" onPress={() => void session.signOut()} />
    </Screen>
  );
}
