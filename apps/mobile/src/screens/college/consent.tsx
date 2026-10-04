import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { studentConsentSchema, type StudentConsentGrant } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Text } from "@/components";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";

/**
 * What I let my guardians see (4 Oct 2026), the web's /student/consent: six
 * grants, each on or off, an adult student's to change whenever they like.
 * A minor, or a pupil at a school, is told their guardians see everything and
 * offered no button.
 */
export function StudentConsentScreen() {
  const t = useT();
  const router = useRouter();
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["student", "consent"], queryFn: async () => studentConsentSchema.parse(unwrap(await api().get("/api/v1/student/consent"))) });
  const save = useMutation({
    mutationFn: async (input: { grant: StudentConsentGrant; on: boolean }) => {
      const result = await api().post("/api/v1/student/consent", input);
      if (!result.ok) throw new Error(errorText(result, t("common.somethingWrong")));
      return studentConsentSchema.parse(result.data);
    },
    onSuccess: (data) => client.setQueryData(["student", "consent"], data),
  });
  const d = query.data;
  const names = d?.guardians.map((g) => g.name).join(", ") ?? "";
  return (
    <Screen title={t("consent.title")} description={d ? (d.applies ? t("consent.intro") : t("consent.notApplies")) : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {save.isError ? (
        <Text variant="sm" tone="danger">
          {save.error.message}
        </Text>
      ) : null}
      {d ? (
        d.guardians.length === 0 ? (
          <Empty icon="users" title={t("consent.noGuardians")} body={t("consent.title")} action={<Button label={t("nav.account")} variant="secondary" onPress={() => router.push("/(app)/account" as never)} />} />
        ) : (
          <Text variant="sm" tone="muted">
            {t("consent.guardiansLine", { names })}
          </Text>
        )
      ) : null}
      {d ? (
        <Card>
          {d.grants.map(({ grant, on }) => (
            <Row
              key={grant}
              title={t(`consent.grant.${grant}.name`)}
              caption={`${t(`consent.grant.${grant}.what`)} · ${on ? t("consent.on") : t("consent.off")}`}
              right={d.applies ? <Button label={on ? t("consent.revokeButton") : t("consent.grantButton")} variant={on ? "secondary" : "primary"} busy={save.isPending && save.variables?.grant === grant} onPress={() => save.mutate({ grant, on: !on })} /> : undefined}
            />
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}
