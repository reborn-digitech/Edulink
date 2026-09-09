/**
 * Every /api/v1 endpoint, as data — see ./api-catalog/types.ts for what an
 * entry says and why the list exists (the OpenAPI document, the API sweep and
 * the catalog test all read it). One file per area so several hands can add
 * endpoints without editing the same lines.
 */
export type { Endpoint, Access, SweepFixture } from "./api-catalog/types";
import { CORE } from "./api-catalog/core";
import { ADMIN } from "./api-catalog/admin";
import { STAFF } from "./api-catalog/staff";
import { FAMILY } from "./api-catalog/family";
import { SHARED } from "./api-catalog/shared";
import { OPERATOR } from "./api-catalog/operator";
import type { Endpoint } from "./api-catalog/types";

export const ENDPOINTS: Endpoint[] = [...CORE, ...ADMIN, ...STAFF, ...FAMILY, ...SHARED, ...OPERATOR];
