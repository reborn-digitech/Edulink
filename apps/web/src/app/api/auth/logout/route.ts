import { NextResponse } from "next/server";
import { destroySession } from "@/lib/session";

/**
 * POST-only.
 *
 * A GET logout would let any page log the user out with an <img src> — and, in
 * an app children use, that is a genuinely annoying prank vector as well as a
 * CSRF smell. The SameSite=Lax cookie plus POST-only covers it.
 */
export async function POST(request: Request) {
  await destroySession();
  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
}
