"use server";

import { revalidatePath } from "next/cache";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/session";
import { AccessError } from "@/lib/tenancy";
import {
  acknowledgePost,
  addComment,
  createPost,
  moderatePost,
  moderateAuthorPending,
  reportContent,
  toggleReaction,
  togglePin,
} from "@/lib/bulletin";
import { postSchema, reactionSchema, reportSchema, fieldErrors, type FieldErrors } from "@/lib/validation";
import { storeAttachments, discard, AttachmentError } from "@/lib/uploads";
import type { MediaItem } from "@/lib/json";
import type { PostStatus } from "@/lib/constants";

export type PostState = { ok: boolean; errors: FieldErrors; postId?: string; status?: PostStatus };

/** Matches the `.max(10)` on `postSchema.media`, which is what enforces it. */
const MAX_PICTURES = 10;

/**
 * Compose a post, with up to ten pieces of media — pictures and videos.
 *
 * The files arrive as FormData and are stored HERE, so the caller never names a
 * fileId. That is deliberate and load-bearing: `files.ts` authorises a stored
 * file by finding the post whose `media` mentions it, so a client that could
 * put an arbitrary fileId into its own post could point at somebody else's
 * attachment and have the lookup grant its own audience access to it. There is
 * no check guarding that, because there is nothing to check — the ids are minted
 * server-side from bytes this user just uploaded. (§6)
 *
 * Storing is all-or-nothing (`storeAttachments`): if the fourth picture is
 * rejected, the three already written are removed. A half-uploaded post would
 * otherwise leave files no record mentions, which nothing can then reach.
 */
export async function submitPost(formData: FormData): Promise<PostState> {
  const session = await getSession();
  if (!session) return { ok: false, errors: { _form: (await getT())("common.logInAgain") } };

  const fields = {
    scope: String(formData.get("scope") ?? ""),
    category: String(formData.get("category") ?? "UPDATES"),
    classId: String(formData.get("classId") ?? ""),
    audience: String(formData.get("audience") ?? "ALL"),
    audienceGrade: String(formData.get("audienceGrade") ?? ""),
    requiresAck: String(formData.get("requiresAck") ?? ""),
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
    tags: formData.getAll("tags").map(String),
    media: [],
  };

  // Validate the text BEFORE writing any bytes, so a post that was never going
  // to be accepted does not leave a file behind.
  const parsed = postSchema.safeParse(fields);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error, await getT()) };

  // Two lists in the same order — the form appends a file and its alt text in
  // lockstep, and FormData preserves insertion order per key. Zipped rather than
  // indexed field names because the pairing is then a property of one loop.
  const files = formData.getAll("images").filter((v): v is File => v instanceof File && v.size > 0);
  const alts = formData.getAll("alts").map((v) => String(v).trim());

  if (files.length > MAX_PICTURES) {
    return { ok: false, errors: { image: (await getT())("bulletin.upToPictures", { max: MAX_PICTURES }) } };
  }

  // A picture with no words is unreadable to the children who most need them,
  // and validation has always required one each. Checked BEFORE anything is
  // stored, so a post that cannot be accepted leaves nothing on disk.
  const missing = files.findIndex((_, index) => !alts[index]);
  if (missing !== -1) {
    return {
      ok: false,
      errors: { [`alt-${missing}`]: (await getT())("bulletin.describeThisPicture") },
    };
  }

  let media: MediaItem[] = [];

  if (files.length > 0) {
    try {
      const stored = await storeAttachments(files, { max: MAX_PICTURES });
      // Pictures and videos are a post's media; a PDF is not — that is what
      // assignments are for. The check runs on the mime the magic bytes
      // proved, not the name the browser offered.
      const notMedia = stored.filter(
        (item) => !item.mime.startsWith("image/") && !item.mime.startsWith("video/"),
      );
      if (notMedia.length > 0) {
        await discard(stored.map((item) => item.fileId));
        return { ok: false, errors: { image: (await getT())("bulletin.allPictures") } };
      }
      media = stored.map((item, index) => ({
        fileId: item.fileId,
        kind: item.mime.startsWith("video/") ? ("video" as const) : ("image" as const),
        alt: alts[index]!.slice(0, 300),
      }));
    } catch (error) {
      // AttachmentError messages are written for the person uploading.
      if (error instanceof AttachmentError) return { ok: false, errors: { image: (await getT())(error.key, error.vars) } };
      console.error("[submitPost] upload failed", error);
      return { ok: false, errors: { image: (await getT())("bulletin.couldNotSavePictures") } };
    }
  }

  try {
    const result = await createPost(session, {
      scope: parsed.data.scope,
      category: parsed.data.category,
      classId: parsed.data.classId || undefined,
      title: parsed.data.title,
      body: parsed.data.body,
      tags: parsed.data.tags,
      media,
      audience: parsed.data.audience,
      audienceGrade: parsed.data.audienceGrade || undefined,
      requiresAck: parsed.data.requiresAck,
    });
    revalidatePath("/bulletin");
    return { ok: true, errors: {}, ...result };
  } catch (error) {
    // The post is what makes a stored file reachable and deletable. If it never
    // existed, nothing will ever reference this file again — remove it now
    // rather than leave an unowned image on disk.
    await discard(media.map((item) => item.fileId));
    if (error instanceof AccessError)
      return { ok: false, errors: { _form: (await getT())(error.key, error.vars) } };
    console.error("[submitPost]", error);
    return { ok: false, errors: { _form: (await getT())("bulletin.couldNotPostTryAgain") } };
  }
}

