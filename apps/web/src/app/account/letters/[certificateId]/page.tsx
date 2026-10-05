/**
 * One of my appointment letters as it prints (risks batch 5A, 5 Oct 2026): the
 * certificate page itself, served under /account so every member of staff —
 * the college roles too — reaches their own paper; certificates.ts `mayRead`
 * lets only the office and the member of staff it was issued to read it.
 */
export { default, generateMetadata } from "../../../(app)/certificates/[certificateId]/page";
