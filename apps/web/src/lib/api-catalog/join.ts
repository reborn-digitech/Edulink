import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/**
 * join: a signed-in person who belongs to no school yet ASKS to join one with
 * a school or class code, as a pupil, on the account they already have — the
 * web's /join "What's your code?" steps, through the same lib/join.ts. Any
 * session may call both; the refusals (a parent's account, a staff post at
 * that school) are 422s with the sentence. Neither carries a sampleBody: the
 * sweep's actors would each ask to join ZZ Northgate, so the sweep asserts the
 * 422 alone. tests/api-v1-join.test.ts proves the 202 with ZZ rows of its own.
 */
export const JOIN: Endpoint[] = [
  {
    method: "POST",
    path: "/api/v1/join/lookup",
    summary: "What a school or class code is: the school's name, and the class's for a class code (422 with the sentence on `code`; 429 with Retry-After once the caller has guessed too often)",
    access: "signed-in",
    request: c.joinCodeBodySchema,
    response: c.joinLookupSchema,
    emptyBodyStatus: 422,
  },
  {
    method: "POST",
    path: "/api/v1/join",
    summary: "Ask to join the school (and class) a code names, as a pupil on this account; the request waits for the office or the class's teacher and nothing of the school opens until then",
    access: "signed-in",
    request: c.joinCodeBodySchema,
    response: c.joinFiledSchema,
    emptyBodyStatus: 422,
  },
  {
    method: "GET",
    path: "/api/v1/join/requests",
    summary: "My own requests to join: the ones waiting and the ones not accepted, newest first",
    access: "signed-in",
    response: c.joinRequestsSchema,
  },
];
