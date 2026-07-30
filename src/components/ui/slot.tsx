import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Minimal `asChild` implementation: merges the parent's props onto its single
 * child element so `<Button asChild><Link/></Button>` renders one anchor with
 * button styling — important because a nav item must be a real <a> for
 * middle-click, keyboard and screen-reader semantics.
 *
 * Radix's Slot does more (ref composition across multiple levels); this covers
 * the single-child case the app actually uses.
 *
 * NO "use client" HERE, DELIBERATELY. This file must stay shared so it renders
 * in whichever tree its caller lives in. `Button` is a server component, so
 * marking Slot as a client component pushed the child element across the RSC
 * boundary — and a serialised child arrives as an unresolved lazy reference,
 * which `Children.only` rejects. That took out every route whose page rendered
 * enough elements to make React defer one: `/bulletin` returned 500 in
 * production while dev, which inlines the payload, looked fine. Nothing below
 * needs client APIs — no hooks, no handlers — so shared is also honest.
 */
export function Slot({
  children,
  className,
  ...props
}: { children?: ReactNode; className?: string } & Record<string, unknown>) {
  const child = Children.only(children) as ReactElement<Record<string, unknown>>;
  if (!isValidElement(child)) return null;

  const childProps = child.props as { className?: string };
  return cloneElement(child, {
    ...props,
    ...childProps,
    className: cn(className, childProps.className),
  });
}
