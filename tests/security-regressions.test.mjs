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
