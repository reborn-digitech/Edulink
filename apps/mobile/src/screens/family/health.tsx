import { useState } from "react";
import { usePrivateScreen } from "@/lib/private-screen";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { familyChildrenSchema, healthCardSchema, type HealthCardSave } from "@edulink/contracts";
import { Button, Empty, Failed, Loading, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useRole } from "@/lib/session";
import { must, Refusal } from "../staff/shared";
import { HealthCardForm, HealthCardView, HealthChecks, SavedNote } from "../shared/health";
import { ChildLeftBanner, ChildSwitcher, childQuery, param } from "./shared";

const PATH = "/api/v1/family/health";

/**
 * A child's health and emergency card for the guardian — the web's
 * /parent/health: the card read-only with "Edit the card" opening the whole
 * form, one POST that writes the card as a whole, and the school's check-ups
 * underneath, read-only. The switcher's children come from /family/children
 * as the overview's do; the card endpoint answers for one child at a time.
 */
export function FamilyHealth() {
  // A child's record, a register, a message: private while on screen (no screenshots or screen recording on the phone).
  usePrivateScreen();
  const t = useT();
  const role = useRole();
  const router = useRouter();
  const qc = useQueryClient();
  const params = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  const [childId, setChildId] = useState<string | null>(param(params.childId) ?? param(params.child) ?? null);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const children = useQuery({
    queryKey: ["family", "children"],
    enabled: role === "PARENT",
    queryFn: async () => familyChildrenSchema.parse(unwrap(await api().get("/api/v1/family/children"))),
  });
  const query = useQuery({
    queryKey: ["family", "health", childId],
    enabled: role === "PARENT",
    queryFn: async () => healthCardSchema.parse(unwrap(await api().get(`${PATH}${childQuery(childId)}`))),
  });
  const d = query.data;
  const save = useMutation({
    mutationFn: async (body: HealthCardSave) => healthCardSchema.parse(must(await api().post(PATH, { ...body, ...(d ? { childId: d.studentMembershipId } : {}) }), t("common.somethingWrong"))),
    onSuccess: (next) => {
      qc.setQueryData(["family", "health", childId], next);
      setEditing(false);
      setRefusal(null);
      setSaved(true);
    },
    onError: (e) => setRefusal(e instanceof Refusal ? e : new Refusal(e.message, 0, {})),
  });
  if (role !== null && role !== "PARENT") {
    return (
      <Screen title={t("health.title")}>
        <Empty icon="heart" title={t("health.title")} body={t("health.noCardStaffBody")} action={<Button label={t("nav.overview")} variant="secondary" onPress={() => router.push("/(app)" as never)} />} />
      </Screen>
    );
  }
  const pupils = children.data?.children ?? [];
  const selected = pupils.find((c) => c.studentMembershipId === (d?.studentMembershipId ?? childId));
  return (
    <Screen title={d ? t("health.forChild", { name: d.studentName }) : t("health.title")} description={d?.className ?? undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <ChildSwitcher
        pupils={pupils}
        selectedId={d?.studentMembershipId ?? childId}
        onSelect={(id) => {
          setChildId(id);
          setEditing(false);
          setSaved(false);
          setRefusal(null);
        }}
      />
      {selected?.leftAt ? <ChildLeftBanner name={selected.name} leftAt={selected.leftAt} /> : null}
      <Text variant="sm" tone="muted">
        {t("health.intro")}
      </Text>
      {query.isPending ? <Loading /> : null}
      {query.isError ? (
        children.data && pupils.length === 0 ? (
          <Empty title={t("parent.linkToYourChild")} body={t("parent.linkNeedCode")} action={<Button label={t("parent.linkToMyChild")} onPress={() => router.push("/(app)/link-child" as never)} />} />
        ) : (
          <Failed message={query.error.message} onRetry={() => void query.refetch()} />
        )
      ) : null}
      {d ? (
        <>
          {saved && !editing ? <SavedNote text={t("health.saved")} /> : null}
          {editing ? (
            <HealthCardForm
              key={d.card?.updatedAt ?? "new"}
              initial={d.card}
              busy={save.isPending}
              refusal={refusal}
              onSave={(body) => save.mutate(body)}
              onCancel={() => {
                setEditing(false);
                setRefusal(null);
              }}
            />
          ) : (
            <HealthCardView
              view={d}
              onEdit={
                d.canEdit
                  ? () => {
                      setSaved(false);
                      setEditing(true);
                    }
                  : undefined
              }
            />
          )}
          <HealthChecks checks={d.checks} />
        </>
      ) : null}
    </Screen>
  );
}
