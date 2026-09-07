/**
 * The guardian's first-visit tour is decided on the SERVER, from a cookie.
 *
 * It used to be decided in the browser from localStorage: the server rendered
 * nothing, hydration found no dismissal and inserted the tour above the three
 * stat tiles, and Lighthouse measured the resulting jump as a layout shift of
 * 0.49 — the whole overview lurching down after it had already painted. A
 * cookie the server can read means the first paint is the final one. Not
 * httpOnly: it carries no authority; the worst a forged one does is hide a
 * welcome. A year long, the same as "got it" meant before.
 */
export const PARENT_WELCOME_COOKIE = "edulink_parent_welcome";
