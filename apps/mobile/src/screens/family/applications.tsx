import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { applicationsListSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useRole } from "@/lib/session";
import { nextStepKey, StagePill } from "../shared/application";

export const MY_APPLICATIONS_KEY = ["family", "applications"];
const PATH = "/api/v1/family/applications";

/**
 * The guardian's applications, everywhere — the web's /parent/applications:
 * each with the child, the school, the cycle, the stage as a pill and the
 * next step under it, opening the application. A guardian with no child
 * linked yet reaches it too: applying is how a child comes to be linked.
 */
export function FamilyApplications() {
  const t = useT();
  const router = useRouter();
  const query = useQuery({ queryKey: MY_APPLICATIONS_KEY, queryFn: async () => applicationsListSchema.parse(unwrap(await api().get(PATH))) });
  const items = query.data?.items ?? [];
  return (
    <Screen title={t("admissions.myApplications")} description={t("admissions.myApplicationsIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {query.data ? (
        items.length === 0 ? (
          <Empty icon="buildings" title={t("admissions.noneYet")} body={t("admissions.noneYetBody")} action={<Button label={t("admissions.findSchools")} variant="secondary" onPress={() => router.push("/(app)/explore" as never)} />} />
        ) : (
          <Card>
            {items.map((a) => (
              <Row
                key={a.id}
                title={a.childName}
                caption={[a.schoolName, a.cycleName, `${t("admissions.grade")} ${a.gradeApplied}`, t(nextStepKey(a))].join(" · ")}
                right={<StagePill status={a.status} />}
                onPress={() => router.push({ pathname: "/(app)/my-application", params: { id: a.id } } as never)}
              />
            ))}
          </Card>
        )
      ) : null}
    </Screen>
  );
}

/**
 * The card on the guardian's overview while they have applications: up to
 * three with their stage, and the door to the list. Nothing while it
 * loads, fails, or there are none — the card is a nudge, not a section.
 */
export function FamilyApplicationsCard() {
  const t = useT();
  const role = useRole();
  const router = useRouter();
  const query = useQuery({ queryKey: MY_APPLICATIONS_KEY, enabled: role === "PARENT", queryFn: async () => applicationsListSchema.parse(unwrap(await api().get(PATH))) });
  const items = query.data?.items ?? [];
  if (items.length === 0) return null;
  return (
    <Card title={t("admissions.myApplications")} action={<Button variant="ghost" label={t("nav.applications")} onPress={() => router.push("/(app)/my-applications" as never)} />}>
      {items.slice(0, 3).map((a) => (
        <Row key={a.id} title={a.childName} caption={`${a.schoolName} · ${t(nextStepKey(a))}`} right={<StagePill status={a.status} />} onPress={() => router.push({ pathname: "/(app)/my-application", params: { id: a.id } } as never)} />
      ))}
      {items.length > 3 ? (
        <Text variant="xs" tone="muted">
          {t("admissions.myApplicationsIntro")}
        </Text>
      ) : null}
    </Card>
  );
}
