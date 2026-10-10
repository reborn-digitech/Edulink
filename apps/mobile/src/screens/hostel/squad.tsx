import { useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hostelsSchema, squadRoundSchema, squadRoundsSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, ShowMore, SwitchRow, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useRole } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { Chips, Notice } from "../staff/shared";
import { Pill, formatInstant } from "../family/shared";
import { ModuleOffScreen, OfflineDecisionNote, useModuleOn } from "@/screens/shared/desk";

/**
 * The anti-ragging squad's rounds on the phone (the parity batch, 10 Oct
 * 2026, R-4), the web's /hostel/squad as far as the rounds go: every round
 * logged with its hostel, time, members and whether it found something, and
 * the warden (or the office) logs one now — the hostel, who went, a note,
 * flagged or not — through the web's door (POST /hostel/squad-rounds). The
 * IQAC and the head read. Room changes and the criterion-5 numbers stay on
 * the web. A log is sent live and never queued.
 */
export function SquadRoundsScreen() {
  const t = useT();
  const role = useRole();
  const { locale } = useLocale();
  const on = useModuleOn("HOSTEL");
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const query = useQuery({ queryKey: ["hostel", "squad-rounds"], enabled: on, queryFn: async () => squadRoundsSchema.parse(unwrap(await api().get("/api/v1/hostel/squad-rounds"))) });
  if (!on) return <ModuleOffScreen title={t("collegeOffice.squadRoundsTitle")} module="HOSTEL" />;
  const items = query.data?.items ?? [];
  return (
    <Screen title={t("collegeOffice.squadRoundsTitle")} description={t("deskParity.squadIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      {role === "WARDEN" || role === "ADMIN" ? <LogRoundCard onDone={setNotice} /> : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {query.data && items.length === 0 ? <Empty icon="shield" title={t("collegeOffice.squadNone")} body={t("deskParity.squadNoneBody")} action={<Button label={t("common.retry")} variant="secondary" onPress={() => void query.refetch()} />} /> : null}
      {items.length > 0 ? (
        <Card title={t("deskParity.squadRoundsN", { count: items.length })}>
          <ShowMore items={items}>
            {(page) => page.map((r) => <Row key={r.id} title={`${r.hostelName} · ${formatInstant(r.at, locale)}`} caption={[`${t("collegeOffice.colMembers")}: ${r.members}`, r.note].filter(Boolean).join(" · ")} right={r.flagged ? <Pill label={t("deskParity.squadFlagged")} tone="danger" /> : <Pill label={t("deskParity.squadClear")} tone="ok" />} />)}
          </ShowMore>
        </Card>
      ) : null}
    </Screen>
  );
}

function LogRoundCard({ onDone }: { onDone: (n: { tone: "ok" | "danger"; text: string }) => void }) {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [hostelId, setHostelId] = useState<string | null>(null);
  const [members, setMembers] = useState("");
  const [note, setNote] = useState("");
  const [flagged, setFlagged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hostels = useQuery({ queryKey: ["hostel", "hostels"], enabled: open, queryFn: async () => hostelsSchema.parse(unwrap(await api().get("/api/v1/hostel/hostels"))) });
  const list = hostels.data?.hostels ?? [];
  const chosen = hostelId ?? list[0]?.id ?? null;
  const log = useMutation({
    mutationFn: async () => {
      if (!chosen) throw new Error(t("hostel.noHostels"));
      return squadRoundSchema.parse(unwrap(await api().post("/api/v1/hostel/squad-rounds", { hostelId: chosen, at: new Date().toISOString(), members: members.trim(), note: note.trim(), flagged })));
    },
    onSuccess: () => {
      setOpen(false);
      setMembers("");
      setNote("");
      setFlagged(false);
      setError(null);
      onDone({ tone: "ok", text: t("collegeOffice.squadLogged") });
      void qc.invalidateQueries({ queryKey: ["hostel", "squad-rounds"] });
    },
    onError: (e: Error) => setError(e.message),
  });
  if (!open) return <Button label={t("deskParity.squadLog")} onPress={() => setOpen(true)} />;
  return (
    <Card title={t("deskParity.squadLog")}>
      {hostels.isPending ? <Loading /> : null}
      {hostels.isError ? <Failed message={hostels.error.message} onRetry={() => void hostels.refetch()} /> : null}
      {list.length > 1 ? <Chips label={t("hostel.whichHostel")} value={chosen ?? ""} options={list.map((h) => ({ value: h.id, label: h.name }))} onChange={setHostelId} /> : null}
      {list.length === 1 ? <Text variant="sm">{list[0]!.name}</Text> : null}
      <Field label={t("collegeOffice.colMembers")} value={members} onChangeText={setMembers} maxLength={300} />
      <Field label={t("hostel.note")} value={note} onChangeText={setNote} maxLength={1000} multiline />
      <SwitchRow label={t("deskParity.squadFlagged")} hint={t("deskParity.squadFlaggedHint")} value={flagged} onChange={setFlagged} />
      {error ? (
        <Text variant="sm" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
        <Button label={t("deskParity.squadLog")} disabled={!chosen || members.trim().length < 3 || log.isPending} busy={log.isPending} onPress={() => log.mutate()} />
        <Button label={t("common.cancel")} variant="secondary" disabled={log.isPending} onPress={() => setOpen(false)} />
      </View>
      <OfflineDecisionNote />
    </Card>
  );
}
