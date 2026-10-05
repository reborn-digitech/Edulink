import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MOOT_COURT_KINDS, MOOT_OUTCOMES, mootCourtsSchema, streamRecordsIdSchema, type MootCourtKind, type RoleCode } from "@edulink/contracts";
import type { z } from "zod";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { formatDateKey } from "../family/shared";
import { Chips, MultiChips } from "../staff/shared";
import { todayKey } from "../teacher/support";

/**
 * A LAW COLLEGE'S MOOT COURTS ON THE PHONE (A3-inventory-4, audit of 5 Oct
 * 2026), the office's /admin/stream-records/moot-courts for the people the
 * doors already name: GET /api/v1/stream-records/moot-courts lists every moot
 * with its teams, outcomes, result and the judges' notes; a FACULTY or HOD
 * member (and the office) records one with POST, or corrects one by its id.
 * Who may correct which moot is the server's to say (its author, the office,
 * the law department's HOD): the phone offers the correction and shows the
 * server's sentence when it refuses. The head reads.
 */

type Moots = z.infer<typeof mootCourtsSchema>;
type Moot = Moots["items"][number];
type Outcome = (typeof MOOT_OUTCOMES)[number];
type Team = { name: string; outcome: Outcome; membershipIds: string[] };

const READERS: readonly RoleCode[] = ["FACULTY", "HOD", "ADMIN", "PRINCIPAL"];
const PATH = "/api/v1/stream-records/moot-courts";
const blankTeam = (): Team => ({ name: "", outcome: "PARTICIPATED", membershipIds: [] });

