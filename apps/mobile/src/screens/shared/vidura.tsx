import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { assistantConversationDetailSchema, assistantConversationListSchema, assistantStatusSchema, type AssistantAbout, type Me } from "@edulink/contracts";
import { Button, Failed, Icon, Loading, Row, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { formatDateTime } from "@/lib/dates";
import { webPageFor } from "@/lib/links";
import { ASSISTANT_NOT_FOR } from "@/lib/nav";
import { Conversation, Offline, isOffline } from "./assistant";

/**
 * VIDURA ON THE PHONE (docs/plans/vidura.md, the owner's decision 2; pass 1, 17 Oct 2026): ONE ENTRY POINT, a round
 * button at the bottom right above the tab bar on every screen, opening Vidura as a bottom sheet over the screen; the
 * More entry and the assistant's own screen are gone (the route /(app)/assistant opens the sheet, for an old link).
 * The history lives inside the sheet. The button is drawn where the web draws it: the operator's ASSISTANT switch on
 * (/api/v1/me `features`), the school's module on (`modules`, a guardian's the children's schools), and never for the
 * expert or the recruiter; where the plan is missing (`locked`) it opens a card saying so with the way to the plan.
 */
export type ViduraAccess = "open" | "plan" | null;

export function viduraAccess(me: Pick<Me, "active" | "modules" | "features" | "locked"> | null): ViduraAccess {
  // The roles the assistant is not for (lib/nav.ts): the expert, the recruiter, and support staff (owner-batch-item2a).
  if (!me?.active.role || ASSISTANT_NOT_FOR.includes(me.active.role)) return null;
  // An older server that sends no `features` predates the switches: the module alone decides, as before.
  const on = (me.features ?? ["ASSISTANT"]).includes("ASSISTANT") && (me.modules ?? []).includes("ASSISTANT");
  if (!on) return null;
  return (me.locked ?? []).includes("ASSISTANT") ? "plan" : "open";
}

/** "Explain this to me" (pass 2): the question in the reader's words and the row it is about. */
export type ExplainRequest = { question: string; about: AssistantAbout };
type Ctx = { access: ViduraAccess; open: (conversationId?: string | null) => void; explain: (request: ExplainRequest) => void };
/** The safe area's insets, or none where no provider is drawn (a test's bare tree). */
function useInsets() {
  return useContext(SafeAreaInsetsContext) ?? { top: 0, bottom: 0, left: 0, right: 0 };
}

const ViduraContext = createContext<Ctx>({ access: null, open: () => {}, explain: () => {} });
/** The sheet's opener, for the old route and for tests. */
export const useVidura = () => useContext(ViduraContext);

const KEY = ["assistant"] as const;

/** The round button and the sheet, above whatever screen the tabs show. */
export function ViduraHost({ access, home, children }: { access: ViduraAccess; home: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [explainRequest, setExplainRequest] = useState<(ExplainRequest & { n: number }) | null>(null);
  const pathname = usePathname();
  const show = useCallback((id?: string | null) => {
    setConversationId(id ?? null);
    setExplainRequest(null);
    setOpen(true);
  }, []);
  // "Explain this to me" (pass 2): a fresh conversation in the sheet that asks about one row of the screen at once.
  const explain = useCallback((request: ExplainRequest) => {
    setConversationId(null);
    setExplainRequest((prior) => ({ ...request, n: (prior?.n ?? 0) + 1 }));
    setOpen(true);
  }, []);
  const ctx = useMemo(() => ({ access, open: show, explain }), [access, show, explain]);
  return (
    <ViduraContext.Provider value={ctx}>
      <View style={{ flex: 1 }}>
        {children}
        {access ? <ViduraButton onPress={() => show(null)} plan={access === "plan"} /> : null}
      </View>
      {access ? <ViduraSheet visible={open} plan={access === "plan"} conversationId={conversationId} page={webPageFor(pathname, home)} explain={explainRequest} onClose={() => setOpen(false)} /> : null}
    </ViduraContext.Provider>
  );
}

/** The round button at the bottom right, above the tab bar, 56 pt. */
export function ViduraButton({ onPress, plan }: { onPress: () => void; plan: boolean }) {
  const t = useT();
  const th = useTheme();
  const insets = useInsets();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={plan ? t("viduraUi.planButton") : t("assistantUi.open")}
      testID="vidura-button"
      style={({ pressed }) => ({
        position: "absolute",
        right: th.space[4],
        bottom: insets.bottom + 56 + th.space[3],
        width: 56,
        height: 56,
        borderRadius: th.radius.xl,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: th.surface,
        borderWidth: 1,
        borderColor: th.border,
        opacity: pressed ? 0.85 : 1,
        shadowColor: "#000",
        shadowOpacity: 0.18,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 6,
      })}
    >
      <Icon name="chats" size={28} color={th.accentStrong} weight="fill" />
    </Pressable>
  );
}

type View_ = { kind: "chat"; round: number } | { kind: "history" } | { kind: "saved"; id: string };

/**
 * The bottom sheet: a modal over the screen (the system back closes it), its header with a new conversation, the
 * conversations of the last thirty days and Close; the conversation below. `page` is the web page the screen stands
 * for (page awareness), when it has one.
 */
export function ViduraSheet({
  visible,
  plan,
  conversationId,
  page,
  onClose,
  explain = null,
}: {
  visible: boolean;
  plan: boolean;
  conversationId: string | null;
  page: string | null;
  onClose: () => void;
  /** "Explain this to me" (pass 2): asked at once in a new conversation; `n` tells a second press from the first. */
  explain?: (ExplainRequest & { n: number }) | null;
}) {
  const t = useT();
  const th = useTheme();
  const insets = useInsets();
  const router = useRouter();
  const [view, setView] = useState<View_>({ kind: "chat", round: 0 });
  const [wanted, setWanted] = useState<string | null>(null);
  if (visible && conversationId && wanted !== conversationId) {
    setWanted(conversationId);
    setView({ kind: "saved", id: conversationId });
  }
  const [explained, setExplained] = useState<number | null>(null);
  if (visible && explain && explained !== explain.n) {
    setExplained(explain.n);
    setView((v) => ({ kind: "chat", round: (v.kind === "chat" ? v.round : 0) + 1 }));
  }
  const status = useQuery({ queryKey: [...KEY, "status"], enabled: visible && !plan, queryFn: async () => assistantStatusSchema.parse(unwrap(await api().get("/api/v1/assistant"))) });
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        {/* The screen behind, dimmed by the frame's own colour; a tap on it closes the sheet. */}
        <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: th.frame.surface, opacity: 0.55 }} />
        <Pressable accessibilityRole="button" accessibilityLabel={t("assistantUi.close")} style={{ flex: 1 }} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ height: "88%" }}>
          <View accessibilityViewIsModal style={{ flex: 1, backgroundColor: th.canvas, borderTopLeftRadius: th.radius.xl, borderTopRightRadius: th.radius.xl, overflow: "hidden" }} testID="vidura-sheet">
            <View style={{ flexDirection: "row", alignItems: "center", gap: th.space[1], paddingHorizontal: th.space[3], paddingVertical: th.space[2], borderBottomWidth: 1, borderColor: th.border, backgroundColor: th.surface }}>
              {view.kind !== "chat" && !plan ? <IconButton icon="caretLeft" label={t("viduraUi.historyBack")} onPress={() => setView({ kind: "chat", round: 0 })} /> : null}
              <Text variant="lg" bold accessibilityRole="header" level={2} style={{ flex: 1 }}>
                {view.kind === "history" ? t("viduraUi.history") : t("assistantUi.title")}
              </Text>
              {plan ? null : <IconButton icon="pencil" label={t("assistantUi.newConversation")} onPress={() => setView((v) => ({ kind: "chat", round: (v.kind === "chat" ? v.round : 0) + 1 }))} />}
              {plan ? null : <IconButton icon="clockCounterClockwise" label={t("viduraUi.history")} onPress={() => setView({ kind: "history" })} />}
              <IconButton icon="x" label={t("assistantUi.close")} onPress={onClose} />
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: th.space[4], paddingBottom: insets.bottom + th.space[6], gap: th.space[3] }}>
              {plan ? (
                <View style={{ gap: th.space[3] }} testID="vidura-plan">
                  <Text variant="base" bold>
                    {t("viduraUi.planTitle")}
                  </Text>
                  <Text variant="sm" tone="muted">
                    {t("viduraUi.planBody")}
                  </Text>
                  <Button
                    label={t("viduraUi.planOpen")}
                    onPress={() => {
                      onClose();
                      router.push("/(app)/account" as never);
                    }}
                  />
                </View>
              ) : status.isPending ? (
                <Loading />
              ) : status.isError ? (
                isOffline(status.error) ? <Offline onRetry={() => void status.refetch()} /> : <Failed error={status.error} onRetry={() => void status.refetch()} />
              ) : status.data ? (
                view.kind === "history" ? (
                  <History onOpen={(id) => setView({ kind: "saved", id })} />
                ) : view.kind === "saved" ? (
                  <Saved key={view.id} id={view.id} status={status.data} page={page} onDeleted={() => setView({ kind: "history" })} onLeave={onClose} />
                ) : (
                  <Conversation key={view.round} status={status.data} conversationId={null} initial={[]} page={page} onLeave={onClose} autoAsk={explain && explained === explain.n ? explain : null} />
                )
              ) : null}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function IconButton({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  const th = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={4} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: th.radius.lg }}>
      <Icon name={icon} size={22} color={th.fgMuted} />
    </Pressable>
  );
}

