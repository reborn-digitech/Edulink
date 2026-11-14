/**
 * How a door's request schema is published in the OpenAPI document (TA-579). A GET door's handler reads its request
 * from the query string, so its schema is published as one `in: query` parameter per key, required where the schema
 * requires it; every other method (POST, PUT, PATCH, and DELETE, whose doors name what they remove in the body) keeps
 * it as the JSON request body. Its own module so a suite can read it without running gen-openapi.ts, which writes.
 */
import { zodToJsonSchema } from "zod-to-json-schema";
import type { Endpoint } from "../src/lib/api-catalog/types";

type JsonSchema = { type?: string; properties?: Record<string, unknown>; required?: string[] };

/** Whether the door's request travels in the query string rather than a body. */
export function requestInQuery(method: string): boolean {
  return method === "GET";
}

/** The door's inputs: path parameters, query parameters for a GET, and a request body for the rest. */
export function operationInputs(e: Pick<Endpoint, "method" | "path" | "request">): { parameters?: Record<string, unknown>[]; requestBody?: Record<string, unknown> } {
  const parameters: Record<string, unknown>[] = [...e.path.matchAll(/\{(\w+)\}/g)].map((m) => ({ name: m[1], in: "path", required: true, schema: { type: "string" } }));
  let requestBody: Record<string, unknown> | undefined;
  if (e.request) {
    const schema = zodToJsonSchema(e.request, { target: "openApi3" }) as unknown as JsonSchema;
    if (requestInQuery(e.method)) {
      if (schema.properties) {
        const required = new Set(schema.required ?? []);
        for (const [name, property] of Object.entries(schema.properties)) parameters.push({ name, in: "query", required: required.has(name), schema: property });
      } else {
        // A schema that is not one plain object (a union, say): the whole query string as one object, key by key.
        parameters.push({ name: "query", in: "query", required: false, style: "form", explode: true, schema });
      }
    } else {
      requestBody = { required: true, content: { "application/json": { schema } } };
    }
  }
  return { ...(parameters.length ? { parameters } : {}), ...(requestBody ? { requestBody } : {}) };
}
