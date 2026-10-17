import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { ROLE_HOME, type Role } from "@/lib/constants";
import { withDrawer } from "@/lib/assistant/back-to";

/**
 * /assistant/{id}, since Vidura pass 1 (17 Oct 2026): one of the person's conversations opens in the drawer on their
 * home (`?vidura=<id>`); the door answers 404 for anyone else's, and the drawer says so.
 */
export default async function AssistantConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const [session, { conversationId }] = await Promise.all([getSession(), params]);
  const role = session?.role ?? null;
  const home = role && role in ROLE_HOME ? ROLE_HOME[role as Role] : "/";
  redirect(withDrawer(home, /^[\w-]{1,64}$/.test(conversationId) ? conversationId : "open"));
}
