import { useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bulletinHeldCommentsSchema, type BulletinCommentReviewBody, type BulletinHeldComment } from "@edulink/contracts";
import { Button, Card, Failed, Field, Row, Text, useToast } from "@/components";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Pill, relativeTime } from "./shared";

/**
 * The two decisions on a held comment, as on the web. Approve is one press:
 * the safe direction. Remove asks for a reason first, because the author is
 * told it. A refusal stays above the buttons until the next try; a decision
 * reads the bulletin again, so the comment leaves the queue it was in.
 */
export function CommentReview({ commentId, authorName }: { commentId: string; authorName: string }) {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [removing, setRemoving] = useState(false);
  const [reason, setReason] = useState("");
  const review = useMutation({
    mutationFn: async (body: BulletinCommentReviewBody) => {
      const result = await api().post(`/api/v1/shared/bulletin/comments/${encodeURIComponent(commentId)}/review`, body);
      if (!result.ok) throw new Error(errorText(result, t("common.somethingWrong")));
      return body.decision;
    },
    onSuccess: (decision) => {
      setRemoving(false);
      setReason("");
      toast.show(t(decision === "APPROVE" ? "bulletin.commentApprovedToast" : "bulletin.commentRemovedToast"));
      void qc.invalidateQueries({ queryKey: ["bulletin"] });
    },
  });
  return (
    <View style={{ gap: th.space[2] }}>
      {review.isError ? <Failed message={review.error.message} /> : null}
      {removing ? (
        <>
          <Field
            label={t("bulletin.commentRemoveReason")}
            hint={t("bulletin.commentRemoveReasonHint")}
            value={reason}
            onChangeText={(next) => {
              setReason(next);
              if (review.isError) review.reset();
            }}
            multiline
            maxLength={500}
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
            <Button label={t("bulletin.commentRemoveCta")} accessibilityLabel={`${t("bulletin.commentRemoveCta")}: ${authorName}`} variant="danger" busy={review.isPending} disabled={!reason.trim()} onPress={() => review.mutate({ decision: "REMOVE", reason: reason.trim() })} />
            <Button label={t("common.cancel")} variant="secondary" disabled={review.isPending} onPress={() => setRemoving(false)} />
          </View>
        </>
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
          <Button label={t("bulletin.commentApproveCta")} accessibilityLabel={`${t("bulletin.commentApproveCta")}: ${authorName}`} busy={review.isPending} onPress={() => review.mutate({ decision: "APPROVE" })} />
          <Button label={t("bulletin.commentRemoveCta")} accessibilityLabel={`${t("bulletin.commentRemoveCta")}: ${authorName}`} variant="secondary" disabled={review.isPending} onPress={() => setRemoving(true)} />
        </View>
      )}
    </View>
  );
}

/**
 * The comments waiting on this reader, at the top of the bulletin: a held
 * comment used to be found only by opening the post it sat under. Asked for
 * only when the feed says some are waiting, so a reader who reviews nothing
 * makes no second request. Oldest first, as the server sends them.
 */
export function HeldComments({ count, onOpen }: { count: number; onOpen: (postId: string) => void }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const query = useQuery({
    queryKey: ["bulletin", "held-comments"],
    enabled: count > 0,
    queryFn: async () => bulletinHeldCommentsSchema.parse(unwrap(await api().get("/api/v1/shared/bulletin/comments/held"))),
  });
  if (count === 0) return null;
  const items: BulletinHeldComment[] = query.data?.items ?? [];
  return (
    <Card title={`${t("bulletin.heldCommentsTitle")} (${query.data ? items.length : count})`}>
      <Text variant="xs" tone="muted">
        {t("bulletin.heldCommentsBody")}
      </Text>
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {items.map((comment) => (
        <View key={comment.id} style={{ gap: th.space[2], borderTopWidth: 1, borderTopColor: th.border, paddingTop: th.space[2] }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: th.space[2] }}>
            <Text variant="xs" tone="muted">
              {`${comment.authorName} · ${relativeTime(comment.createdAt, locale)}`}
            </Text>
            {comment.shared ? <Pill label={t("bulletin.heldOnShared")} tone="muted" /> : null}
            {comment.reply ? <Pill label={t("bulletin.heldIsReply")} tone="muted" /> : null}
          </View>
          <Text variant="sm">{comment.body}</Text>
          <Row title={t("bulletin.heldOnPost", { title: comment.postTitle })} caption={comment.className ?? undefined} onPress={() => onOpen(comment.postId)} />
          <CommentReview commentId={comment.id} authorName={comment.authorName} />
        </View>
      ))}
    </Card>
  );
}
