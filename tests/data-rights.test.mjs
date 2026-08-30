import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL("../supabase/migrations/20260829090000_data_rights_and_account_closure.sql", import.meta.url);
const operationsMigrationUrl = new URL("../supabase/migrations/20260830100000_platform_privacy_operations.sql", import.meta.url);
const hardenedOperationsMigrationUrl = new URL("../supabase/migrations/20260830113000_harden_platform_privacy_operations.sql", import.meta.url);

test("data exports are owner scoped and never expose portal token hashes", async () => {
  const [migration, route] = await Promise.all([
    readFile(migrationUrl, "utf8"),
    readFile(new URL("../src/app/api/account/export/route.js", import.meta.url), "utf8"),
  ]);
  assert.match(migration, /role = 'owner'/);
  assert.match(migration, /export_current_establishment_data/);
  assert.doesNotMatch(migration.slice(migration.indexOf("create function public.export_current_establishment_data"), migration.indexOf("create function public.get_customer_portal_export")), /token_hash/);
  assert.match(route, /membership\.role !== "owner"/);
  assert.match(route, /Cache-Control": "private, no-store"/);
});

test("customer portability requires a valid revocable portal token", async () => {
  const [migration, route] = await Promise.all([
    readFile(migrationUrl, "utf8"),
    readFile(new URL("../src/app/api/customer/[token]/export/route.js", import.meta.url), "utf8"),
  ]);
  assert.match(migration, /resolve_customer_portal_token\(raw_token\)/);
  assert.match(route, /\^\[a-f0-9\]\{64\}\$/);
  assert.match(route, /get_customer_portal_export/);
  assert.match(route, /Referrer-Policy": "no-referrer"/);
});

test("closure is owner-only, billing-safe and anonymizes personal contacts", async () => {
  const migration = await readFile(migrationUrl, "utf8");
  const closure = migration.slice(migration.indexOf("create function public.close_current_establishment"));
  assert.match(closure, /m\.role = 'owner'/);
  assert.match(closure, /provider_subscription_id is not null/);
  assert.match(closure, /phone = 'anon-'/);
  assert.match(closure, /customer_portal_tokens[\s\S]*revoked_at/);
  assert.match(closure, /establishment_memberships set status = 'suspended'/);
  assert.match(closure, /establishments[\s\S]*is_active = false/);
});

test("deletion requests are deduplicated and rate limited for customers", async () => {
  const migration = await readFile(migrationUrl, "utf8");
  assert.match(migration, /Deletion request already open/);
  assert.match(migration, /guard_customer_portal_mutation\(target_customer_id, 'privacy\.deletion_requested'\)/);
  assert.match(migration, /status in \('pending', 'in_review'\)/);
});

test("platform privacy operations are admin-only and keep decision history", async () => {
  const [migration, hardenedMigration] = await Promise.all([readFile(operationsMigrationUrl, "utf8"), readFile(hardenedOperationsMigrationUrl, "utf8")]);
  assert.match(migration, /if not public\.is_platform_admin\(\)/g);
  assert.match(migration, /create table public\.privacy_request_events/);
  assert.match(migration, /Decision notes are required/);
  assert.match(migration, /insert into public\.privacy_request_events/);
  assert.match(migration, /revoke all on function public\.admin_update_privacy_request/);
  assert.match(migration, /grant execute on function public\.admin_update_privacy_request\(uuid, text, text\) to authenticated/);
  assert.match(hardenedMigration, /request_scope text default 'open'/);
  assert.match(hardenedMigration, /limit normalized_limit offset normalized_offset/);
  assert.match(hardenedMigration, /'history', coalesce/);
  assert.match(hardenedMigration, /target_request\.status = desired_status/);
});
