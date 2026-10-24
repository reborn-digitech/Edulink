/**
 * Finding the school post whose copies went to Facebook and Instagram (QA campaign, layer 3): the feed is read
 * as the signed-in office, and each school-wide post's copies are asked for until one has some. The fixture hangs
 * its two copies (one SENT to Facebook, one FAILED for Instagram) on the school's first approved school-wide post.
 */
import { Given } from "@cucumber/cucumber";
import type { BddWorld } from "./world";

Given(/^I find the school post that has copies on Facebook or Instagram as "([\w.-]+)"$/, async function (this: BddWorld, name: string) {
  const feed = await this.call("GET", "/api/v1/shared/bulletin?limit=50");
  const items = ((feed.json as { items?: { id: string; scope: string }[] } | null)?.items ?? []).filter((i) => i.scope === "SCHOOL");
  for (const item of items) {
    const copies = await this.call("GET", `/api/v1/admin/social/posts?postId=${item.id}`);
    const list = (copies.json as { items?: unknown[] } | null)?.items ?? [];
    if (copies.status === 200 && list.length > 0) {
      this.vars.set(name, item.id);
      return;
    }
  }
  throw new Error(`none of the ${items.length} school-wide posts on the feed has a copy on Facebook or Instagram`);
});
