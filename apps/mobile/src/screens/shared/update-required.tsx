import { Linking, Platform, View } from "react-native";
import { Button, Screen, Text } from "@/components";
import { API_BASE } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { appVersion, type VersionPolicy } from "@/lib/version";

/**
 * The update screen: shown instead of the app when this build is below
 * the store's minimum. A title, the operator's sentence when they wrote
 * one, one button to the store — or to the web when the store has no
 * listing yet — and no way past it.
 */
export function UpdateRequired({ policy }: { policy: VersionPolicy }) {
  const t = useT();
  const th = useTheme();
  const android = Platform.OS === "android";
  const storeUrl = android ? policy.storeUrls.android : policy.storeUrls.ios;
  const latest = android ? policy.latest.android : policy.latest.ios;
  const body = policy.message?.trim() ? policy.message : t("update.body", { version: appVersion(), latest });
  return (
    <Screen title={t("update.title")} scroll={false}>
      <View style={{ gap: th.space[4] }}>
        <Text variant="base">{body}</Text>
        {storeUrl ? null : (
          <Text variant="sm" tone="muted">
            {t("update.noStore")}
          </Text>
        )}
        <Button label={storeUrl ? t("update.open") : t("update.openWeb")} onPress={() => void Linking.openURL(storeUrl ?? API_BASE)} />
      </View>
    </Screen>
  );
}