/** The conversations of the last thirty days, inside the sheet. */
function History({ onOpen }: { onOpen: (id: string) => void }) {
  const t = useT();
  const th = useTheme();
  const list = useQuery({ queryKey: [...KEY, "list"], queryFn: async () => assistantConversationListSchema.parse(unwrap(await api().get("/api/v1/assistant/conversations"))) });
  if (list.isPending) return <Loading />;
  if (list.isError) return isOffline(list.error) ? <Offline onRetry={() => void list.refetch()} /> : <Failed error={list.error} onRetry={() => void list.refetch()} />;
  return (
    <View style={{ gap: th.space[2] }}>
      <Text variant="sm" tone="muted">
        {t("assistantUi.conversationsBody")}
      </Text>
      {list.data.conversations.length === 0 ? (
        <View testID="assistant-no-conversations">
          <Text variant="base" bold>
            {t("assistantUi.noConversations")}
          </Text>
          <Text variant="sm" tone="muted">
            {t("assistantUi.noConversationsBody")}
          </Text>
        </View>
      ) : (
        list.data.conversations.map((c) => <Row key={c.id} title={c.title ?? t("assistantUi.newConversation")} caption={t("assistantUi.lastWhen", { when: formatDateTime(c.lastAt) })} onPress={() => onOpen(c.id)} />)
      )}
    </View>
  );
}

