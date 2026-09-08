import { useState } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { keepPreviousData, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import { bulletinFeedSchema, bulletinReactResultSchema } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Icon, Loading, Screen, Text } from "@/components";
import { api, API_BASE, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useRole } from "@/lib/session";
import { Chips, Note, openWeb, Pill, relativeTime, useAuthHeaders } from "./shared";

type Feed = z.infer<typeof bulletinFeedSchema>;
type Post = Feed["items"][number];
type Reaction = Post["myReactions"][number];

const CATEGORY: Record<Post["category"], TranslationKey> = { PEOPLE: "bulletin.catPeople", CAMPUS: "bulletin.catCampus", EVENTS: "bulletin.catEvents", LEARNING: "bulletin.catLearning", UPDATES: "bulletin.catUpdates" };
const AUDIENCE: Record<"PARENTS" | "TEACHERS" | "STUDENTS", TranslationKey> = { PARENTS: "bulletin.forParents", TEACHERS: "bulletin.forTeachers", STUDENTS: "bulletin.forStudents" };
/** The web's REACTION_META: keys, not words, in the same order. */
const REACTIONS: { kind: Reaction; icon: string; label: TranslationKey }[] = [
  { kind: "CLAP", icon: "clap", label: "bulletin.reactClap" },
  { kind: "STAR", icon: "star", label: "bulletin.reactStar" },
  { kind: "IDEA", icon: "lightbulb", label: "bulletin.reactIdea" },
  { kind: "HEART", icon: "heart", label: "bulletin.reactHeart" },
  { kind: "CELEBRATE", icon: "confetti", label: "bulletin.reactCelebrate" },
  { kind: "PROUD", icon: "trophy", label: "bulletin.reactProud" },
  { kind: "THANKS", icon: "handsPraying", label: "bulletin.reactThanks" },
];

function feedPath(schoolId: string | null, cursor: string | null): string {
  const parts = ["limit=20"];
  if (cursor) parts.push(`cursor=${encodeURIComponent(cursor)}`);
  if (schoolId) parts.push(`school=${encodeURIComponent(schoolId)}`);
  return `/api/v1/shared/bulletin?${parts.join("&")}`;
}

/**
 * The social feed — the web's /bulletin as a reader: the school's posts,
 * cursor paged, with the reaction row. A family with children at two
 * schools reads two bulletins, so a guardian gets the picker the web has.
 * Pictures come through /api/files with the bearer token; React Native's
 * Image cannot send a header, expo-image can, so that is what draws them.
 */
export function FamilyBulletin() {
  const t = useT();
  const qc = useQueryClient();
  const role = useRole();
  const router = useRouter();
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const feed = useInfiniteQuery({
    queryKey: ["bulletin", schoolId],
    queryFn: async ({ pageParam }) => bulletinFeedSchema.parse(unwrap(await api().get(feedPath(schoolId, pageParam)))),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    placeholderData: keepPreviousData,
  });
  const react = useMutation({
    mutationFn: async ({ postId, kind }: { postId: string; kind: Reaction }) => {
      const result = await api().post(`/api/v1/shared/bulletin/${encodeURIComponent(postId)}/react`, { kind });
      if (!result.ok) throw new Error(errorText(result, t("bulletin.couldNotReact")));
      return bulletinReactResultSchema.parse(result.data);
    },
    onSuccess: () => {
      setError(null);
      void qc.invalidateQueries({ queryKey: ["bulletin"] });
    },
    onError: (e) => setError(e.message),
  });
  const headers = useAuthHeaders();
  const first = feed.data?.pages[0];
  const posts = feed.data?.pages.flatMap((page) => page.items) ?? [];
  return (
    <Screen title={t("bulletin.title")} description={first?.schoolName ?? undefined} refreshing={feed.isRefetching && !feed.isFetchingNextPage} onRefresh={() => void feed.refetch()}>
      {first && first.schools.length > 1 ? (
        <Chips label={t("bulletin.chooseSchool")} value={schoolId ?? first.schoolId ?? ""} onChange={setSchoolId} options={first.schools.map((school) => ({ value: school.id, label: school.name }))} />
      ) : null}
      {error ? <Failed message={error} /> : null}
      {feed.isPending ? <Loading /> : null}
      {feed.isError ? <Failed message={feed.error.message} onRetry={() => void feed.refetch()} /> : null}
      {first ? (
        first.schoolId === null ? (
          <Empty
            title={t("bulletin.noSchool")}
            body={t("bulletin.noSchoolBody")}
            action={
              role === "PARENT" ? (
                <Button label={t("parent.linkAnother")} variant="secondary" onPress={() => openWeb("/parent/link")} />
              ) : (
                <Button label={t("nav.more")} variant="secondary" onPress={() => router.push("/(app)/more" as never)} />
              )
            }
          />
        ) : posts.length === 0 ? (
          <Empty
            title={t("bulletin.emptyTitle")}
            body={t("bulletin.emptyBody")}
            action={
              role === "PARENT" ? (
                <Button label={t("nav.overview")} variant="secondary" onPress={() => router.push("/(app)" as never)} />
              ) : (
                <Button label={t("bulletin.newPost")} variant="secondary" onPress={() => openWeb("/bulletin/new")} />
              )
            }
          />
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} headers={headers} onReact={(kind) => react.mutate({ postId: post.id, kind })} />)
        )
      ) : null}
      {feed.hasNextPage ? <Button variant="secondary" label={t("mobile.loadMore")} busy={feed.isFetchingNextPage} onPress={() => void feed.fetchNextPage()} /> : null}
    </Screen>
  );
}

