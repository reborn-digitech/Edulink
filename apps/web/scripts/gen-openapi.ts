/**
 * The OpenAPI document, generated from the endpoint catalog.
 *
 *   npm run api:docs            writes docs/api/openapi.json at the repo root
 *   npm run api:docs -- --check exits 1 if the committed file is stale
 *
 * The catalog (src/lib/api-catalog.ts) is the truth; this is a view of it,
 * committed so a pull request that changes an endpoint shows the diff. The
 * check runs in CI.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ENDPOINTS, type Endpoint } from "../src/lib/api-catalog";
import { COLLEGE_DOORS } from "./college-doors";
import { isAdminDuty, PERSON_PLANS, PLAN_FEATURES } from "@edulink/contracts";
import { featuresOf } from "../src/lib/api-catalog/types";

/** The plans a door's feature may ask for (16 Oct 2026): a door of such a feature may answer 402 PLAN_REQUIRED, unless planFree or left to its handler. */
function plansOf(e: Endpoint): string[] {
  if (e.planFree || e.featureInHandler) return [];
  const features = featuresOf(e);
  return PERSON_PLANS.filter((p) => PLAN_FEATURES[p].some((f) => features.includes(f)));
}

const OUT = resolve(process.cwd(), "../../docs/api/openapi.json");


/** What a door's duties ask, in words (owner-batch-item9: an office duty binds an ADMIN, a college duty a FACULTY or HOD). */
function dutyWords(duties: readonly string[]): string {
  const college = duties.filter((d) => !isAdminDuty(d));
  const office = duties.filter((d) => isAdminDuty(d));
  return `${college.length ? ` A FACULTY or HOD only holding ${college.join(" or ")}.` : ""}${office.length ? ` An ADMIN only holding ${office.join(" or ")}, which the PRINCIPAL gives (every admin holds it while the school has no PRINCIPAL).` : ""}`;
}

function describeAccess(e: Endpoint): string {
  if (e.access === "anyone") return "No session needed.";
  if (e.access === "signed-in") return e.limitedRoles?.length ? `Any signed-in session but a limited role's; of those, ${e.limitedRoles.join(", ")}.` : "Any signed-in session but a limited role's (the module roles DRIVER, LIBRARIAN, WARDEN, ALUMNUS; the college's FACULTY, HOD, EXAM_CONTROLLER, IQAC, TPO, ACCOUNTS; RECRUITER; and SUPPORT, the support staff).";
  if (e.access === "account") return "Decided by the person's memberships, not the session's role; the handler answers 403 otherwise.";
  if (e.access === "operator") return "The server operator.";
  if (e.access === "app-admin") return "The content team.";
  return `Roles: ${e.access.join(", ")}.${dutyWords(e.duties ?? [])}${e.module ? ` Only while the school has ${e.module} switched on.` : ""}${e.kinds ? ` Only at an institution of kind ${e.kinds.join(" or ")}; elsewhere 404.` : ""}`;
}

