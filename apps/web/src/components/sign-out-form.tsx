"use client";

import { useRef, type FormEvent, type ReactNode } from "react";
import { switchOffPush } from "@/lib/push-client";

/**
 * The sign-out form, wherever a page offers one (TA-041).
 *
 * Still a plain form posted to /api/auth/logout, so it works before the page's
 * script has loaded and with none at all. With the script, pressing it first
 * switches this browser's notices off and tells the server (`switchOffPush`,
 * which gives up after three seconds), and only then posts: a parent who
 * signs out of a shared computer does not leave it showing their child's
 * notices to the next person who sits down. The server removes the sign-in's
 * registration with the sign-out too, so the scriptless press is covered for
 * sending; this step is what clears the browser itself.
 */
export function SignOutForm({ className, children }: { className?: string; children: ReactNode }) {
  const leaving = useRef(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // A second press while the first is still switching notices off: the first one posts.
    if (leaving.current) return;
    leaving.current = true;
    const form = event.currentTarget;
    void switchOffPush().finally(() => {
      // form.submit() posts without raising another submit event, so this handler does not run twice. A form that
      // left the page while notices were being switched off (a menu that closed on the press) cannot post, so the
      // same request goes from one that is on the page.
      let posting = form;
      if (!form.isConnected) {
        posting = document.createElement("form");
        posting.method = "post";
        posting.action = "/api/auth/logout";
        document.body.appendChild(posting);
      }
      posting.submit();
    });
  }

  return (
    <form action="/api/auth/logout" method="post" className={className} onSubmit={onSubmit}>
      {children}
    </form>
  );
}
