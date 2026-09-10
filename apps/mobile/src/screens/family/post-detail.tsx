import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import { bulletinCommentResultSchema, bulletinPostDetailSchema, bulletinReactResultSchema, type bulletinReactionKindSchema } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Text, useToast } from "@/components";
import { Avatar } from "@/components/avatar";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useRole, useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { AUDIENCE, CATEGORY, Media, Reactions, Tags } from "./bulletin";
import { Confirm, Note, param, Pill, relativeTime, useAuthHeaders } from "./shared";

type Detail = z.infer<typeof bulletinPostDetailSchema>;
type Comment = Detail["comments"][number];
type Reaction = z.infer<typeof bulletinReactionKindSchema>;

/**
 * One post — the web's /bulletin/[postId]: who wrote it and for whom, the
 * whole post with its pictures, the reaction row, the comments as threads
 * (replies under the comment they answer) and a box to add one. A pupil's
 * post waiting for review is where staff publish it or send it back with a
 * note the pupil will read; an admin can hide another school's shared post
 * from their own school, asked about first. Staff see who a circular has
 * reached, class by class.
 */
export function PostDetail() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const role = useRole();
  const session = useSession();
  const { locale } = useLocale();
  const me = session.status === "signed-in" ? session.me : null;
  const params = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  const postId = param(params.postId);
  // One name for the path segment, so every call below reads /bulletin/${id}.
  const id = encodeURIComponent(postId ?? "");
  const query = useQuery({
    queryKey: ["bulletin", "post", postId],
    enabled: Boolean(postId),
    queryFn: async () => bulletinPostDetailSchema.parse(unwrap(await api().get(`/api/v1/shared/bulletin/${id}`))),
  });
  const headers = useAuthHeaders();
  const d = query.data;
  const refreshAll = () => qc.invalidateQueries({ queryKey: ["bulletin"] });
  const staff = role === "TEACHER" || role === "ADMIN";

  const react = useMutation({
    mutationFn: async (kind: Reaction) => {
      const result = await api().post(`/api/v1/shared/bulletin/${id}/react`, { kind });
      if (!result.ok) throw new Error(errorText(result, t("bulletin.couldNotReact")));
      return bulletinReactResultSchema.parse(result.data);
    },
    onSuccess: () => void refreshAll(),
    onError: (e) => toast.show(e.message, "danger"),
  });

  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const review = useMutation({
    mutationFn: async (body: { decision: "APPROVE" | "REJECT"; reason?: string }) => {
      const result = await api().post(`/api/v1/shared/bulletin/${id}/review`, body);
      if (!result.ok) throw new Error(errorText(result, t("bulletin.couldNotDo")));
      return body.decision;
    },
    onSuccess: (decision) => {
      setRejecting(false);
      setReason("");
      toast.show(decision === "APPROVE" ? t("bulletin.published") : t("bulletin.sentBackWithNote"));
      void refreshAll();
    },
    onError: (e) => toast.show(e.message, "danger"),
  });

  const [hiding, setHiding] = useState(false);
  const hide = useMutation({
    mutationFn: async () => {
      const result = await api().post(`/api/v1/shared/bulletin/${id}/hide`, { hidden: true });
      if (!result.ok) throw new Error(errorText(result, t("bulletin.couldNotDo")));
    },
    onSuccess: () => {
      setHiding(false);
      toast.show(t("bulletin.hiddenHere"));
      void refreshAll();
    },
    onError: (e) => {
      setHiding(false);
      toast.show(e.message, "danger");
    },
  });

  const [comment, setComment] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  const addComment = useMutation({
    mutationFn: async () => {
      const result = await api().post(`/api/v1/shared/bulletin/${id}/comments`, { body: comment.trim(), ...(replyTo ? { parentCommentId: replyTo.id } : {}) });
      if (!result.ok) throw new Error(result.issues?.body ?? errorText(result, t("bulletin.couldNotSend")));
      return bulletinCommentResultSchema.parse(result.data);
    },
    onSuccess: (res) => {
      setComment("");
      setReplyTo(null);
      setCommentError(null);
      toast.show(res.held ? t("bulletin.sentToATeacher") : t("bulletin.posted"));
      void refreshAll();
    },
    onError: (e) => setCommentError(e.message),
  });

  if (!postId) {
    return (
      <Screen title={t("meta.post")}>
        <Empty title={t("access.postNotFound")} action={<Button label={t("bulletin.title")} variant="secondary" onPress={() => router.push("/(app)/bulletin" as never)} />} />
      </Screen>
    );
  }

  const mine = d ? d.author.id === me?.user.id : false;
  const where = d ? (d.scope === "CLASS" ? (d.className ?? t("bulletin.classField")) : d.scope === "SCHOOL" ? t("bulletin.wholeSchool") : t("bulletin.globalFeed")) : "";
  const meta = d ? [where, relativeTime(d.createdAt, locale), d.audience !== "ALL" ? t(AUDIENCE[d.audience]) : null, d.audienceGrade ? t("practice.classN", { n: d.audienceGrade }) : null].filter(Boolean).join(" · ") : "";
  const tops = d ? d.comments.filter((c) => !c.parentCommentId) : [];
  const repliesTo = (id: string) => (d ? d.comments.filter((c) => c.parentCommentId === id) : []);
  const count = d?.comments.length ?? 0;
  const canReply = d?.status === "APPROVED";
  const hideable = role === "ADMIN" && d?.scope === "GLOBAL" && d.schoolId !== me?.active.schoolId;

  return (
    <Screen title={t("meta.post")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <Card>
            <View style={{ flexDirection: "row", alignItems: "center", gap: th.space[3] }}>
              <Avatar avatarKey={d.author.avatarKey} name={d.author.name} size={44} />
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: th.space[2] }}>
                  <Text variant="sm" bold>
                    {d.author.name}
                  </Text>
                  {d.author.role ? <Pill label={t(`role.${d.author.role.toLowerCase()}` as TranslationKey)} /> : null}
                </View>
                <Text variant="xs" tone="muted">
                  {meta}
                </Text>
              </View>
            </View>
            {d.status === "PENDING" ? <Pill tone="warn" label={t("bulletin.awaitingReview")} /> : null}
            {d.status === "REJECTED" ? <Pill tone="danger" label={t("bulletin.notPublished")} /> : null}
            <Text variant="xl" bold accessibilityRole="header">
              {d.title}
            </Text>
            <Pill tone="accent" label={t(CATEGORY[d.category])} />
            {d.body ? <Text variant="base">{d.body}</Text> : null}
            <Media media={d.media} headers={headers} />
            <Tags tags={d.tags} />
            {d.status === "REJECTED" && mine && d.rejectionReason ? (
              <Note tone="danger">
                <Text variant="xs" bold tone="danger">
                  {t("bulletin.whatTeacherSaid")}
                </Text>
                <Text variant="sm">{d.rejectionReason}</Text>
                <Text variant="xs" tone="muted">
                  {t("bulletin.writeNewPost")}
                </Text>
              </Note>
            ) : null}
            {d.status === "APPROVED" ? <Reactions reactions={d.reactions} myReactions={d.myReactions} commentCount={count} onReact={(kind) => react.mutate(kind)} /> : null}
          </Card>

          {d.status === "PENDING" && staff ? (
            <Card title={t("bulletin.needsReview")}>
              {rejecting ? (
                <>
                  <Field label={t("bulletin.whyNot")} placeholder={t("bulletin.rejectPlaceholder")} value={reason} onChangeText={setReason} multiline maxLength={500} style={{ minHeight: th.space[12] * 2, textAlignVertical: "top", paddingTop: th.space[3] }} />
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
                    <Button label={t("bulletin.sendBack")} variant="danger" busy={review.isPending} disabled={!reason.trim()} onPress={() => review.mutate({ decision: "REJECT", reason: reason.trim() })} />
                    <Button label={t("common.cancel")} variant="secondary" disabled={review.isPending} onPress={() => setRejecting(false)} />
                  </View>
                </>
              ) : (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
                  <Button label={t("bulletin.publishIt")} busy={review.isPending} onPress={() => review.mutate({ decision: "APPROVE" })} />
                  <Button label={t("bulletin.sendBack")} variant="secondary" disabled={review.isPending} onPress={() => setRejecting(true)} />
                </View>
              )}
            </Card>
          ) : null}

          {hideable ? (
            hiding ? (
              <Confirm question={t("bulletin.hideConfirm")} confirmLabel={t("bulletin.hideHere")} busy={hide.isPending} onConfirm={() => hide.mutate()} onCancel={() => setHiding(false)} />
            ) : (
              <Button label={t("bulletin.hideHere")} variant="secondary" onPress={() => setHiding(true)} />
            )
          ) : null}

          {d.ackReport.length > 0 ? (
            <Card title={t("bulletin.ackOutstandingTitle")}>
              {d.ackReport.map((group) => (
                <Row
                  key={group.classId ?? "staff"}
                  title={group.className || t("bulletin.audienceTeachers")}
                  caption={group.outstanding.length > 0 ? `${t("bulletin.ackStillWaiting")} ${group.outstanding.join(", ")}` : undefined}
                  right={<Text variant="sm" tone="muted">{t("bulletin.ackReached", { reached: group.reached, total: group.total })}</Text>}
                />
              ))}
            </Card>
          ) : null}

          <Card title={count === 0 ? t("bulletin.comments") : count === 1 ? t("bulletin.commentsOne") : t("bulletin.commentsMany", { count })}>
            {count === 0 ? (
              <Text variant="sm" tone="muted">
                {t("bulletin.noCommentsYet")}
              </Text>
            ) : (
              tops.map((c) => (
                <View key={c.id} style={{ gap: th.space[2] }}>
                  <CommentView comment={c} canReply={canReply} onReply={setReplyTo} />
                  {repliesTo(c.id).map((r) => (
                    <View key={r.id} style={{ marginLeft: th.space[8] }}>
                      <CommentView comment={r} reply canReply={canReply} onReply={setReplyTo} />
                    </View>
                  ))}
                </View>
              ))
            )}
            {staff && d.comments.some((c) => c.status === "PENDING") ? (
              <Text variant="xs" tone="subtle">
                {t("bulletin.pendingVisibleToYou")}
              </Text>
            ) : null}
            {canReply ? (
              <>
                {replyTo ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: th.space[2] }}>
                    <Text variant="sm" tone="muted" style={{ flex: 1 }}>
                      {`${t("bulletin.reply")} · ${replyTo.name}`}
                    </Text>
                    <Button label={t("common.cancel")} variant="ghost" onPress={() => setReplyTo(null)} />
                  </View>
                ) : null}
                <Field
                  label={replyTo ? t("bulletin.writeReply") : t("bulletin.writeComment")}
                  placeholder={t("bulletin.sayKind")}
                  value={comment}
                  onChangeText={(next) => {
                    setComment(next);
                    setCommentError(null);
                  }}
                  multiline
                  maxLength={4000}
                  hint={d.commentsWillBeHeld ? t("bulletin.teacherChecksComment") : t("bulletin.everyoneCanRead")}
                  error={commentError}
                />
                <Button label={t("common.send")} busy={addComment.isPending} disabled={!comment.trim()} onPress={() => addComment.mutate()} />
              </>
            ) : null}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

