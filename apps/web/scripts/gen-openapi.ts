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

const OUT = resolve(process.cwd(), "../../docs/api/openapi.json");

function describeAccess(e: Endpoint): string {
  if (e.access === "anyone") return "No session needed.";
  if (e.access === "signed-in") return "Any signed-in session.";
  return `Roles: ${e.access.join(", ")}.`;
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
      responses: {
        "200": { description: "OK", content: { "application/json": { schema: zodToJsonSchema(e.response, { target: "openApi3" }) } } },
        "401": { description: "No or invalid session", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
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
    info: { title: "EduLink API", version: "1", description: "The phone's door into the same library the web app uses. Bearer sessions; JSON in and out; bodies validated with the schemas in packages/contracts." },
    servers: [{ url: "https://app.example", description: "production" }, { url: "http://localhost:3000", description: "local" }],
    components: {
      securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
      schemas: {
        ApiError: {
          type: "object",
          required: ["error"],
          properties: {
            error: { type: "string" },
            code: { type: "string", enum: ["BAD_REQUEST", "UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "CONFLICT", "RATE_LIMITED", "SERVER"] },
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
