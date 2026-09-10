import { useState } from "react";
import { View } from "react-native";
import type { Me } from "@edulink/contracts";
import { Button } from "@/components";
import { ChooseContext } from "@/components/choose-context";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { OperatorHome } from "@/screens/operator/home";
import { AppAdminHome } from "@/screens/operator/app-admin";

export type Console = "operator" | "appadmin";

/** Which consoles this person may open: the server's (isSuperuser) and the content team's (isAppAdmin). */
export function consolesFor(me: Me): Console[] {
  return [...(me.user.isSuperuser ? (["operator"] as const) : []), ...(me.user.isAppAdmin ? (["appadmin"] as const) : [])];
}

/**
 * Home for a person signed in with no school role — the operator and the
 * content team have none by design (the web's /root and /appadmin sit outside
 * the school shell). Nobody to be at any school: the console is the whole
 * app. Also at a school: the picker, with the console rows under it.
 *
 * It is the index route of a Stack (see (app)/_layout.tsx), not a screen the
 * layout draws in place of a navigator — so a school's page or the question
 * bank, pushed from here, actually opens.
 */
export function ConsoleHome({ me }: { me: Me }) {
  const t = useT();
  const th = useTheme();
  const consoles = consolesFor(me);
  const [open, setOpen] = useState<Console | null>(null);
  const shown = me.contexts.length === 0 ? (consoles[0] ?? null) : open;
  if (shown) {
    return (
      <View style={{ flex: 1 }}>
        {me.contexts.length > 0 ? (
          <View style={{ paddingHorizontal: th.space[4], paddingTop: th.space[3] }}>
            <Button label={t("switch.whereToGo")} variant="ghost" onPress={() => setOpen(null)} />
          </View>
        ) : null}
        {shown === "operator" ? <OperatorHome /> : <AppAdminHome />}
      </View>
    );
  }
  return <ChooseContext consoles={consoles} onConsole={setOpen} />;
}
