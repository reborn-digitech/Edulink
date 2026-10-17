import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/**
 * plans-pay (17 October 2026): passes bought through the company's gateway (src/lib/pass-orders.ts, decision 0006;
 * tests/passes.test.ts). A college student, a teacher and an expert buy their own plan on a session of that role; a
 * guardian buys the Student plan for a child under eighteen; a pupil under eighteen only asks. The money is the
 * company's own revenue; no card detail reaches these doors (the gateway's page takes them). The operator's two doors
 * are in operator.ts. The sweep opens no order and asks nobody: every write's empty body is a 422, and an order id no
 * one holds is a 404 to every side. No `feature`: a pass is how a plan is bought, not a feature of its own.
 */
const BUYERS: c.RoleCode[] = ["STUDENT", "PARENT", "TEACHER", "EXPERT"];

export const PASSES: Endpoint[] = [
  { method: "GET", path: "/api/v1/account/pass", summary: "The plans I hold and until when, and each pass I may buy — for myself by my role, or a guardian for each child — with its monthly and yearly price, the GST on it and the total, and whether I may pay, must ask a guardian, or it is not on sale", access: "signed-in", limitedRoles: c.ALL_LIMITED_ROLES, response: c.passOverviewSchema },
  { method: "POST", path: "/api/v1/account/pass/checkout", summary: "Open a pass's order at the company's gateway ({ plan, period, studentMembershipId? }): the plan's own price today with its GST; the same order handed back when reopened within half an hour; refused with the reason when the pass is not mine to pay for or not on sale; audited", access: BUYERS, request: c.passCheckoutBodySchema, response: c.passCheckoutMadeSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/account/pass/confirm", summary: "The gateway checkout's handler signature for my order, checked with the company's key secret, then the one door every capture goes through: the pass opened from where my current window ends, and its tax invoice issued", access: BUYERS, request: c.passConfirmBodySchema, response: c.passConfirmedSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/account/pass/ask", summary: "A pupil under eighteen asks their guardians for the Student plan ({ plan }); each guardian told in the app with a link to buy it, once a day at most", access: ["STUDENT"], request: c.passAskBodySchema, response: c.passAskedSchema, emptyBodyStatus: 422 },
  { method: "GET", path: "/api/v1/account/pass/orders", summary: "The passes I paid for or hold, newest first: plan, period, for whom, the figures, the state, the window it opened and the invoice number", access: "signed-in", limitedRoles: c.ALL_LIMITED_ROLES, response: c.passOrdersSchema },
  { method: "GET", path: "/api/v1/account/pass/orders/{id}", summary: "One of my pass orders, with the gateway checkout while it waits for me to pay; the web's payment panel polls it", access: "signed-in", limitedRoles: c.ALL_LIMITED_ROLES, response: c.passOrderReadSchema, emptyBodyStatus: 404, sample: "/api/v1/account/pass/orders/zz-sweep-no-such-pass-order" },
  { method: "GET", path: "/api/v1/account/pass/orders/{id}/invoice", summary: "A paid pass's GST tax invoice as a PDF (application/pdf) in the payer's language: the payer's own, the operator's any; anybody else's is not found", access: "signed-in", limitedRoles: c.ALL_LIMITED_ROLES, response: c.okSchema, emptyBodyStatus: 404, sample: "/api/v1/account/pass/orders/zz-sweep-no-such-pass-order/invoice" },
];
