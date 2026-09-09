import { Button, Empty, Screen } from "@/components";
import { useSession } from "@/lib/session";
import { useT } from "@/lib/i18n";
import { openWeb } from "@/screens/family/shared";

/**
 * Signed in, but part of no school: the web's /switch says the same and
 * offers the join page. The phone cannot take a school code (joining is a
 * web flow with its own checks), so the door opens it there; sign out is
 * the other way off this screen.
 */
export function NoSchool() {
  const t = useT();
  const session = useSession();
  return (
    <Screen title={t("switch.notPartOfSchool")} description={t("switch.notPartBody")}>
      <Empty title={t("account.belongNone")} body={t("account.belongNoneBody")} action={<Button label={t("switch.joinWithCode")} onPress={() => openWeb("/join")} />} />
      <Button label={t("shell.signOut")} variant="ghost" onPress={() => void session.signOut()} />
    </Screen>
  );
}
