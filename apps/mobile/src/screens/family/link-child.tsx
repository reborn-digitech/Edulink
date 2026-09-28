import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { communityChildLinkedSchema, communityLinkChildPageSchema } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Failed, Field, Icon, Loading, Row, Screen, Text, useToast } from "@/components";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Chips } from "../staff/shared";

type Relation = "PARENT" | "GUARDIAN" | "OTHER";
const RELATIONS: Relation[] = ["PARENT", "GUARDIAN", "OTHER"];
const RELATION_KEY: Record<Relation, TranslationKey> = { PARENT: "parent.relationParent", GUARDIAN: "parent.relationGuardian", OTHER: "parent.relationOther" };
const DATE = /^\d{4}-\d{2}-\d{2}$/;

type Errors = { studentCode?: string; birthdate?: string; form?: string };
type Refusal = Error & { issues?: Record<string, string> };

/** The web's formatCode: capitals and digits only, shaped STU-XXXX-XXXX as it is typed. */
export function formatStudentCode(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const body = clean.startsWith("STU") ? clean.slice(3) : clean;
  const parts = [body.slice(0, 4), body.slice(4, 8)].filter(Boolean);
  return parts.length > 0 ? `STU-${parts.join("-")}` : clean;
}

/**
 * Linking a child — the web's /parent/link: the student code off the letter
 * home and the child's date of birth, because a code alone gets written on
 * things and read aloud. Every mismatch is the same one sentence and the
 * attempts are limited on the server, per account and per code; a limit
 * comes back with how long to wait. A right pair FILES A CLAIM: the school's
 * office, or a guardian the child already has, decides, and until then the
 * screen names the school and not the child.
 */
export function LinkChild() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const [code, setCode] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [relation, setRelation] = useState<Relation>("PARENT");
  const [errors, setErrors] = useState<Errors>({});
  const [filed, setFiled] = useState<{ schoolName: string } | null>(null);
  const query = useQuery({
    queryKey: ["community", "link-child"],
    queryFn: async () => communityLinkChildPageSchema.parse(unwrap(await api().get("/api/v1/community/link-child"))),
  });
  const link = useMutation({
    mutationFn: async (body: { studentCode: string; birthdate: string; relation: Relation }) => {
      const result = await api().post("/api/v1/community/link-child", body);
      if (!result.ok) {
        const refusal: Refusal = new Error(errorText(result, t("common.somethingWrong")));
        refusal.issues = result.issues;
        throw refusal;
      }
      return communityChildLinkedSchema.parse(result.data);
    },
    onSuccess: ({ pending }) => {
      setErrors({});
      setFiled({ schoolName: pending.schoolName });
      toast.show(t("joinRequests.claimFiledTitle"));
      void qc.invalidateQueries({ queryKey: ["community", "link-child"] });
    },
    onError: (e: Refusal) => {
      const issues = e.issues ?? {};
      // A field the server named sits under that field; anything else — the mismatch, a limit — is the form's one sentence.
      if (issues.studentCode || issues.birthdate) setErrors({ studentCode: issues.studentCode, birthdate: issues.birthdate });
      else {
        setErrors({ form: e.message });
        toast.show(e.message, "danger");
      }
    },
  });

  const children = query.data?.children ?? [];
  const hasChildren = children.length > 0;
  const submit = () => {
    const next: Errors = {};
    if (code.replace(/[^A-Z0-9]/g, "").length < 6) next.studentCode = t("parent.enterFullCode");
    const dob = birthdate.trim();
    if (!dob) next.birthdate = t("parent.enterDob");
    else if (!DATE.test(dob)) next.birthdate = t("join.useRealDate");
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    link.mutate({ studentCode: code, birthdate: dob, relation });
  };
  const again = () => {
    setFiled(null);
    setCode("");
    setBirthdate("");
    setErrors({});
  };

  if (filed) {
    return (
      <Screen title={t("joinRequests.claimFiledTitle")}>
        <View style={{ alignItems: "center", gap: th.space[3], paddingVertical: th.space[4] }}>
          <View style={{ width: 72, height: 72, borderRadius: th.radius.xl, backgroundColor: th.accentSoft, alignItems: "center", justifyContent: "center" }}>
            <Icon name="checkCircle" size={44} color={th.accent} weight="fill" />
          </View>
          <Text variant="base" tone="muted" style={{ textAlign: "center" }} accessibilityLiveRegion="polite">
            {t("joinRequests.claimFiledBody", { school: filed.schoolName })}
          </Text>
        </View>
        <Button label={t("parent.linkAnother")} variant="secondary" onPress={again} />
        {hasChildren ? <Button label={t("parent.seeDashboard")} onPress={() => router.replace("/(app)" as never)} /> : null}
      </Screen>
    );
  }

  const claims = query.data?.claims ?? [];
  return (
    <Screen title={children.length > 0 ? t("parent.addAnotherChild") : t("parent.linkToYourChild")} description={t("parent.linkNeedCode")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {children.length > 0 ? (
        <Card title={t("parent.alreadyLinked")}>
          {children.map((child) => (
            <Row key={child.guardianshipId} icon="user" title={child.name} caption={child.schoolName} />
          ))}
        </Card>
      ) : null}
      {claims.length > 0 ? (
        <Card>
          {claims.map((claim) => (
            <Row key={claim.id} icon="clock" title={t(claim.status === "PENDING" ? "joinRequests.claimWaiting" : "joinRequests.claimDeclined", { school: claim.schoolName })} />
          ))}
        </Card>
      ) : null}
      {errors.form ? <Failed message={errors.form} /> : null}
      <Card>
        <Field
          label={t("parent.studentCode")}
          placeholder="STU-4KDF-3MQ7"
          value={code}
          onChangeText={(next) => setCode(formatStudentCode(next))}
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="off"
          maxLength={32}
          error={errors.studentCode}
          hint={t("parent.codeHint")}
        />
        <Field
          label={t("parent.dateOfBirth")}
          placeholder="YYYY-MM-DD"
          value={birthdate}
          onChangeText={setBirthdate}
          keyboardType="numbers-and-punctuation"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={10}
          error={errors.birthdate}
          hint={t("parent.dobHint")}
        />
        <Chips label={t("parent.youAreTheir")} value={relation} options={RELATIONS.map((r) => ({ value: r, label: t(RELATION_KEY[r]) }))} onChange={setRelation} />
        <Button label={t("parent.linkToMyChild")} icon={<Icon name="handHeart" size={20} color={th.accentFg} weight="bold" />} busy={link.isPending} onPress={submit} />
      </Card>
    </Screen>
  );
}
