import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migrationPath = new URL("../supabase/migrations/20260824210000_customer_portal.sql", import.meta.url);
const controlsMigrationPath = new URL("../supabase/migrations/20260825010000_customer_portal_access_controls.sql", import.meta.url);

test("portal stores only a SHA-256 token hash and rotates previous access", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /token_hash text not null unique/);
  assert.match(sql, /extensions\.gen_random_bytes\(32\)/);
  assert.match(sql, /extensions\.digest\(raw_token, 'sha256'\)/);
  assert.match(sql, /set revoked_at = now\(\)[\s\S]*revoked_at is null/);
  assert.doesNotMatch(sql, /create table public\.customer_portal_tokens[\s\S]{0,260}\btoken text\b/i);
});

test("portal tables stay private and every public mutation scopes records to the token customer", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /alter table public\.customer_portal_tokens enable row level security/);
  assert.match(sql, /revoke all on table public\.customer_portal_tokens from public, anon, authenticated/);
  assert.match(sql, /where id = target_appointment_id[\s\S]*customer_id = target_customer_id/g);
  assert.match(sql, /where id = target_waitlist_id[\s\S]*customer_id = target_customer_id/);
  assert.match(sql, /status not in \('pending', 'confirmed'\)/);
  assert.match(sql, /waitlist_record\.status <> 'waiting'/);
});

test("portal actions are audited without adding customer contact data", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /'source', 'customer_portal'/g);
  assert.match(sql, /customer\.profile_updated/);
  assert.match(sql, /customer\.portal_link_rotated/);
  assert.doesNotMatch(sql, /jsonb_build_object\([^)]*(customer_phone|customer_email|customer_name)/i);
});

test("public booking returns a portal link and the route remains noindex", async () => {
  const [flow, page] = await Promise.all([
    readFile(new URL("../src/components/public-booking-flow.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/cliente/[token]/page.jsx", import.meta.url), "utf8"),
  ]);

  assert.match(flow, /create_public_appointment_with_portal/);
  assert.match(flow, /create_public_waitlist_with_portal/);
  assert.match(flow, /Ver e gerenciar meus horários/);
  assert.match(page, /index: false/);
  assert.match(page, /referrer: "no-referrer"/);
  assert.match(page, /\^\[a-f0-9\]\{64\}\$/);
});

test("portal mutations are rate limited in a private server-side ledger", async () => {
  const sql = await readFile(controlsMigrationPath, "utf8");

  assert.match(sql, /create table public\.customer_portal_mutation_events/);
  assert.match(sql, /enable row level security/);
  assert.match(sql, /revoke all on table public\.customer_portal_mutation_events from public, anon, authenticated/);
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /recent_count >= 12 or daily_count >= 40/);
  assert.match(sql, /Portal rate limit exceeded/);
  assert.match(sql, /guard_customer_portal_mutation\(raw_token, 'appointment_cancel'\)/);
  assert.match(sql, /guard_customer_portal_mutation\(raw_token, 'profile_update'\)/);
});

test("staff can inspect and explicitly revoke active portal access", async () => {
  const [sql, component, actions] = await Promise.all([
    readFile(controlsMigrationPath, "utf8"),
    readFile(new URL("../src/components/customer-portal-link.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/app/clientes/actions.js", import.meta.url), "utf8"),
  ]);

  assert.match(sql, /create function public\.get_customer_portal_access_status/);
  assert.match(sql, /create function public\.revoke_customer_portal_access/);
  assert.match(sql, /membership\.role in \('owner', 'manager', 'receptionist'\)/);
  assert.match(sql, /customer\.portal_access_revoked/);
  assert.match(component, /Revogar acesso/);
  assert.match(component, /Revogar agora/);
  assert.match(actions, /revoke_customer_portal_access/);
});

test("booking again carries only the previous offering identifier", async () => {
  const [portal, flow, page] = await Promise.all([
    readFile(new URL("../src/components/customer-portal.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/public-booking-flow.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/agendar/[slug]/page.jsx", import.meta.url), "utf8"),
  ]);

  assert.match(portal, /\?oferta=\$\{encodeURIComponent\(repeatAppointment\.professional_service_id\)\}/);
  assert.match(flow, /initialOfferingId/);
  assert.match(flow, /requestedOffering\?\.service_id/);
  assert.match(page, /requestedOfferingId/);
  assert.doesNotMatch(portal, /\?(nome|telefone|email)=/i);
});
