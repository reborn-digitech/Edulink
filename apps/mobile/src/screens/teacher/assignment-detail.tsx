import { useMemo, useState } from "react";
import { openFile } from "@/lib/open-file";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { teachingGradebookSchema, teachingGradesSavedSchema, type TeachingAttachment, type TeachingGradebook, type TeachingGradesBody } from "@edulink/contracts";
import { type } from "@edulink/tokens";
import { Button, Card, Empty, Failed, Field, Icon, Loading, Row, Screen, Stat, Text, useToast } from "@/components";
import { API_BASE, api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Pill, formatMilli, useAuthHeaders } from "../family/shared";
import { relativeTime } from "./support";

/**
 * One assignment, the web's /teacher/assignments/[assignmentId]: the draft
 * bar with its publish button, the instructions, the handouts, the four
 * figures, and the marking. On a phone the marking is one pupil at a time —
 * their work on the same card as a large mark field, then the next pupil —
 * rather than a spreadsheet. As on the web, marks are kept on the phone and
 * saved as one batch, so a dropped connection never leaves half a class
 * marked with no sign of which half; the count of unsaved marks stays in view.
 */
type GradeRow = TeachingGradebook["rows"][number];
type Draft = { score: string; comment: string };

const draftOf = (row: GradeRow): Draft => ({ score: row.scoreMilli === null ? "" : String(row.scoreMilli / 1000), comment: row.comment ?? "" });

/** The web gradebook's rule: blank clears, a negative or non-number is wrong, and over twice the maximum is a typo (over-marking itself is allowed). */
export function markProblem(raw: string, maxMilli: number | null): boolean {
  const s = raw.trim();
  if (s === "") return false;
  const value = Number(s);
  if (!Number.isFinite(value) || value < 0 || value > 10_000) return true;
  return maxMilli !== null && value > (maxMilli / 1000) * 2;
}

