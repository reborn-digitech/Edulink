/**
 * The page title's look, for the few pages whose top PageHeader cannot draw: a conversation or a profile whose
 * heading sits beside an avatar, the register's sticky bar. They keep their own hero and use this on its h1, so the
 * title is the same weight everywhere (A3-states-9: ten hand-rolled h1 variants on 5 Oct 2026). A plain module, so a
 * client component can take it without PageHeader's server-only icon import.
 */
export const PAGE_TITLE = "flex flex-wrap items-center gap-2 text-2xl font-bold tracking-tight text-fg sm:text-3xl";
