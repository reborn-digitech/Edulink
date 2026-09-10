import { useState } from "react";
import { View } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { joinLookupSchema, type JoinLookup } from "@edulink/contracts";
import { Button, Card, Failed, Field, Icon, Screen, Text, useToast } from "@/components";
import { api, errorText } from "@/lib/api";
import { useSession } from "@/lib/session";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

type Refusal = Error & { issues?: Record<string, string> };

/** The web's formatCode on /join: capitals and digits, 5+4 for a school, 3+4 for a class. */
export function formatJoinCode(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length <= 3) return clean;
  if (clean.length > 7) return `${clean.slice(0, 5)}-${clean.slice(5, 9)}`;
  return `${clean.slice(0, 3)}-${clean.slice(3, 7)}`;
}

/**
 * Signed in, but part of no school: the web's /join "What's your code?" for
 * somebody who already has an account. Check the code (POST
 * /api/v1/join/lookup), see which school and class it is, then join it as a
 * pupil on this account (POST /api/v1/join) — the server moves this session
 * to the school as a pupil, and re-reading /me brings the tab bar. A refusal
 * about the code sits under the field; anything else (a parent's account, a
 * staff post there, the guessing limit, no connection) is a Failed with a
 * retry. Sign out is the other way off this screen.
 */
export function NoSchool() {
  const t = useT();
  const th = useTheme();
  const toast = useToast();
  const session = useSession();
  const [code, setCode] = useState("");
  const [found, setFound] = useState<JoinLookup | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [failure, setFailure] = useState<{ message: string; retry: () => void } | null>(null);
  const name = session.status === "signed-in" ? (session.me.user.preferredName ?? session.me.user.name) : "";

  const refuse = (e: Refusal, retry: () => void) => {
    if (e.issues?.code) setCodeError(e.issues.code);
    else setFailure({ message: e.message, retry });
  };
  const refusal = (result: { ok: false; error: string; issues?: Record<string, string> }): Refusal => {
    const e: Refusal = new Error(errorText(result, t("common.somethingWrong")));
    e.issues = result.issues;
    return e;
  };

  const lookup = useMutation({
    mutationFn: async (typed: string) => {
      const result = await api().post("/api/v1/join/lookup", { code: typed });
      if (!result.ok) throw refusal(result);
      return joinLookupSchema.parse(result.data);
    },
    onSuccess: setFound,
    onError: (e: Refusal) => {
      setFound(null);
      refuse(e, check);
    },
  });

  const join = useMutation({
    mutationFn: async (typed: string) => {
      const result = await api().post("/api/v1/join", { code: typed });
      if (!result.ok) throw refusal(result);
    },
    onSuccess: async () => {
      toast.show(t("join.youreIn"));
      // The session is the school's pupil now; /me says so and the tab bar follows.
      await session.refresh();
    },
    onError: (e: Refusal) => refuse(e, joinIt),
  });

  function check() {
    setCodeError(null);
    setFailure(null);
    lookup.mutate(code);
  }
  function joinIt() {
    setCodeError(null);
    setFailure(null);
    join.mutate(code);
  }

  const joinLabel = found?.className ? t("join.joinClassAs", { className: found.className, name }) : t("join.joinSchoolAs", { school: found?.schoolName ?? "", name });

  return (
    <Screen title={t("switch.notPartOfSchool")} description={t("switch.notPartBody")}>
      {failure ? <Failed message={failure.message} onRetry={failure.retry} /> : null}
      <Card title={t("join.whatsYourCode")}>
        <Text variant="sm" tone="muted">
          {t("join.signedInAsBody", { name })}
        </Text>
        <Field
          label={t("join.codeLabel")}
          placeholder={t("join.codePlaceholder")}
          value={code}
          onChangeText={(next) => {
            setCode(formatJoinCode(next));
            setFound(null);
            setCodeError(null);
            setFailure(null);
          }}
          onSubmitEditing={() => {
            if (!found && code.replace(/[^A-Z0-9]/g, "").length >= 4) check();
          }}
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="off"
          maxLength={32}
          error={codeError}
          hint={t("join.codeBody")}
        />
        {found ? null : (
          <Button label={t("join.checkMyCode")} variant="secondary" busy={lookup.isPending} disabled={code.replace(/[^A-Z0-9]/g, "").length < 4} onPress={check} />
        )}
      </Card>
      {found ? (
        <Card accessibilityLiveRegion="polite">
          <View style={{ flexDirection: "row", alignItems: "center", gap: th.space[3] }}>
            <Icon name="checkCircle" size={28} color={th.ok} weight="fill" />
            <View style={{ flex: 1, gap: th.space[1] }}>
              <Text variant="base" bold>
                {found.schoolName}
              </Text>
              <Text variant="sm" tone="muted">
                {found.className ? t("join.classIs", { name: found.className }) : t("join.wholeSchool")}
              </Text>
              <Text variant="sm" tone="muted">
                {t("join.youJoinAsPupil")}
              </Text>
            </View>
          </View>
          <Button label={joinLabel} busy={join.isPending} onPress={joinIt} />
          <Text variant="xs" tone="muted" style={{ textAlign: "center" }}>
            {t("join.sameAccountNote")}
          </Text>
        </Card>
      ) : null}
      <Button label={t("shell.signOut")} variant="ghost" onPress={() => void session.signOut()} />
    </Screen>
  );
}