export async function review(
  postId: string,
  decision: "APPROVE" | "REJECT",
  reason?: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: (await getT())("common.logInAgain") };

  try {
    await moderatePost(session, postId, decision, reason);
    revalidatePath("/bulletin");
    return { ok: true };
  } catch (error) {
    if (error instanceof AccessError)
      return { ok: false, error: (await getT())(error.key, error.vars) };
    console.error("[review]", error);
    return { ok: false, error: (await getT())("common.somethingWrong") };
  }
}

/** One decision over everything an author has waiting — see bulk-review.tsx. */
export async function reviewAllFrom(
  authorUserId: string,
  decision: "APPROVE" | "REJECT",
  reason?: string,
): Promise<{ ok: boolean; decided?: number; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: (await getT())("common.logInAgain") };
  try {
    const { decided } = await moderateAuthorPending(session, authorUserId, decision, reason);
    revalidatePath("/bulletin");
    return { ok: true, decided };
  } catch (error) {
    if (error instanceof AccessError)
      return { ok: false, error: (await getT())(error.key, error.vars) };
    console.error("[review-all]", error);
    return { ok: false, error: (await getT())("common.somethingWrong") };
  }
}

export async function pin(postId: string): Promise<{ ok: boolean; pinned?: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: (await getT())("common.logInAgain") };
  try {
    const pinned = await togglePin(session, postId);
    revalidatePath("/bulletin");
    return { ok: true, pinned };
  } catch (error) {
    if (error instanceof AccessError)
      return { ok: false, error: (await getT())(error.key, error.vars) };
    return { ok: false, error: (await getT())("common.somethingWrong") };
  }
}

export async function react(input: unknown): Promise<{ ok: boolean; added?: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: (await getT())("common.logInAgain") };

  const parsed = reactionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: (await getT())("bulletin.unknownReaction") };

  try {
    const result = await toggleReaction(session, parsed.data.postId, parsed.data.kind);
    revalidatePath("/bulletin");
    return { ok: true, added: result.added };
  } catch (error) {
    if (error instanceof AccessError)
      return { ok: false, error: (await getT())(error.key, error.vars) };
    return { ok: false, error: (await getT())("common.somethingWrong") };
  }
}

export async function comment(
  postId: string,
  body: string,
  parentCommentId?: string,
): Promise<{ ok: boolean; held?: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: (await getT())("common.logInAgain") };
  if (body.trim().length === 0) return { ok: false, error: (await getT())("bulletin.writeSomethingFirst") };
  if (body.length > 4000) return { ok: false, error: (await getT())("bulletin.tooLong") };

  try {
    const result = await addComment(session, postId, body, parentCommentId);
    revalidatePath(`/bulletin/${postId}`);
    revalidatePath("/bulletin");
    return { ok: true, held: result.status === "PENDING" };
  } catch (error) {
    if (error instanceof AccessError)
      return { ok: false, error: (await getT())(error.key, error.vars) };
    return { ok: false, error: (await getT())("common.somethingWrong") };
  }
}

export async function acknowledge(postId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: (await getT())("common.logInAgain") };

  try {
    await acknowledgePost(session, postId);
    revalidatePath("/bulletin");
    revalidatePath(`/bulletin/${postId}`);
    return { ok: true };
  } catch (error) {
    if (error instanceof AccessError)
      return { ok: false, error: (await getT())(error.key, error.vars) };
    console.error("[acknowledge]", error);
    return { ok: false, error: (await getT())("common.somethingWrong") };
  }
}

export async function report(input: unknown): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: (await getT())("common.logInAgain") };

  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: (await getT())("bulletin.pickReason") };

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
      error: (await getT())("bulletin.reportFailed"),
    };
  }
}
