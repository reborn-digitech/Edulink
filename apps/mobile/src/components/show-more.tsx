import { useState, type ReactNode } from "react";
import { useT } from "@/lib/i18n";
import { Button } from "./button";

/**
 * A long list a page at a time: the first thirty rows, then a "Show 25 more"
 * button until every row is out. A parent's incident list once drew 205
 * cards and a health card 142 checks in one screen (the walk of 2026-10-01).
 * Nothing is fetched here: what the server sent is paged on the phone.
 */
export const SHOW_MORE_PAGE = 30;

export function ShowMore<T>({ items, page = SHOW_MORE_PAGE, children }: { items: T[]; page?: number; children: (shown: T[]) => ReactNode }) {
  const t = useT();
  const [shown, setShown] = useState(page);
  return (
    <>
      {children(items.slice(0, shown))}
      {items.length > shown ? <Button label={t("common.showMore", { count: Math.min(page, items.length - shown) })} variant="secondary" onPress={() => setShown((n) => n + page)} /> : null}
    </>
  );
}