/** One comment: the avatar, who and when, the words, and — once it is public — a way to answer it. */
function CommentView({ comment, reply, canReply, onReply }: { comment: Comment; reply?: boolean; canReply: boolean; onReply: (to: { id: string; name: string }) => void }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const held = comment.status === "PENDING";
  const name = comment.mine ? t("common.you") : comment.author.name;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: th.space[2], padding: th.space[3], borderRadius: th.radius.md, backgroundColor: held ? th.warnSoft : th.surfaceMuted }}>
      <Avatar avatarKey={comment.author.avatarKey} name={comment.author.name} size={reply ? 24 : 32} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="xs" tone="muted">
          {`${name} · ${relativeTime(comment.createdAt, locale)}`}
        </Text>
        <Text variant="sm">{comment.body}</Text>
        {held ? (
          <Text variant="xs" bold tone="warn">
            {comment.mine ? t("bulletin.checkingBeforeOthers") : t("bulletin.awaitingReview")}
          </Text>
        ) : null}
        {canReply && !held ? (
          <View style={{ alignSelf: "flex-start" }}>
            <Button label={t("bulletin.reply")} variant="ghost" accessibilityLabel={`${t("bulletin.reply")}: ${comment.author.name}`} onPress={() => onReply({ id: comment.parentCommentId ?? comment.id, name: comment.author.name })} />
          </View>
        ) : null}
      </View>
    </View>
  );
}