function PostCard({ post, headers, onReact }: { post: Post; headers: Record<string, string> | null; onReact: (kind: Reaction) => void }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const pending = post.status === "PENDING";
  const rejected = post.status === "REJECTED";
  const where = post.scope === "CLASS" ? (post.className ?? t("bulletin.classField")) : t("bulletin.wholeSchool");
  const meta = [where, relativeTime(post.createdAt, locale), post.audience !== "ALL" ? t(AUDIENCE[post.audience]) : null, post.audienceGrade ? t("practice.classN", { n: post.audienceGrade }) : null].filter(Boolean).join(" · ");
  return (
    <Card>
      {post.pinned && !pending && !rejected ? <Pill tone="accent" label={t("bulletin.pinnedBySchool")} /> : null}
      {pending ? <Pill tone="warn" label={post.mine ? t("bulletin.waitingForCheck") : t("bulletin.needsReview")} /> : null}
      {rejected ? <Pill tone="danger" label={t("bulletin.notPublished")} /> : null}
      <View style={{ gap: 2 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: th.space[2], flexWrap: "wrap" }}>
          <Text variant="sm" bold>
            {post.authorName}
          </Text>
          {post.authorRole ? <Pill label={t(`role.${post.authorRole.toLowerCase()}` as TranslationKey)} /> : null}
        </View>
        <Text variant="xs" tone="muted">
          {meta}
        </Text>
      </View>
      <Text variant="lg" bold accessibilityRole="header">
        {post.title}
      </Text>
      <Pill tone="accent" label={t(CATEGORY[post.category])} />
      {post.body ? (
        <Text variant="sm" tone="muted">
          {post.body}
        </Text>
      ) : null}
      {post.media.map((item) =>
        item.kind === "image" ? (
          headers ? (
            <Image
              key={item.fileId}
              source={{ uri: `${API_BASE}/api/files/${encodeURIComponent(item.fileId)}?w=640`, headers }}
              accessible
              accessibilityLabel={item.alt}
              contentFit="cover"
              style={{ width: "100%", aspectRatio: 16 / 10, borderRadius: th.radius.md, backgroundColor: th.surfaceMuted }}
            />
          ) : null
        ) : (
          <Text key={item.fileId} variant="sm" tone="muted">
            {item.alt}
          </Text>
        ),
      )}
      {post.tags.length > 0 ? (
        <Text variant="xs" tone="muted">
          {post.tags.map((tag) => `#${tag}`).join("  ")}
        </Text>
      ) : null}
      {rejected && post.mine && post.rejectionReason ? (
        <Note tone="danger">
          <Text variant="xs" bold tone="danger">
            {t("bulletin.whatTeacherSaid")}
          </Text>
          <Text variant="sm">{post.rejectionReason}</Text>
          <Text variant="xs" tone="muted">
            {t("bulletin.writeNewPost")}
          </Text>
        </Note>
      ) : null}
      {post.requiresAck && post.status === "APPROVED" && post.acked ? (
        <Text variant="sm" bold tone="ok">
          {t("bulletin.ackDone")}
        </Text>
      ) : null}
      {post.status === "APPROVED" ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: th.space[1] }}>
          {REACTIONS.map((reaction) => {
            const n = post.reactions[reaction.kind] ?? 0;
            const on = post.myReactions.includes(reaction.kind);
            const label = t(reaction.label);
            return (
              <Pressable
                key={reaction.kind}
                accessibilityRole="button"
                accessibilityLabel={n > 0 ? `${label} (${n})` : label}
                accessibilityState={{ selected: on }}
                onPress={() => onReact(reaction.kind)}
                style={{ minHeight: th.tap, minWidth: th.tap, paddingHorizontal: th.space[3], borderRadius: th.radius.xl, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: th.space[1], backgroundColor: on ? th.accentSoft : undefined }}
              >
                <Icon name={reaction.icon} size={18} color={on ? th.accentStrong : th.fgMuted} weight={on ? "fill" : "bold"} />
                {n > 0 ? (
                  <Text variant="sm" bold tone={on ? "accent" : "muted"}>
                    {String(n)}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
          <View style={{ flexDirection: "row", alignItems: "center", gap: th.space[1], paddingHorizontal: th.space[2] }}>
            <Icon name="chat" size={18} color={th.fgMuted} />
            <Text variant="sm" tone="muted">
              {post.commentCount > 0 ? String(post.commentCount) : t("bulletin.comment")}
            </Text>
          </View>
        </View>
      ) : null}
    </Card>
  );
}
