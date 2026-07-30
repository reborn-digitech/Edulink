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
import { deleteStoredFile, storeFile, UploadError } from "@/lib/storage";
import type { MediaItem } from "@/lib/json";
import type { PostStatus } from "@/lib/constants";

export type PostState = { ok: boolean; errors: FieldErrors; postId?: string; status?: PostStatus };

/**
 * Compose a post, with an optional picture.
 *
 * The file arrives as FormData and is stored HERE, so the caller never names a
 * fileId. That is deliberate and load-bearing: `files.ts` authorises a stored
 * file by finding the post whose `media` mentions it, so a client that could
 * put an arbitrary fileId into its own post could point at somebody else's
 * attachment and have the lookup grant its own audience access to it. There is
 * no check guarding that, because there is nothing to check — the id is minted
 * server-side from bytes this user just uploaded. (§6)
 */
export async function submitPost(formData: FormData): Promise<PostState> {
  const session = await getSession();
  if (!session) return { ok: false, errors: { _form: "Please log in again." } };

  const fields = {
    scope: String(formData.get("scope") ?? ""),
    classId: String(formData.get("classId") ?? ""),
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
    tags: formData.getAll("tags").map(String),
    media: [],
  };

  // Validate the text BEFORE writing any bytes, so a post that was never going
  // to be accepted does not leave a file behind.
  const parsed = postSchema.safeParse(fields);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  const picture = formData.get("image");
  const alt = String(formData.get("alt") ?? "").trim();
  let media: MediaItem[] = [];

  if (picture instanceof File && picture.size > 0) {
    if (!alt) {
      return {
        ok: false,
        errors: { alt: "Describe the picture, so it makes sense read aloud." },
      };
    }
    try {
      const stored = await storeFile(picture);
      if (stored.kind !== "image") {
        await deleteStoredFile(stored.fileId);
        return { ok: false, errors: { image: "That needs to be a picture." } };
      }
      media = [{ fileId: stored.fileId, kind: "image", alt: alt.slice(0, 300) }];
    } catch (error) {
      // UploadError messages are written for the person uploading.
      if (error instanceof UploadError) return { ok: false, errors: { image: error.message } };
      console.error("[submitPost] upload failed", error);
      return { ok: false, errors: { image: "That picture could not be saved." } };
    }
  }

  try {
    const result = await createPost(session, {
      scope: parsed.data.scope,
      classId: parsed.data.classId || undefined,
      title: parsed.data.title,
      body: parsed.data.body,
      tags: parsed.data.tags,
      media,
    });
    revalidatePath("/bulletin");
    return { ok: true, errors: {}, ...result };
  } catch (error) {
    // The post is what makes a stored file reachable and deletable. If it never
    // existed, nothing will ever reference this file again — remove it now
    // rather than leave an unowned image on disk.
    await Promise.all(media.map((item) => deleteStoredFile(item.fileId)));
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
