import { useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { NO_DUES_EVENT_CODES, noDuesDeskSchema, noDuesEventSchema, noDuesListSchema, noDuesSchema, type RoleCode } from "@edulink/contracts";
import type { z } from "zod";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, ShowMore, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { usePrivateScreen } from "@/lib/private-screen";
import { useRole } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { Chips, Notice } from "../staff/shared";
import { Pill } from "../family/shared";
import { OfflineDecisionNote, money } from "@/screens/shared/desk";

type NoDuesDesk = z.infer<typeof noDuesDeskSchema>;
type NoDuesEvent = z.infer<typeof noDuesEventSchema>;

const DESK_KEY: Record<NoDuesDesk, TranslationKey> = { ACCOUNTS: "collegeOffice.deskACCOUNTS", LIBRARY: "collegeOffice.deskLIBRARY", HOSTEL: "collegeOffice.deskHOSTEL", LAB: "collegeOffice.deskLAB" };
/** Which line is a role's own to clear; the office clears any (the web's accounts/no-dues page). */
const OWN_DESK: Partial<Record<RoleCode, NoDuesDesk>> = { ACCOUNTS: "ACCOUNTS", LIBRARIAN: "LIBRARY", WARDEN: "HOSTEL", HOD: "LAB" };

/**
 * The no-dues desk on the phone (the parity batch, 10 Oct 2026, R-4), the
 * web's /accounts/no-dues for the accounts desk, the library, the hostel,
 * a department and the office: for an event (the exam form, leaving the
 * hostel, leaving the college) every active student with a line still open
 * and the desks named; one chosen opens the clearance line by line, and a
 * desk clears its own line by hand through the web's door (POST
 * .../no-dues/{id}), with a note when money is still owed or items are
 * still out. A clearance is a decision, sent live and never queued.
 */
export function NoDuesDeskScreen() {
  // No screenshots while it is up (A3-S-12): students and what they owe.
  usePrivateScreen();
  const t = useT();
  const role = useRole();
  // No module gate (TA-352): the no-dues doors need none (api-catalog/accounts.ts), so ACADEMICS off leaves this screen as it is on the web.
  const [event, setEvent] = useState<NoDuesEvent>("EXAM_FORM");
  const [chosen, setChosen] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const list = useQuery({ queryKey: ["accounts", "no-dues", "list", event], queryFn: async () => noDuesListSchema.parse(unwrap(await api().get(`/api/v1/accounts/no-dues?event=${event}`))) });
  const items = list.data?.items ?? [];
  return (
    <Screen title={t("collegeOffice.navNoDues")} description={t("deskParity.noDuesIntro")} refreshing={list.isRefetching} onRefresh={() => void list.refetch()}>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      <Chips
        label={t("deskParity.noDuesEvent")}
        value={event}
        options={NO_DUES_EVENT_CODES.map((e) => ({ value: e, label: t(`collegeOffice.event${e}` as TranslationKey) }))}
        onChange={(e) => {
          setEvent(e);
          setChosen(null);
        }}
      />
      {list.isPending ? <Loading /> : null}
      {list.isError ? <Failed message={list.error.message} onRetry={() => void list.refetch()} /> : null}
      {list.data && items.length === 0 ? <Empty icon="checks" title={t("deskParity.noDuesAllClear")} body={t("deskParity.noDuesAllClearBody")} action={<Button label={t("common.retry")} variant="secondary" onPress={() => void list.refetch()} />} /> : null}
      {items.length > 0 ? (
        <Card title={t("deskParity.noDuesOpen", { count: items.length })}>
          <ShowMore items={items}>
            {(page) =>
              page.map((s) => (
                <Row
                  key={s.studentMembershipId}
                  title={s.studentName}
                  caption={`${t("collegeOffice.colOpenDesks")}: ${s.uncleared.map((d) => t(DESK_KEY[d])).join(", ")}`}
                  right={chosen === s.studentMembershipId ? <Pill label={t("collegeDesks.lookupShown")} tone="accent" /> : undefined}
                  onPress={() => setChosen(s.studentMembershipId)}
                />
              ))
            }
          </ShowMore>
        </Card>
      ) : null}
      {chosen ? <ClearanceCard studentMembershipId={chosen} event={event} ownDesk={role === "ADMIN" ? "ANY" : (role && OWN_DESK[role]) || null} onDone={setNotice} /> : null}
    </Screen>
  );
}

/** One student's clearance for the event: each desk's line, and the button to clear my own. */
export function ClearanceCard({ studentMembershipId, event, ownDesk, onDone }: { studentMembershipId: string; event: NoDuesEvent; ownDesk: NoDuesDesk | "ANY" | null; onDone: (n: { tone: "ok" | "danger"; text: string }) => void }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const qc = useQueryClient();
  const [clearing, setClearing] = useState<NoDuesDesk | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const query = useQuery({ queryKey: ["accounts", "no-dues", studentMembershipId, event], queryFn: async () => noDuesSchema.parse(unwrap(await api().get(`/api/v1/accounts/no-dues/${studentMembershipId}?event=${event}`))) });
  const clear = useMutation({
    mutationFn: async (desk: NoDuesDesk) => noDuesSchema.parse(unwrap(await api().post(`/api/v1/accounts/no-dues/${studentMembershipId}`, { event, desk, ...(note.trim() ? { note: note.trim() } : {}) }))),
    onSuccess: (d) => {
      setClearing(null);
      setNote("");
      setError(null);
      onDone({ tone: "ok", text: t(d.completed ? "deskParity.noDuesCompleted" : "deskParity.noDuesLineCleared", { name: d.studentName }) });
      void qc.invalidateQueries({ queryKey: ["accounts", "no-dues"] });
    },
    onError: (e: Error) => setError(e.message),
  });
  const d = query.data;
  return (
    <Card title={d ? `${d.studentName} · ${t(`collegeOffice.event${event}` as TranslationKey)}` : t("collegeOffice.navNoDues")}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {error ? (
        <Text variant="sm" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      {d?.lines.map((line) => {
        const mine = ownDesk === "ANY" || ownDesk === line.desk;
        const owing = line.owedPaise > 0 || line.itemsOut > 0;
        return (
          <View key={line.desk} style={{ gap: th.space[2] }}>
            <Row
              title={t(DESK_KEY[line.desk])}
              caption={[line.owedPaise > 0 ? `${t("collegeOffice.colOwed")} ${money(line.owedPaise, locale)}` : null, line.itemsOut > 0 ? `${t("collegeOffice.colOut")} ${line.itemsOut}` : null, line.cleared && line.clearedByName ? t("collegeOffice.clearedBy", { name: line.clearedByName }) : null].filter(Boolean).join(" · ") || undefined}
              right={line.cleared ? <Pill label={t("collegeOffice.cleared")} tone="ok" /> : mine && clearing !== line.desk ? <Button label={t("collegeOffice.clear")} accessibilityLabel={`${t("collegeOffice.clear")}: ${t(DESK_KEY[line.desk])}`} variant="secondary" disabled={clear.isPending} onPress={() => setClearing(line.desk)} /> : <Pill label={t("collegeOffice.notCleared")} tone="warn" />}
            />
            {clearing === line.desk ? (
              <>
                <Field label={t("hostel.note")} hint={owing ? t("deskParity.noDuesNoteNeeded") : undefined} value={note} onChangeText={setNote} maxLength={300} multiline />
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
                  <Button label={t("collegeOffice.clear")} disabled={clear.isPending || (owing && note.trim().length === 0)} busy={clear.isPending} onPress={() => clear.mutate(line.desk)} />
                  <Button label={t("common.cancel")} variant="secondary" disabled={clear.isPending} onPress={() => setClearing(null)} />
                </View>
                <OfflineDecisionNote />
              </>
            ) : null}
          </View>
        );
      })}
      {d?.completed ? (
        <Text variant="sm" tone="ok">
          {t("deskParity.noDuesComplete")}
        </Text>
      ) : null}
    </Card>
  );
}
