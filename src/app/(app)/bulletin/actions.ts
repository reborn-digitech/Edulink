"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { AccessError } from "@/lib/tenancy";
import {
  addComment,
  createPost,
  moderatePost,
  reportContent,
  toggleReaction,
  togglePin,
} from "@/lib/bulletin";
import { postSchema, reactionSchema, reportSchema, fieldErrors, type FieldErrors } from "@/lib/validation";
import type { PostStatus } from "@/lib/constants";

export type PostState = { ok: boolean; errors: FieldErrors; postId?: string; status?: PostStatus };

export async function submitPost(input: unknown): Promise<PostState> {
  const session = await getSession();
  if (!session) return { ok: false, errors: { _form: "Please log in again." } };

  const parsed = postSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  try {
    const result = await createPost(session, {
      scope: parsed.data.scope,
      classId: parsed.data.classId || undefined,
      title: parsed.data.title,
      body: parsed.data.body,
      tags: parsed.data.tags,
      media: parsed.data.media,
    });
    revalidatePath("/bulletin");
    return { ok: true, errors: {}, ...result };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, errors: { _form: error.message } };
    console.error("[submitPost]", error);
    return { ok: false, errors: { _form: "We could not post that. Please try again." } };
  }
}

export async function review(
  postId: string,
  decision: "APPROVE" | "REJECT",
  reason?: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Please log in again." };

  try {
    await moderatePost(session, postId, decision, reason);
    revalidatePath("/bulletin");
    return { ok: true };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: error.message };
    console.error("[review]", error);
    return { ok: false, error: "Something went wrong." };
  }
}

export async function pin(postId: string): Promise<{ ok: boolean; pinned?: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Please log in again." };
  try {
    const pinned = await togglePin(session, postId);
    revalidatePath("/bulletin");
    return { ok: true, pinned };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: error.message };
    return { ok: false, error: "Something went wrong." };
  }
}

export async function react(input: unknown): Promise<{ ok: boolean; added?: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Please log in again." };

  const parsed = reactionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Unknown reaction." };

  try {
    const result = await toggleReaction(session, parsed.data.postId, parsed.data.kind);
    revalidatePath("/bulletin");
    return { ok: true, added: result.added };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: error.message };
    return { ok: false, error: "Something went wrong." };
  }
}

export async function comment(
  postId: string,
  body: string,
): Promise<{ ok: boolean; held?: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Please log in again." };
  if (body.trim().length === 0) return { ok: false, error: "Write something first." };
  if (body.length > 4000) return { ok: false, error: "That is too long." };

  try {
    const result = await addComment(session, postId, body);
    revalidatePath(`/bulletin/${postId}`);
    revalidatePath("/bulletin");
    return { ok: true, held: result.status === "PENDING" };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: error.message };
    return { ok: false, error: "Something went wrong." };
  }
}

export async function report(input: unknown): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Please log in again." };

  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Pick a reason." };

  try {
    await reportContent(session, parsed.data);
    return { ok: true };
  } catch (error) {
    // Must NOT swallow this. Telling a child "reported" when the row was never
    // written means a safeguarding concern silently disappears while they
    // believe an adult has been told. Say it failed, and give them a route that
    // does not depend on this app working.
    console.error("[report] FAILED TO RECORD REPORT", error);
    return {
      ok: false,
      error: "We could not send that report. Please tell a teacher or an adult at home directly.",
    };
  }
}