export function MootCourtsScreen() {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const session = useSession();
  const me = session.status === "signed-in" ? session.me : null;
  const role = me?.active.role ?? null;
  const reads = role !== null && READERS.includes(role);
  const on = (me?.modules ?? []).includes("ACADEMICS");
  const [editing, setEditing] = useState<Moot | null>(null);
  // A new form after each save, so the next moot starts blank.
  const [round, setRound] = useState(0);
  const query = useQuery({ queryKey: ["stream-records", "moot-courts"], enabled: reads && on, queryFn: async () => mootCourtsSchema.parse(unwrap(await api().get(PATH))) });
  const title = t("streamRecords.moots.title");
  const toMore = <Button label={t("nav.more")} variant="secondary" onPress={() => router.push("/(app)/more" as never)} />;
  if (!reads || !on) {
    return (
      <Screen title={title}>
        <Empty icon={reads ? "puzzle" : "trophy"} title={title} body={reads ? t("duties.moduleOff") : t("streamRecords.moots.notForYou")} action={toMore} />
      </Screen>
    );
  }
  const d = query.data;
  return (
    <Screen title={title} description={t("streamRecords.moots.intro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d && !d.offered ? <Text tone="muted">{t("streamRecords.moots.notOffered")}</Text> : null}
      {d && d.items.length === 0 ? <Empty icon="trophy" title={t("streamRecords.moots.none")} body={t(d.canEdit ? "streamRecords.moots.noneBody" : "streamRecords.moots.noneRead")} action={toMore} /> : null}
      {d && d.items.length > 0 ? (
        <Card title={t("streamRecords.moots.listTitle")}>
          {d.items.map((m) => (
            <View key={m.id}>
              <Row
                icon="trophy"
                title={m.name}
                caption={[
                  `${t(`streamRecords.moots.kind${m.kind}`)} · ${formatDateKey(m.at, locale, { day: "numeric", month: "short", year: "numeric" })}`,
                  ...m.teams.map((team) => `${team.name} — ${t(`streamRecords.moots.outcome${team.outcome}`)}${team.members.length ? ` · ${team.members.map((p) => p.name).join(", ")}` : ""}`),
                  m.result ? t("streamRecords.moots.resultLine", { result: m.result }) : null,
                  m.judgeNotes || null,
                ]
                  .filter(Boolean)
                  .join("\n")}
              />
              {/* R-59 (risks batch, 5 Oct 2026): "Correct" only where this reader may correct this moot (its author, the office or the law HOD; never once filed); an older server's row without the flag keeps the screen's own. */}
              {d.canEdit && m.canEdit !== false ? <Button label={t("streamRecords.moots.correctThis", { name: m.name })} variant="ghost" onPress={() => setEditing(m)} /> : null}
            </View>
          ))}
        </Card>
      ) : null}
      {d && d.canEdit ? (
        <MootForm
          key={`${editing?.id ?? "new"}-${round}`}
          editing={editing}
          students={d.students}
          onDone={() => {
            setEditing(null);
            setRound((n) => n + 1);
            return query.refetch();
          }}
          onCancel={() => setEditing(null)}
        />
      ) : null}
    </Screen>
  );
}

/** The form for a new moot, or for correcting `editing`: at least two named teams, each with its outcome and students. */
function MootForm({ editing, students, onDone, onCancel }: { editing: Moot | null; students: Moots["students"]; onDone: () => unknown; onCancel: () => void }) {
  const t = useT();
  const th = useTheme();
  const toast = useToast();
  const [name, setName] = useState(editing?.name ?? "");
  const [day, setDay] = useState(editing?.at ?? todayKey());
  const [kind, setKind] = useState<MootCourtKind>(editing?.kind ?? "INTRA");
  const [teams, setTeams] = useState<Team[]>(editing ? editing.teams.map((x) => ({ name: x.name, outcome: x.outcome, membershipIds: x.members.map((p) => p.membershipId) })) : [blankTeam(), blankTeam()]);
  const [result, setResult] = useState(editing?.result ?? "");
  const [notes, setNotes] = useState(editing?.judgeNotes ?? "");
  const setTeam = (i: number, next: Partial<Team>) => setTeams((all) => all.map((x, j) => (j === i ? { ...x, ...next } : x)));
  const named = teams.filter((x) => x.name.trim().length > 0).length;
  const ready = name.trim().length >= 2 && /^\d{4}-\d{2}-\d{2}$/.test(day) && named >= 2 && named === teams.length;
  const save = useMutation({
    mutationFn: async () =>
      streamRecordsIdSchema.parse(
        unwrap(
          await api().post(PATH, {
            ...(editing ? { id: editing.id } : {}),
            name: name.trim(),
            at: day,
            kind,
            teams: teams.map((x) => ({ name: x.name.trim(), membershipIds: x.membershipIds, outcome: x.outcome })),
            result: result.trim(),
            judgeNotes: notes.trim(),
          }),
        ),
      ),
    onSuccess: () => {
      toast.show(t("streamRecords.mootSaved"), "ok");
      void onDone();
    },
    // The server's sentence (a correction that is not theirs, a student of another college, no law stream) stays under the button.
    onError: (e: Error) => toast.show(e.message, "danger"),
  });
  return (
    <Card title={t(editing ? "streamRecords.moots.correctTitle" : "streamRecords.moots.addTitle")}>
      <Text variant="sm" tone="muted">
        {t("streamRecords.moots.addBody")}
      </Text>
      <Field label={t("streamRecords.moots.fieldName")} value={name} onChangeText={setName} maxLength={160} />
      <Field label={t("streamRecords.moots.fieldDay")} value={day} onChangeText={setDay} placeholder="YYYY-MM-DD" autoCapitalize="none" keyboardType="numbers-and-punctuation" />
      <Chips label={t("streamRecords.moots.fieldKind")} value={kind} options={MOOT_COURT_KINDS.map((k) => ({ value: k, label: t(`streamRecords.moots.kind${k}`) }))} onChange={setKind} />
      {teams.map((team, i) => (
        <View key={i} style={{ gap: th.space[2], borderTopWidth: 1, borderTopColor: th.border, paddingTop: th.space[3] }}>
          <Text variant="sm" bold>
            {t("streamRecords.moots.teamN", { n: i + 1 })}
          </Text>
          <Field label={t("streamRecords.moots.fieldTeam")} value={team.name} onChangeText={(v) => setTeam(i, { name: v })} maxLength={80} />
          <Chips label={t("streamRecords.moots.fieldOutcome")} value={team.outcome} options={MOOT_OUTCOMES.map((o) => ({ value: o, label: t(`streamRecords.moots.outcome${o}`) }))} onChange={(v) => setTeam(i, { outcome: v })} />
          {students.length ? (
            <MultiChips
              label={t("streamRecords.moots.chooseMembers")}
              values={team.membershipIds}
              options={students.map((s) => ({ value: s.membershipId, label: s.name }))}
              onToggle={(v) => setTeam(i, { membershipIds: team.membershipIds.includes(v) ? team.membershipIds.filter((x) => x !== v) : [...team.membershipIds, v] })}
            />
          ) : null}
          {teams.length > 2 ? <Button label={t("streamRecords.moots.removeTeam", { n: i + 1 })} variant="ghost" onPress={() => setTeams((all) => all.filter((_, j) => j !== i))} /> : null}
        </View>
      ))}
      {teams.length < 40 ? <Button label={t("streamRecords.moots.addTeam")} variant="secondary" onPress={() => setTeams((all) => [...all, blankTeam()])} /> : null}
      {named < 2 ? <Text tone="warn">{t("streamRecords.moots.needTwoTeams")}</Text> : null}
      <Field label={t("streamRecords.moots.fieldResult")} value={result} onChangeText={setResult} maxLength={400} />
      <Field label={t("streamRecords.moots.fieldNotes")} value={notes} onChangeText={setNotes} maxLength={2000} multiline />
      <Button label={t(editing ? "streamRecords.moots.saveCorrection" : "streamRecords.moots.save")} busy={save.isPending} disabled={!ready} onPress={() => save.mutate()} />
      {save.isError ? (
        <Text tone="danger" accessibilityRole="alert">
          {save.error.message}
        </Text>
      ) : null}
      {editing ? <Button label={t("common.cancel")} variant="ghost" onPress={onCancel} /> : null}
    </Card>
  );
}
