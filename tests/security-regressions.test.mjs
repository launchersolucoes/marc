import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("latest user bootstrap never grants platform admin by email", async () => {
  const sql = await readFile("supabase/migrations/20260731200000_secure_platform_admin_bootstrap.sql", "utf8");
  assert.match(sql, /create or replace function public\.handle_new_user/);
  assert.doesNotMatch(sql, /insert into public\.platform_admins/);
  assert.match(sql, /Explicit allowlist/);
});

test("service management hardens the insert policy for authenticated professionals", async () => {
  const sql = await readFile("supabase/migrations/20260731203000_professional_service_management.sql", "utf8");
  assert.match(sql, /Professional profile required/);
  assert.match(sql, /professional\.user_id = \(select auth\.uid\(\)\)/);
  assert.match(sql, /alter policy "Members can create services"/);
  assert.doesNotMatch(sql, /drop policy/i);
});

test("public booking limits abuse and audit events exclude customer data", async () => {
  const sql = await readFile("supabase/migrations/20260803230000_public_abuse_audit_observability.sql", "utf8");

  assert.match(sql, /recent_booking_count >= 5/);
  assert.match(sql, /future_booking_count >= 10/);
  assert.match(sql, /waiting_count >= 5/);
  assert.match(sql, /existing_request_id is not null[\s\S]*return existing_request_id/i);
  assert.match(sql, /create table public\.operational_audit_events/);
  assert.match(sql, /revoke all on table public\.operational_audit_events from public, anon, authenticated/);
  assert.doesNotMatch(sql, /audit_metadata[\s\S]{0,120}(phone|email|full_name)/i);
});