/** "340 KB", "1.2 MB". */
export function fileSize(bytes: number): string {
  return bytes < 1_048_576 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1_048_576).toFixed(1)} MB`;
}

export function AssignmentDetail() {
  const { assignmentId } = useLocalSearchParams<{ assignmentId?: string }>();
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const query = useQuery({
    queryKey: ["teaching", "assignment", assignmentId],
    queryFn: async () => teachingGradebookSchema.parse(unwrap(await api().get(`/api/v1/teaching/assignments/${assignmentId}`))),
    enabled: Boolean(assignmentId),
  });
  if (!assignmentId) {
    return (
      <Screen title={t("teacher.assignments")}>
        <Empty title={t("teaching.assignmentNotFound")} action={<Button label={t("teacher.allAssignments")} variant="secondary" onPress={() => router.push("/(app)/assignments" as never)} />} />
      </Screen>
    );
  }
  const d = query.data;
  const a = d?.assignment;
  const description = a
    ? [a.className, a.category, a.pointsMilli ? t("teacher.outOfPoints", { points: formatMilli(a.pointsMilli) }) : null, a.dueAt ? t("teacher.dueWhenLower", { when: relativeTime(a.dueAt, locale) }) : null].filter(Boolean).join(" · ")
    : undefined;
  return (
    <Screen title={a?.title ?? t("teacher.assignments")} description={description} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? <Gradebook book={d} /> : null}
    </Screen>
  );
}

function Gradebook({ book }: { book: TeachingGradebook }) {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const headers = useAuthHeaders();
  const { assignment, rows, stats } = book;
  const [edits, setEdits] = useState<Record<string, Draft>>({});
  const [current, setCurrent] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const refresh = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ["teaching", "assignment", assignment.id] }),
      qc.invalidateQueries({ queryKey: ["staff", "assignments"] }),
      qc.invalidateQueries({ queryKey: ["staff", "classes"] }),
      qc.invalidateQueries({ queryKey: ["staff", "today"] }),
    ]);

  const save = useMutation({
    mutationFn: async (body: TeachingGradesBody) => teachingGradesSavedSchema.parse(unwrap(await api().post(`/api/v1/teaching/assignments/${assignment.id}/grades`, body))),
    onSuccess: async (result) => {
      toast.show(t("teacher.marksSaved", { count: result.saved + result.cleared }));
      // The marks on screen come from the server again before the edits go, so nothing flickers back.
      await refresh();
      setEdits({});
    },
  });

  const valueOf = (row: GradeRow): Draft => edits[row.membershipId] ?? draftOf(row);
  const dirty = rows.filter((row) => {
    const edit = edits[row.membershipId];
    if (!edit) return false;
    const was = draftOf(row);
    return edit.score !== was.score || edit.comment.trim() !== was.comment.trim();
  });
  const invalid = dirty.filter((row) => markProblem(valueOf(row).score, assignment.pointsMilli));
  const setDraft = (row: GradeRow, patch: Partial<Draft>) => setEdits((all) => ({ ...all, [row.membershipId]: { ...(all[row.membershipId] ?? draftOf(row)), ...patch } }));

  const submit = () => {
    if (dirty.length === 0 || invalid.length > 0) return;
    save.mutate({
      grades: dirty.map((row) => {
        const v = valueOf(row);
        // The comment always travels: leaving it out would clear it.
        return { studentMembershipId: row.membershipId, score: v.score.trim() === "" ? null : Number(v.score), comment: v.comment.trim() };
      }),
    });
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? rows.filter((r) => r.name.toLowerCase().includes(q) || r.fullName.toLowerCase().includes(q)) : rows;
  }, [rows, search]);

  const firstToMark = () => (rows.find((r) => r.submittedAt && r.scoreMilli === null) ?? rows.find((r) => r.scoreMilli === null) ?? rows[0])?.membershipId ?? null;
  const index = current ? rows.findIndex((r) => r.membershipId === current) : -1;
  const row = index >= 0 ? rows[index]! : null;
  const max = assignment.pointsMilli;

  const saveBar =
    dirty.length > 0 ? (
      <View accessibilityLiveRegion="polite" style={{ gap: th.space[2], padding: th.space[3], borderRadius: th.radius.lg, borderWidth: 1, borderColor: th.accent, backgroundColor: th.surface }}>
        <Text variant="sm" bold>
          {t("teaching.unsavedCount", { count: dirty.length })}
        </Text>
        {invalid.length > 0 ? (
          <Text variant="xs" tone="danger">
            {invalid.length === 1 ? t("teacher.invalidMarkOne") : t("teacher.invalidMarkMany", { count: invalid.length })}
          </Text>
        ) : null}
        <Button label={t("teacher.saveMarks")} busy={save.isPending} disabled={invalid.length > 0} onPress={submit} />
      </View>
    ) : null;

  return (
    <>
      {!assignment.publishedAt ? <PublishBar assignmentId={assignment.id} onPublished={refresh} /> : null}
      {assignment.body ? (
        <Card>
          <Text variant="sm" tone="muted">
            {assignment.body}
          </Text>
        </Card>
      ) : null}
      {assignment.attachments.length > 0 ? (
        <Card title={t("teacher.filesForClass")}>
          <Files files={assignment.attachments} headers={headers} />
        </Card>
      ) : null}

      <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
        <Stat label={t("teacher.students")} value={stats.total} />
        <Stat label={t("teacher.handedIn")} value={stats.submitted} tone={stats.total > 0 && stats.submitted === stats.total ? "ok" : "fg"} />
        <Stat label={t("teacher.marked")} value={stats.graded} tone={stats.graded === stats.total ? "ok" : "warn"} />
        <Stat label={t("teacher.classAverage")} value={stats.averagePercent === null ? "—" : `${stats.averagePercent}%`} />
      </View>
      {save.isError ? <Failed message={save.error.message} onRetry={submit} /> : null}

      {rows.length === 0 ? (
        <Empty
          title={t("teacher.nobodyInClass")}
          body={t("teacher.addStudentsToClass")}
          icon="users"
          action={<Button label={t("teacher.classJoinCode")} variant="secondary" onPress={() => router.push({ pathname: "/(app)/classes/detail", params: { classId: assignment.classId } } as never)} />}
        />
      ) : row ? (
        <>
          <MarkCard
            row={row}
            position={index + 1}
            total={rows.length}
            draft={valueOf(row)}
            maxMilli={max}
            invalid={markProblem(valueOf(row).score, max)}
            headers={headers}
            onChange={(patch) => setDraft(row, patch)}
            onPrevious={index > 0 ? () => setCurrent(rows[index - 1]!.membershipId) : null}
            onNext={index < rows.length - 1 ? () => setCurrent(rows[index + 1]!.membershipId) : null}
            onList={() => setCurrent(null)}
          />
          {saveBar}
        </>
      ) : (
        <>
          <Button label={t("teaching.startMarking")} icon={<Icon name="clipboard" size={20} color={th.accentFg} weight="bold" />} onPress={() => setCurrent(firstToMark())} />
          {saveBar}
          <Field label={t("teacher.searchClass")} placeholder={t("teacher.findStudent")} value={search} onChangeText={setSearch} autoCapitalize="none" returnKeyType="search" />
          {filtered.length === 0 ? (
            <Empty title={t("teacher.nobodyMatches", { query: search.trim() })} body={t("teacher.clearSearchSeeEveryone")} action={<Button label={t("teacher.clearSearch")} variant="secondary" onPress={() => setSearch("")} />} />
          ) : (
            <Card title={t("teacher.students")}>
              {filtered.map((r) => {
                const v = valueOf(r);
                const changed = dirty.includes(r);
                const status = r.submittedAt ? (r.late ? t("teacher.handedInLate") : t("teacher.handedIn")) : t("teacher.notHandedIn");
                return (
                  <Row
                    key={r.membershipId}
                    title={r.name}
                    caption={changed ? `${status} · ${t("teaching.unsaved")}` : status}
                    right={
                      <Text variant="base" bold tone={markProblem(v.score, max) ? "danger" : v.score ? "fg" : "subtle"} style={{ fontVariant: ["tabular-nums"] }}>
                        {`${v.score || "—"}${max !== null ? `/${formatMilli(max)}` : ""}`}
                      </Text>
                    }
                    onPress={() => setCurrent(r.membershipId)}
                  />
                );
              })}
            </Card>
          )}
        </>
      )}
    </>
  );
}

/** The web's PublishBar, with a second tap to be sure: a published piece of work tells the whole class and their guardians. */
function PublishBar({ assignmentId, onPublished }: { assignmentId: string; onPublished: () => Promise<unknown> }) {
  const t = useT();
  const th = useTheme();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const publish = useMutation({
    mutationFn: async () => unwrap(await api().post("/api/v1/staff/assignments/publish", { assignmentId })),
    onSuccess: async () => {
      toast.show(`${t("teacher.published")}. ${t("teacher.classTold")}`);
      setConfirming(false);
      await onPublished();
    },
  });
  return (
    <View style={{ gap: th.space[3], padding: th.space[4], borderRadius: th.radius.lg, backgroundColor: th.warnSoft }}>
      <View style={{ flexDirection: "row", gap: th.space[2], alignItems: "flex-start" }}>
        <Icon name="warning" size={20} color={th.warn} weight="fill" />
        <Text variant="sm" bold tone="warn" style={{ flex: 1 }}>
          {confirming ? t("teaching.publishConfirm") : t("teacher.stillDraft")}
        </Text>
      </View>
      {publish.isError ? <Failed message={publish.error.message} onRetry={() => publish.mutate()} /> : null}
      {confirming ? (
        <View style={{ flexDirection: "row", gap: th.space[2], flexWrap: "wrap" }}>
          <Button label={t("common.cancel")} variant="secondary" disabled={publish.isPending} onPress={() => setConfirming(false)} style={{ flexGrow: 1 }} />
          <Button label={t("common.confirm")} busy={publish.isPending} onPress={() => publish.mutate()} style={{ flexGrow: 1 }} />
        </View>
      ) : (
        <Button label={t("teacher.publishNow")} icon={<Icon name="paperPlane" size={18} color={th.accentFg} weight="bold" />} onPress={() => setConfirming(true)} />
      )}
    </View>
  );
}

/** One pupil: their work, a mark field big enough for a thumb, the comment, and the way to the next pupil. */
function MarkCard({
  row,
  position,
  total,
  draft,
  maxMilli,
  invalid,
  headers,
  onChange,
  onPrevious,
  onNext,
  onList,
}: {
  row: GradeRow;
  position: number;
  total: number;
  draft: Draft;
  maxMilli: number | null;
  invalid: boolean;
  headers: Record<string, string> | null;
  onChange: (patch: Partial<Draft>) => void;
  onPrevious: (() => void) | null;
  onNext: (() => void) | null;
  onList: () => void;
}) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const value = draft.score.trim() === "" ? null : Number(draft.score);
  const percent = value !== null && !invalid && maxMilli ? Math.round((value * 100_000) / maxMilli) : null;
  return (
    <Card title={row.name} action={<Text variant="sm" tone="muted">{t("teaching.pupilOf", { n: position, total })}</Text>}>
      <View style={{ flexDirection: "row", gap: th.space[2], flexWrap: "wrap" }}>
        {row.submittedAt ? <Pill label={row.late ? t("teacher.handedInLate") : t("teacher.handedIn")} tone={row.late ? "warn" : "ok"} /> : <Pill label={t("teacher.notHandedIn")} />}
        {row.submittedAt ? <Pill label={relativeTime(row.submittedAt, locale)} /> : null}
        {percent !== null ? <Pill label={`${percent}%`} tone={percent >= 70 ? "ok" : percent >= 50 ? "warn" : "danger"} /> : null}
      </View>
      {row.work ? (
        <View style={{ gap: th.space[2] }}>
          <Text variant="xs" tone="subtle" bold>
            {t("teaching.theirWork")}
          </Text>
          {row.work.body ? <Text variant="sm">{row.work.body}</Text> : null}
          <Files files={row.work.attachments} headers={headers} />
        </View>
      ) : null}
      <Field
        label={t("teacher.markFor", { name: row.name })}
        value={draft.score}
        onChangeText={(text) => onChange({ score: text.replace(/[^0-9.]/g, "") })}
        keyboardType="decimal-pad"
        placeholder="—"
        hint={maxMilli !== null ? t("teacher.outOfPoints", { points: formatMilli(maxMilli) }) : undefined}
        error={invalid ? t("teacher.invalidMarkOne") : undefined}
        style={{ minHeight: th.tap + th.space[4], fontSize: type["3xl"].size, fontWeight: "700", textAlign: "center" }}
      />
      <Field
        label={t("teacher.commentForName", { name: row.name })}
        hint={t("teacher.familySeesThis")}
        value={draft.comment}
        onChangeText={(text) => onChange({ comment: text.slice(0, 4000) })}
        placeholder={t("teacher.commentPlaceholder")}
        multiline
        style={{ minHeight: th.space[12] * 2, textAlignVertical: "top", paddingTop: th.space[3] }}
      />
      <View style={{ flexDirection: "row", gap: th.space[2], flexWrap: "wrap" }}>
        <Button label={t("teaching.previousPupil")} variant="secondary" disabled={!onPrevious} onPress={() => onPrevious?.()} style={{ flexGrow: 1 }} />
        {onNext ? <Button label={t("teaching.nextPupil")} onPress={onNext} style={{ flexGrow: 1 }} /> : <Button label={t("teaching.allPupils")} onPress={onList} style={{ flexGrow: 1 }} />}
      </View>
      {onNext ? <Button label={t("teaching.allPupils")} variant="ghost" onPress={onList} /> : null}
    </Card>
  );
}

/**
 * Files on a record, read through /api/files with the bearer token: a
 * picture is drawn (expo-image sends the header; RN's Image cannot); any
 * other file is a row that opens it in the browser sheet.
 */
function Files({ files, headers }: { files: TeachingAttachment[]; headers: Record<string, string> | null }) {
  const th = useTheme();
  const t = useT();
  const toast = useToast();
  if (files.length === 0) return null;
  return (
    <View style={{ gap: th.space[2] }}>
      {files.map((file) =>
        file.mime.startsWith("image/") && headers ? (
          <Image
            key={file.fileId}
            source={{ uri: `${API_BASE}/api/files/${encodeURIComponent(file.fileId)}?w=640`, headers }}
            accessible
            accessibilityLabel={file.name}
            contentFit="contain"
            style={{ width: "100%", aspectRatio: 4 / 3, borderRadius: th.radius.md, backgroundColor: th.surfaceMuted }}
          />
        ) : (
          // A PDF or a Word file opens in the browser sheet through a five-minute link (lib/open-file.ts).
          <Row
            key={file.fileId}
            icon="paperclip"
            title={file.name}
            caption={fileSize(file.size)}
            onPress={() => {
              void openFile(file.fileId, t("common.tryAgain")).then((error) => {
                if (error) toast.show(error, "danger");
              });
            }}
          />
        ),
      )}
    </View>
  );
}