function build() {
  const paths: Record<string, Record<string, unknown>> = {};
  for (const e of ENDPOINTS) {
    const op: Record<string, unknown> = {
      summary: e.summary,
      description: describeAccess(e),
      security: e.access === "anyone" ? [] : [{ bearer: [] }],
      // The catalog's access list as data, so the phone's contract suite can
      // predict every role's status for every endpoint the app calls.
      "x-access": e.access,
      // The module roles a signed-in door also opens to, and the module a door belongs to (403 MODULE_OFF while the school has it off).
      ...(e.limitedRoles?.length ? { "x-limited-roles": e.limitedRoles } : {}),
      ...(e.module ? { "x-module": e.module } : {}),
      // The kinds of institution the door is for (owner-batch-item5): at any other kind the gate answers 404 NOT_FOUND.
      ...(e.kinds ? { "x-kinds": [...e.kinds] } : {}),
      ...(e.feature ? { "x-feature": typeof e.feature === "string" ? e.feature : [...e.feature] } : {}),
      ...(e.featureInHandler ? { "x-feature-note": e.featureInHandler } : {}),
      // The plans the door's feature may ask for (402 PLAN_REQUIRED while on and not held), or why a plan is not asked (16 Oct 2026).
      ...(plansOf(e).length ? { "x-plans": plansOf(e) } : {}),
      ...(e.planFree ? { "x-plan-free": e.planFree } : {}),
      // The duties a FACULTY or HOD must hold to pass (5 Oct 2026); the phone's contract matrix reads it with the actor's /me duties.
      ...(e.duties?.length ? { "x-duties": e.duties } : {}),
      // A college's door (filed in a college module's catalog file): at a school it may answer 403 MODULE_OFF, module or none (LOAD-6).
      ...(COLLEGE_DOORS.has(e) ? { "x-college": true } : {}),
      responses: {
        "200": { description: "OK", content: { "application/json": { schema: zodToJsonSchema(e.response, { target: "openApi3" }) } } },
        "401": { description: "No or invalid session", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        ...(plansOf(e).length ? { "402": { description: "PLAN_REQUIRED: the feature is on and this person's role needs a plan they do not hold; `plan` names it", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } } } : {}),
        "403": { description: "This role may not", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        "404": { description: "Not found, or not yours", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        "422": { description: "Invalid body", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
      },
    };
    if (e.request) op.requestBody = { required: true, content: { "application/json": { schema: zodToJsonSchema(e.request, { target: "openApi3" }) } } };
    const params = [...e.path.matchAll(/\{(\w+)\}/g)].map((m) => ({ name: m[1], in: "path", required: true, schema: { type: "string" } }));
    if (params.length) op.parameters = params;
    (paths[e.path] ??= {})[e.method.toLowerCase()] = op;
  }
  return {
    openapi: "3.0.3",
    info: { title: "EduLink API", version: "1", description: "The phone's door into the same library the web app uses. Bearer sessions; JSON in and out; bodies validated with the schemas in packages/contracts. Page-only by design, with no door: /suspended and /switch (web screens about the session itself; the phone reads the same facts from GET /api/v1/me and its own sign-in answer) and MODULE_META (the web's module names and descriptions, compiled into the web app; the phone keeps its own and reads which modules are on from GET /api/v1/me). Writes kept on the web by design, with no door: merging two accounts and deleting a school (irreversible acts across accounts or tenants that need the web's confirmation screens), the operator's removal of schools and moderation inside a school (the operator console's, not a school phone's), and a pupil's first-sign-in code (printed on paper at the office)." },
    servers: [{ url: "https://app.example", description: "production" }, { url: "http://localhost:3000", description: "local" }],
    components: {
      securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
      schemas: {
        ApiError: {
          type: "object",
          required: ["error"],
          properties: {
            error: { type: "string" },
            code: { type: "string", enum: ["BAD_REQUEST", "UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "CONFLICT", "RATE_LIMITED", "SERVER", "MODULE_OFF", "FEATURE_OFF", "PLAN_REQUIRED"] },
            plan: { type: "string", enum: [...PERSON_PLANS], description: "With PLAN_REQUIRED: the plan that opens the door" },
            issues: { type: "object", additionalProperties: { type: "string" } },
            retryAfterSeconds: { type: "integer" },
          },
        },
      },
    },
    paths,
  };
}

const document = JSON.stringify(build(), null, 2) + "\n";
if (process.argv.includes("--check")) {
  let current = "";
  try {
    current = readFileSync(OUT, "utf8");
  } catch {
    /* missing counts as stale */
  }
  if (current !== document) {
    console.error("docs/api/openapi.json is stale — run npm run api:docs and commit it.");
    process.exit(1);
  }
  console.log(`docs/api/openapi.json is current (${ENDPOINTS.length} endpoints).`);
} else {
  mkdirSync(resolve(OUT, ".."), { recursive: true });
  writeFileSync(OUT, document);
  console.log(`wrote ${OUT} (${ENDPOINTS.length} endpoints).`);
}
