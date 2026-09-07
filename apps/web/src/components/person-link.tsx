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
}: {
  membershipId: string | null | undefined;
  name: string;
  className?: string;
  /** Something other than the name to wrap — an avatar, a card. */
  children?: React.ReactNode;
}) {
  if (!membershipId) {
    return <span className={className}>{children ?? name}</span>;
  }
  return (
    <Link
      href={`/people/${membershipId}`}
      className={cn("rounded-sm hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent", className)}
      aria-label={children ? name : undefined}
    >
      {children ?? name}
    </Link>
  );
}
