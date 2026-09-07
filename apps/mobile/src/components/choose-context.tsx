import { useState } from "react";
import type { RoleCode } from "@edulink/contracts";
import { Button, Card, Row, Screen, Text } from "@/components";
import { useSession } from "@/lib/session";
import { useT } from "@/lib/i18n";

/**
 * "Choose where to go": a person who belongs to more than one school, or is
 * both a teacher and a parent, signs in with no active context — the web
 * sends them to /switch for the same reason. One tap binds the session to
 * a school and a role through /me/context; the tab bar appears after it.
 */
export function ChooseContext() {
  const t = useT();
  const session = useSession();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (session.status !== "signed-in") return null;
  const { me } = session;
  return (
    <Screen title={t("switch.whereToGo")} description={t("switch.switchAnyTime")}>
      <Card>
        {me.contexts.map((c) => {
          const key = `${c.schoolId}:${c.role}`;
          return (
            <Row
              key={key}
              title={c.schoolName ?? t("account.belongNone")}
              caption={t(`role.${c.role.toLowerCase()}` as never)}
              right={busy === key ? <Text variant="xs" tone="muted">{t("common.saving")}</Text> : null}
              onPress={async () => {
                setBusy(key);
                setError(null);
                try {
                  await session.switchContext({ schoolId: c.schoolId, role: c.role as RoleCode });
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
      {error ? (
        <Text variant="sm" tone="danger" accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
      <Button label={t("shell.signOut")} variant="ghost" onPress={() => void session.signOut()} />
    </Screen>
  );
}
