import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * A person's name as a door to their profile.
 *
 * ONE COMPONENT FOR EVERY NAME, because a name that is a link on one page
 * and a caption on the next teaches people to stop pressing names. When
 * there is a membership to point at, the name links to `/people/[id]`;
 * when there is none — a parent, a leaver, somebody at another school on
 * the global feed — it renders as plain text with the same styling, so the
 * page does not change shape depending on who wrote what.
 */
export function PersonLink({
  membershipId,
  name,
  className,
  children,
  linked = true,
}: {
  membershipId: string | null | undefined;
  /** False for a reader whose gate does not open /people (an alumnus, a college desk; lib/page-links.ts): the name is text, never a way to "Where would you like to go?" (QA-19). */
  linked?: boolean;
  name: string;
  className?: string;
  /** Something other than the name to wrap — an avatar, a card. */
  children?: React.ReactNode;
}) {
  if (!membershipId || !linked) {
    return <span className={className}>{children ?? name}</span>;
  }
  return (
    <Link
      href={`/people/${membershipId}`}
      // A finger's worth of height around a name set in small type, without moving the line it sits in: padding the negative margins take back.
      className={cn("-mx-1 -my-2.5 inline-block rounded-[var(--radius-sm)] px-1 py-2.5 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent", className)}
      aria-label={children ? name : undefined}
    >
      {children ?? name}
    </Link>
  );
}
