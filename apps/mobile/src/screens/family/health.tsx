import { useState } from "react";
import { usePrivateScreen } from "@/lib/private-screen";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { familyChildrenSchema, healthCardReadsSchema, healthCardSchema, type HealthCardSave } from "@edulink/contracts";
import { Pressable, View } from "react-native";
import { Button, Card, Empty, Failed, Icon, Loading, Row, Screen, Text } from "@/components";
import { useTheme } from "@/lib/theme";
import type { TranslationKey } from "@edulink/i18n";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useRole } from "@/lib/session";
import { must, Refusal } from "../staff/shared";
import { HealthCardForm, HealthCardView, HealthChecks, SavedNote } from "../shared/health";
import { ChildLeftBanner, ChildSwitcher, childQuery, formatInstant, param } from "./shared";

const PATH = "/api/v1/family/health";
const ROLE_KEY: Record<"ADMIN" | "PRINCIPAL" | "TEACHER" | "WARDEN", TranslationKey> = { ADMIN: "familyCare.readsRoleADMIN", PRINCIPAL: "familyCare.readsRolePRINCIPAL", TEACHER: "familyCare.readsRoleTEACHER", WARDEN: "familyCare.readsRoleWARDEN" };

/**
 * A child's health and emergency card for the guardian — the web's
 * /parent/health: the card read-only with "Edit the card" opening the whole
 * form, one POST that writes the card as a whole, and the school's check-ups
 * underneath, read-only. The switcher's children come from /family/children
 * as the overview's do; the card endpoint answers for one child at a time.
 * A pupil reads their own card, read-only, from the age the school sets;
 * refused (403) they are shown "ask a grown-up". The guardian also sees who
 * at the school has opened the card, under a disclosure.
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
    queryKey: ["family", "health", role === "STUDENT" ? "mine" : childId],
    enabled: role === "PARENT" || role === "STUDENT",
    retry: false,
    queryFn: async () => {
      const result = await api().get(`${PATH}${role === "STUDENT" ? "" : childQuery(childId)}`);
      if (!result.ok && result.status === 403 && role === "STUDENT") throw new Refusal(result.error, 403, {});
      return healthCardSchema.parse(unwrap(result));
    },
  });
  const d = query.data;
  const save = useMutation({
    // The card the form was drawn from (TA-111): a card changed since is a 409 and kept, and the screen reloads it.
    mutationFn: async (body: HealthCardSave) => healthCardSchema.parse(must(await api().post(PATH, { ...body, basedOn: d?.card?.updatedAt ?? null, ...(d ? { childId: d.studentMembershipId } : {}) }), t("common.somethingWrong"))),
    onSuccess: (next) => {
      qc.setQueryData(["family", "health", childId], next);
      setEditing(false);
      setRefusal(null);
      setSaved(true);
    },
    onError: (e) => {
      setRefusal(e instanceof Refusal ? e : new Refusal(e.message, 0, {}));
      if (e instanceof Refusal && e.status === 409) void query.refetch();
    },
  });
  if (role === "STUDENT") {
    const refused = query.isError && query.error instanceof Refusal && query.error.status === 403;
    return (
      <Screen title={t("familyCare.myHealthTitle")} description={d ? t("familyCare.myHealthBody") : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
        {query.isPending ? <Loading /> : null}
        {refused ? <Empty icon="shield" title={t("familyCare.askGrownUpTitle")} body={t("familyCare.askGrownUpBody")} action={<Button label={t("nav.overview")} variant="secondary" onPress={() => router.push("/(app)" as never)} />} /> : null}
        {query.isError && !refused ? <Failed error={query.error} onRetry={() => void query.refetch()} /> : null}
        {d ? (
          <>
            <HealthCardView view={d} />
            <HealthChecks checks={d.checks} />
          </>
        ) : null}
      </Screen>
    );
  }
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
          <Failed error={query.error} onRetry={() => void query.refetch()} />
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
          <WhoRead studentMembershipId={d.studentMembershipId} childName={d.studentName} />
        </>
      ) : null}
    </Screen>
  );
}

/**
 * "Who has read this": the staff reads of the card in the last ninety days,
 * closed until pressed, read then — a parent who never opens it costs the
 * server nothing.
 */
function WhoRead({ studentMembershipId, childName }: { studentMembershipId: string; childName: string }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const query = useQuery({
    queryKey: ["family", "health-reads", studentMembershipId],
    enabled: open,
    queryFn: async () => healthCardReadsSchema.parse(unwrap(await api().get(`/api/v1/family/students/${studentMembershipId}/health/reads`))),
  });
  const d = query.data;
  return (
    <Card testID="health-card-reads">
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen((v) => !v)} style={{ minHeight: th.tap, flexDirection: "row", alignItems: "center", gap: th.space[2] }}>
        <Icon name="eye" size={20} color={th.fgMuted} weight="duotone" />
        <Text variant="base" bold style={{ flex: 1 }}>
          {t("familyCare.readsTitle")}
        </Text>
        <Icon name={open ? "x" : "caretRight"} size={16} color={th.fgSubtle} />
      </Pressable>
      {open ? (
        <View style={{ gap: th.space[2] }}>
          {query.isPending ? <Loading /> : null}
          {query.isError ? <Failed error={query.error} onRetry={() => void query.refetch()} /> : null}
          {d ? (
            <>
              <Text variant="xs" tone="muted">
                {t("familyCare.readsBody", { name: childName, days: d.days })}
              </Text>
              {d.reads.length === 0 ? (
                <Text variant="sm" tone="subtle">
                  {t("familyCare.readsNone", { days: d.days })}
                </Text>
              ) : (
                d.reads.map((r) => <Row key={r.id} title={`${r.readerName} (${t(ROLE_KEY[r.readerRole])})`} caption={formatInstant(r.readAt, locale)} />)
              )}
            </>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}
