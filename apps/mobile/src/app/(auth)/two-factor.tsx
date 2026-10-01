import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen } from "@/components";
import { useT } from "@/lib/i18n";
import { TwoFactorStep } from "@/screens/auth/two-factor-step";

/** The second step of a sign-in that began elsewhere: SSO's deep link, or a link opened in the app. */
export default function TwoFactor() {
  const t = useT();
  const router = useRouter();
  const { challenge } = useLocalSearchParams<{ challenge?: string }>();
  const back = () => (router.canGoBack() ? router.back() : router.replace("/(auth)" as never));
  return (
    <Screen title={t("login.title")}>
      <TwoFactorStep challenge={typeof challenge === "string" ? challenge : ""} onBack={back} />
    </Screen>
  );
}
