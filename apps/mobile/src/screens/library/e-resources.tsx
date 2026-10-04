import { useState } from "react";
import { Linking } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { eResourceOpenSchema, eResourcesSchema } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Loading, Row, Screen } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { Notice } from "../staff/shared";

/**
 * A college's e-resources on the phone (campaign 2026-10-04, G-3), the web's
 * /library/e-resources: a student, a faculty member or an HOD opens N-LIST,
 * DELNET or a journal THROUGH the app — POST
 * /api/v1/library/eresources/{id}/open counts the open for the library's
 * criterion-4 numbers and answers the link — and the phone hands the https
 * link to the browser. The publisher's link itself is never opened directly.
 */
export function EResourcesScreen() {
  const t = useT();
  const router = useRouter();
  const session = useSession();
  const [error, setError] = useState<string | null>(null);
  const list = useQuery({ queryKey: ["library", "eresources"], queryFn: async () => eResourcesSchema.parse(unwrap(await api().get("/api/v1/library/eresources"))) });
  const open = useMutation({
    mutationFn: async (id: string) => eResourceOpenSchema.parse(unwrap(await api().post(`/api/v1/library/eresources/${encodeURIComponent(id)}/open`, {}))),
    onMutate: () => setError(null),
    onSuccess: async ({ url }) => {
      if (!url.startsWith("https://")) return setError(t("collegeOffice.refuseUrl"));
      await Linking.openURL(url).catch(() => setError(t("common.somethingWrong")));
    },
    onError: (e: Error) => setError(e.message || t("common.somethingWrong")),
  });
  const more = <Button label={t("nav.more")} variant="secondary" onPress={() => router.push("/(app)/more" as never)} />;
  if (session.status === "signed-in" && !(session.me.modules ?? []).includes("LIBRARY")) {
    return (
      <Screen title={t("collegeOffice.eResourcesTitle")}>
        <Empty icon="puzzle" title={t("modules.offTitle", { module: t("modules.libraryName") })} body={t("modules.offBodyCollege", { module: t("modules.libraryName") })} action={more} />
      </Screen>
    );
  }
  const items = list.data?.items ?? [];
  return (
    <Screen title={t("collegeOffice.eResourcesTitle")} description={t("collegeOffice.eResourcesIntro")} refreshing={list.isRefetching} onRefresh={() => void list.refetch()}>
      {error ? <Notice text={error} tone="danger" /> : null}
      {list.isPending ? <Loading /> : null}
      {list.isError ? <Failed message={list.error.message} onRetry={() => void list.refetch()} /> : null}
      {list.data && items.length === 0 ? <Empty icon="globe" title={t("collegeOffice.eResourcesEmpty")} body={t("collegeOffice.eResourcesEmptyBody")} action={more} /> : null}
      {items.length > 0 ? (
        <Card>
          {items.map((e) => (
            <Row
              key={e.id}
              icon="globe"
              title={e.name}
              caption={t(`collegeOffice.ekind${e.kind}` as TranslationKey)}
              right={<Button label={t("collegeOffice.eResourceOpen")} accessibilityLabel={t("collegeOffice.eResourceOpenLabel", { name: e.name })} variant="secondary" disabled={open.isPending} onPress={() => open.mutate(e.id)} />}
            />
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}
