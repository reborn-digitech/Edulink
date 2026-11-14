import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { familyChildrenSchema, familyHostelSchema, hostelLeaveRowSchema, HOSTEL_LEAVE_KINDS, type HostelLeaveKind } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { usePrivateScreen } from "@/lib/private-screen";
import { useLocale, useT } from "@/lib/i18n";
import { useRole, useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { Chips, Notice } from "../staff/shared";
import { ChildSwitcher, childQuery } from "../family/shared";
import { LEAVE_KIND_KEY, LEAVE_STATUS_KEY, MEAL_KEY, ROLL_KEY, SLOT_KEY, WHEN_HINT, instantOf, whenOf } from "./words";

/**
 * A boarder's hostel on the phone (module HOSTEL, 3 Oct 2026) — the web's
 * /student/hostel and /parent/hostel: the room and bed, tonight's roll call,
 * today's menu, and leave. A pupil asks (a minor's ask waits for a guardian);
 * a guardian's own ask is their consent, and they consent to the child's.
 * The server reaches only the reader's own child.
 */
export function FamilyHostelScreen() {
  usePrivateScreen();
  const t = useT();
  const { locale } = useLocale();
  const th = useTheme();
  const role = useRole();
  const router = useRouter();
  const session = useSession();
  const qc = useQueryClient();
  const parent = role === "PARENT";
  const [childId, setChildId] = useState<string | null>(null);
  const [kind, setKind] = useState<HostelLeaveKind>("HOME");
  const [destination, setDestination] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const children = useQuery({ queryKey: ["family", "children"], enabled: parent, queryFn: async () => familyChildrenSchema.parse(unwrap(await api().get("/api/v1/family/children"))) });
  const h = useQuery({ queryKey: ["family", "hostel", childId], queryFn: async () => familyHostelSchema.parse(unwrap(await api().get(`/api/v1/family/hostel${childQuery(childId)}`))) });
  const done = (text: string) => {
    setNotice({ tone: "ok", text });
    void qc.invalidateQueries({ queryKey: ["family", "hostel"] });
  };
  const failed = (e: Error) => setNotice({ tone: "danger", text: e.message });
  const ask = useMutation({
    mutationFn: async (body: Record<string, unknown>) => hostelLeaveRowSchema.parse(unwrap(await api().post("/api/v1/family/hostel/leave", body))),
    onSuccess: (l) => {
      done(l.status === "AWAITING_CONSENT" ? t("hostel.askedNeedsConsent") : t("hostel.askedToWarden"));
      setDestination("");
      setFrom("");
      setTo("");
      setReason("");
    },
    onError: failed,
  });
  const answer = useMutation({
    mutationFn: async (input: { id: string; approve: boolean }) => hostelLeaveRowSchema.parse(unwrap(await api().post(`/api/v1/family/hostel/leave/${input.id}/consent`, { approve: input.approve }))),
    onSuccess: (_l, input) => done(input.approve ? t("hostel.consented") : t("hostel.consentRefused")),
    onError: failed,
  });
  const takeBack = useMutation({
    mutationFn: async (id: string) => hostelLeaveRowSchema.parse(unwrap(await api().post(`/api/v1/family/hostel/leave/${id}/cancel`, {}))),
    onSuccess: () => done(t("hostel.leaveCancelled")),
    onError: failed,
  });
  const offHere = session.status === "signed-in" && !parent && !(session.me.modules ?? []).includes("HOSTEL");
  if (offHere) {
    return (
      <Screen title={t("modules.hostelName")}>
        <Empty icon="puzzle" title={t("modules.offTitle", { module: t("modules.hostelName") })} body={t("modules.offBody", { module: t("modules.hostelName") })} action={<Button label={t("nav.more")} variant="secondary" onPress={() => router.push("/(app)/more" as never)} />} />
      </Screen>
    );
  }
  const submit = () => {
    // On the school's clock (TA-500), as the web reads a leave's times; the device's only for an older server.
    const fromAt = instantOf(from, h.data?.timeZone);
    const toAt = instantOf(to, h.data?.timeZone);
    if (!destination.trim() || !fromAt || !toAt) {
      setFormError(t("common.checkTheForm"));
      return;
    }
    setFormError(null);
    ask.mutate({ ...(childId ? { childId } : {}), kind, destination: destination.trim(), fromAt, toAt, reason: reason.trim() });
  };
  const d = h.data;
  const a = d?.allotment;
  return (
    <Screen title={t("modules.hostelName")} description={d ? (a ? t("hostel.familyIntro", { name: d.child.name }) : t("hostel.notBoarding", { name: d.child.name })) : undefined} refreshing={h.isRefetching} onRefresh={() => void h.refetch()}>
      {parent ? <ChildSwitcher pupils={children.data?.children ?? []} selectedId={childId} onSelect={setChildId} /> : null}
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      {h.isPending ? <Loading /> : null}
      {h.isError ? <Failed message={h.error.message} onRetry={() => void h.refetch()} /> : null}
      {a && d ? (
        <>
          <Card title={a.hostelName}>
            <Text>{t("hostel.roomBed", { room: a.roomNumber, bed: a.bed })}</Text>
            {a.wardenName ? <Text variant="sm" tone="muted">{t("hostel.wardenIs", { name: a.wardenName })}</Text> : null}
          </Card>
          <Card title={t("hostel.tonightTitle")}>
            <Text bold tone={d.tonight.status === "ABSENT" ? "danger" : "fg"}>
              {d.tonight.status === "NOT_TAKEN" ? t("hostel.rollNOT_TAKEN") : `${t(SLOT_KEY[d.tonight.slot])}: ${t(ROLL_KEY[d.tonight.status])}`}
            </Text>
          </Card>
          <Card title={t("hostel.menuToday")}>
            {d.menuToday.length === 0 ? <Text tone="muted">{t("hostel.noMenu")}</Text> : null}
            {d.menuToday.map((m) => (
              <Row key={m.meal} title={t(MEAL_KEY[m.meal])} caption={m.items} />
            ))}
          </Card>
          <Card title={t("hostel.askLeave")}>
            <Text variant="sm" tone="muted">
              {parent ? t("hostel.askLeaveGuardian") : t("hostel.askLeavePupil")}
            </Text>
            <Chips label={t("hostel.leaveKind")} value={kind} onChange={setKind} options={HOSTEL_LEAVE_KINDS.map((k) => ({ value: k, label: t(LEAVE_KIND_KEY[k]) }))} />
            <Field label={t("hostel.destination")} value={destination} onChangeText={setDestination} />
            <Field label={t("hostel.leaveFrom")} hint={WHEN_HINT} value={from} onChangeText={setFrom} autoCorrect={false} />
            <Field label={t("hostel.leaveTo")} hint={WHEN_HINT} value={to} onChangeText={setTo} autoCorrect={false} error={formError} />
            <Field label={t("hostel.leaveReason")} value={reason} onChangeText={setReason} />
            <Button label={t("hostel.askLeaveButton")} busy={ask.isPending} onPress={submit} />
          </Card>
        </>
      ) : null}
      {d ? (
        <Card title={t("hostel.leaveTitle")}>
          {d.leave.length === 0 ? <Text tone="muted">{t("hostel.noLeave")}</Text> : null}
          {d.leave.map((l) => {
            // Both answers sit under the leave they answer: "Do not consent" used to
            // trail the whole list, away from the night-out it refused (A3-journeys-29).
            const asked = d.canConsent && l.status === "AWAITING_CONSENT";
            return (
              <View key={l.id} style={{ gap: th.space[2] }}>
                <Row
                  title={`${t(LEAVE_KIND_KEY[l.kind])} · ${l.destination}`}
                  caption={`${t("hostel.fromTo", { from: whenOf(l.fromAt, locale, d.timeZone), to: whenOf(l.toAt, locale, d.timeZone) })} · ${t(LEAVE_STATUS_KEY[l.status])}${l.late ? ` · ${t("hostel.late")}` : ""}`}
                  right={!asked && !l.outAt && ["AWAITING_CONSENT", "PENDING", "APPROVED"].includes(l.status) ? <Button label={t("hostel.cancelLeave")} variant="ghost" disabled={takeBack.isPending} onPress={() => takeBack.mutate(l.id)} /> : undefined}
                />
                {asked ? (
                  <View testID={`consent-${l.id}`} style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
                    <Button label={t("hostel.consent")} disabled={answer.isPending} onPress={() => answer.mutate({ id: l.id, approve: true })} />
                    <Button label={t("hostel.refuseConsent")} variant="ghost" disabled={answer.isPending} onPress={() => answer.mutate({ id: l.id, approve: false })} />
                  </View>
                ) : null}
              </View>
            );
          })}
        </Card>
      ) : null}
    </Screen>
  );
}
