import { useEffect, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { searchResultsSchema, type SearchHit, type SearchKind } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, ShowMore, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { screenFor } from "@/lib/links";
import { openWeb } from "@/screens/family/shared";

/** A keystroke's worth of quiet before the server is asked, as the web's palette waits. */
export const SEARCH_DEBOUNCE_MS = 250;
/** The endpoint's own floor: under this nothing is sent. */
export const SEARCH_MIN_CHARS = 2;

const GROUPS: { kind: SearchKind; labelKey: TranslationKey; icon: string }[] = [
  { kind: "people", labelKey: "search.groupPeople", icon: "users" },
  { kind: "posts", labelKey: "search.groupPosts", icon: "megaphone" },
  { kind: "messages", labelKey: "search.groupMessages", icon: "chat" },
  { kind: "papers", labelKey: "search.groupPapers", icon: "fileText" },
  { kind: "pages", labelKey: "search.groupPages", icon: "house" },
];

/** `?q=&limit=` for the search endpoint. */
export function searchPath(q: string): string {
  return `/api/v1/search?q=${encodeURIComponent(q)}&limit=20`;
}

/**
 * Search: one box, the server's groups under it (GET /api/v1/search, which
 * fences every group to what this person may already see). A row opens
 * the screen the server named; a page of the menu names no screen, so it
 * is mapped from its web path the way a notification's link is, and what
 * the phone has no screen for opens on the web.
 */
export function Search() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const [typed, setTyped] = useState("");
  const [q, setQ] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setQ(typed.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [typed]);
  const ready = q.length >= SEARCH_MIN_CHARS;
  const query = useQuery({
    queryKey: ["search", q],
    enabled: ready,
    placeholderData: keepPreviousData,
    queryFn: async () => searchResultsSchema.parse(unwrap(await api().get(searchPath(q)))),
  });
  const open = (hit: SearchHit) => {
    if (hit.phoneRoute) {
      router.push(hit.phoneRoute as never);
      return;
    }
    const target = screenFor(hit.href);
    if (target) router.push(target as never);
    else openWeb(hit.href);
  };
  const d = ready ? query.data : undefined;
  const groups = d ? GROUPS.map((g) => ({ ...g, hits: d[g.kind] })).filter((g) => g.hits.length > 0) : [];
  return (
    <Screen title={t("search.title")}>
      <Field label={t("search.label")} placeholder={t("search.placeholder")} hint={ready ? undefined : t("search.hint")} value={typed} onChangeText={setTyped} autoFocus autoCapitalize="none" autoCorrect={false} returnKeyType="search" onSubmitEditing={() => setQ(typed.trim())} />
      {ready && query.isPending ? <Loading /> : null}
      {ready && query.isFetching && !query.isPending ? (
        <Text variant="xs" tone="muted" accessibilityLiveRegion="polite">
          {t("search.searching")}
        </Text>
      ) : null}
      {ready && query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d && groups.length === 0 ? (
        <Empty
          icon="tray"
          title={t("search.nothing", { query: d.q })}
          body={t("search.nothingBody")}
          action={<Button label={t("people.clearFilters")} variant="secondary" onPress={() => { setTyped(""); setQ(""); }} />}
        />
      ) : null}
      {groups.map((g) => (
        <Card key={g.kind} title={`${t(g.labelKey)} · ${g.hits.length}`}>
          <View style={{ gap: th.space[1] }}>
            <ShowMore items={g.hits} page={5}>
              {(shown) => shown.map((hit) => <Row key={`${hit.kind}-${hit.id}`} icon={g.icon} title={hit.title} caption={hit.subtitle ?? undefined} onPress={() => open(hit)} />)}
            </ShowMore>
          </View>
        </Card>
      ))}
    </Screen>
  );
}
