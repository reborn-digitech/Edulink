"use client";

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
