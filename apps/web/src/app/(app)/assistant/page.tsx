import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@/lib/session";
import { backTo, withDrawer } from "@/lib/assistant/back-to";

/**
 * /assistant, since Vidura pass 1 (17 Oct 2026; docs/plans/vidura.md): not a page of its own any more. The one entry
 * point is the round button at the bottom right of every page, and the history lives in its drawer; an old link, a
 * bookmark or a notice that still opens /assistant is sent back to the page the person was on — `?from=`, else the
 * page that linked here, else their home — with the drawer open (`?vidura=open`, read by the shell). A person whose
 * plan is missing never reaches this: the layout draws the plan card instead, which is where the round button leads them.
 */
export default async function AssistantPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const [session, { from }, h] = await Promise.all([getSession(), searchParams, headers()]);
  redirect(withDrawer(backTo(from ?? null, h.get("referer"), h.get("host"), session?.role ?? null), "open"));
}
