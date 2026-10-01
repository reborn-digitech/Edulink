import { useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { moderationSchema, okSchema, type Moderation } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Icon, Loading, Row, Screen, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Chips, must } from "../staff/shared";
import { formatInstant, Pill } from "../family/shared";

type Status = "live" | "takenDown" | "restored";
type Item = Moderation["items"][number];

/**
 * The web's /appadmin/moderation on a phone: every school's shared posts,
 * newest first with the school named — live, taken down by the platform, or
 * restored — a page at a time. Taking one down is asked twice and needs a
 * reason the school's office reads; a restore is one press. The platform's
 * act is for every school at once; a school's own hide stays the school's.
 */
export function PlatformModeration() {
  const t = useT();
  const th = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const [status, setStatus] = useState<Status>("live");
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["appadmin", "moderation", status, page],
    queryFn: async () => moderationSchema.parse(unwrap(await api().get(`/api/v1/appadmin/moderation?status=${status}&page=${page}`))),
  });
  const done = (message: string) => {
    toast.show(message, "ok");
    void qc.invalidateQueries({ queryKey: ["appadmin", "moderation"] });
  };
  const takeDown = useMutation({
    mutationFn: async ({ postId, reason }: { postId: string; reason: string }) => okSchema.parse(must(await api().post(`/api/v1/appadmin/moderation/${postId}/takedown`, { reason }), t("root.didNotWork"))),
    onSuccess: () => done(t("moderation.takenDown")),
  });
  const restore = useMutation({
    mutationFn: async (postId: string) => okSchema.parse(must(await api().post(`/api/v1/appadmin/moderation/${postId}/restore`, {}), t("root.didNotWork"))),
    onSuccess: () => done(t("moderation.restored")),
  });
  const d = query.data;
  const pick = (next: string) => {
    setStatus(next as Status);
    setPage(1);
  };

  return (
    <Screen title={t("moderation.title")} description={t("moderation.intro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Chips
        label={t("enquiries.statusFilter")}
        value={status}
        options={[
          { value: "live", label: d ? `${t("moderation.statusLive")} (${d.counts.live})` : t("moderation.statusLive") },
          { value: "takenDown", label: d ? `${t("moderation.statusTakenDown")} (${d.counts.takenDown})` : t("moderation.statusTakenDown") },
          { value: "restored", label: d ? `${t("moderation.statusRestored")} (${d.counts.restored})` : t("moderation.statusRestored") },
        ]}
        onChange={pick}
      />
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {takeDown.isError ? <Failed message={takeDown.error.message} onRetry={takeDown.variables ? () => takeDown.mutate(takeDown.variables!) : undefined} /> : null}
      {restore.isError ? <Failed message={restore.error.message} onRetry={restore.variables ? () => restore.mutate(restore.variables!) : undefined} /> : null}
      {d ? (
        d.items.length === 0 ? (
          <Empty icon="shield" title={t("moderation.empty")} body={t("moderation.emptyBody")} action={<Button label={t("ui.refresh")} variant="secondary" onPress={() => void query.refetch()} />} />
        ) : (
          <Card>
            {d.items.map((item) => (
              <PostRow key={`${item.postId}:${item.status}`} item={item} busy={(takeDown.isPending && takeDown.variables?.postId === item.postId) || (restore.isPending && restore.variables === item.postId)} onTakeDown={(reason) => takeDown.mutate({ postId: item.postId, reason })} onRestore={() => restore.mutate(item.postId)} />
            ))}
          </Card>
        )
      ) : null}
      {d && d.pages > 1 ? (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: th.space[2] }}>
          <Button label={t("translationReview.previous")} variant="secondary" disabled={d.page <= 1} onPress={() => setPage((p) => Math.max(1, p - 1))} />
          <Text variant="sm" tone="muted">
            {t("moderation.pageOf", { page: d.page, pages: d.pages })}
          </Text>
          <Button label={t("translationReview.next")} variant="secondary" disabled={d.page >= d.pages} onPress={() => setPage((p) => p + 1)} />
        </View>
      ) : null}
      <Text variant="xs" tone="muted">
        {t("moderation.heldNote")}
      </Text>
    </Screen>
  );
}

/** One shared post: who published it and where it stands, and the one press the platform has on it — a take-down asked twice with its reason, or a restore. */
function PostRow({ item, busy, onTakeDown, onRestore }: { item: Item; busy: boolean; onTakeDown: (reason: string) => void; onRestore: () => void }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");
  const when = (iso: string) => formatInstant(iso, locale, { day: "numeric", month: "short", year: "numeric" });
  const pill = item.status === "APPROVED" ? <Pill label={t("moderation.statusLive")} tone="ok" /> : item.status === "TAKEN_DOWN" ? <Pill label={t("moderation.statusTakenDown")} tone="danger" /> : <Pill label={t("moderation.statusRestored")} tone="muted" />;
  const caption = [item.schoolName || t("moderation.schoolGone"), item.authorName, when(item.createdAt), item.status === "APPROVED" ? t("moderation.commentCount", { count: item.commentCount }) : null, item.excerpt].filter(Boolean).join(" · ");
  return (
    <View style={{ gap: th.space[2] }}>
      <Row title={item.title} caption={caption} right={pill} />
      {item.takedown ? (
        <Text variant="sm" tone="muted">
          {t("moderation.takedownNote", { by: item.takedown.by, when: when(item.takedown.at), reason: item.takedown.reason })}
          {item.takedown.restoredAt ? ` ${t("moderation.restoredNote", { by: item.takedown.restoredBy ?? "", when: when(item.takedown.restoredAt) })}` : ""}
        </Text>
      ) : null}
      {item.status === "APPROVED" ? (
        confirming ? (
          <View style={{ gap: th.space[2] }}>
            <Field label={t("moderation.reasonLabel")} hint={t("moderation.reasonHint")} value={reason} onChangeText={setReason} multiline maxLength={500} />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
              <Button label={t("moderation.confirmTakeDown")} accessibilityLabel={`${t("moderation.confirmTakeDown")}: ${item.title}`} variant="danger" busy={busy} disabled={reason.trim().length < 3} onPress={() => onTakeDown(reason.trim())} style={{ flexGrow: 1 }} />
              <Button label={t("common.cancel")} variant="ghost" onPress={() => setConfirming(false)} />
            </View>
          </View>
        ) : (
          <Button label={t("moderation.takeDown")} accessibilityLabel={`${t("moderation.takeDown")} ${item.title}`} variant="secondary" icon={<Icon name="x" size={18} color={th.fg} weight="bold" />} onPress={() => setConfirming(true)} style={{ alignSelf: "flex-start" }} />
        )
      ) : null}
      {item.status === "TAKEN_DOWN" ? <Button label={t("moderation.restore")} accessibilityLabel={`${t("moderation.restore")} ${item.title}`} variant="secondary" busy={busy} onPress={onRestore} style={{ alignSelf: "flex-start" }} /> : null}
    </View>
  );
}