/** One saved conversation, to re-read, go on with, and delete. */
function Saved({ id, status, page, onDeleted, onLeave }: { id: string; status: NonNullable<ReturnType<typeof assistantStatusSchema.parse>>; page: string | null; onDeleted: () => void; onLeave: () => void }) {
  const detail = useQuery({ queryKey: [...KEY, "one", id], queryFn: async () => assistantConversationDetailSchema.parse(unwrap(await api().get(`/api/v1/assistant/conversations/${encodeURIComponent(id)}`))) });
  if (detail.isPending) return <Loading />;
  if (detail.isError) return isOffline(detail.error) ? <Offline onRetry={() => void detail.refetch()} /> : <Failed error={detail.error} onRetry={() => void detail.refetch()} />;
  return <Conversation status={status} conversationId={id} initial={detail.data.messages} page={page} onDeleted={onDeleted} onLeave={onLeave} />;
}

const EXPLAIN_QUESTION = { FEE_DEMAND: "viduraUi.explainFeeQuestion", REPORT_LINE: "viduraUi.explainLineQuestion", ATTENDANCE: "viduraUi.explainAttendanceQuestion" } as const;
const EXPLAIN_LABEL = { FEE_DEMAND: "viduraUi.explainFeeLabel", REPORT_LINE: "viduraUi.explainLineLabel", ATTENDANCE: "viduraUi.explainAttendanceLabel" } as const;

/**
 * "EXPLAIN THIS TO ME" ON THE PHONE (docs/plans/vidura.md; pass 2, 17 Oct 2026): a small link beside a fee demand, a
 * report card's line and an attendance figure on the family's and the staff's own screens, opening Vidura's sheet on
 * a new conversation that asks about that row (`about`; the server reads it again through the person's own door).
 * Drawn only where Vidura is this person's (`access` "open"), never inside another pressable.
 */
export function ExplainThis({ about, label }: { about: AssistantAbout; label: string }) {
  const t = useT();
  const th = useTheme();
  const { access, explain } = useVidura();
  if (access !== "open") return null;
  return (
    <Pressable
      onPress={() => explain({ question: t(EXPLAIN_QUESTION[about.kind]), about })}
      accessibilityRole="button"
      accessibilityLabel={t(EXPLAIN_LABEL[about.kind], { label })}
      testID="vidura-explain"
      hitSlop={4}
      style={({ pressed }) => ({ minHeight: th.tap, flexDirection: "row", alignItems: "center", gap: th.space[1], alignSelf: "flex-start", opacity: pressed ? 0.7 : 1 })}
    >
      <Icon name="lightbulb" size={18} color={th.accentStrong} weight="bold" />
      <Text variant="sm" tone="accent" bold>
        {t("viduraUi.explainThis")}
      </Text>
    </Pressable>
  );
}
