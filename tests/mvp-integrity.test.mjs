import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { isValidPhone, normalizePhone } from "../src/lib/phone.js";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("normalizes common Brazilian phone formats without losing local numbers", () => {
  assert.equal(normalizePhone("(11) 99999-1234"), "11999991234");
  assert.equal(normalizePhone("+55 (11) 99999-1234"), "11999991234");
  assert.equal(normalizePhone("9999-1234"), "99991234");
  assert.equal(isValidPhone("+55 (11) 99999-1234"), true);
  assert.equal(isValidPhone("123"), false);
});

test("customer identities are normalized and unique inside each establishment", async () => {
  const migration = await read("../supabase/migrations/20260801040000_mvp_integrity_hardening.sql");

  assert.match(migration, /create unique index[\s\S]*customers_establishment_phone_unique/i);
  assert.match(migration, /customers_normalize_identity/);
  assert.match(migration, /length\(new\.phone\) not between 8 and 15/i);
  assert.doesNotMatch(migration, /delete from public\.customers/i);
});

test("appointments reject stale or cross-establishment references", async () => {
  const [hardening, schema] = await Promise.all([
    read("../supabase/migrations/20260801040000_mvp_integrity_hardening.sql"),
    read("../supabase/migrations/20260729235500_initial_marc_schema.sql"),
  ]);

  assert.match(hardening, /new\.starts_at <= now\(\)/);
  assert.match(hardening, /customer\.establishment_id = new\.establishment_id/);
  assert.match(hardening, /service\.establishment_id = new\.establishment_id/);
  assert.match(hardening, /new\.price_cents := configured_price/);
  assert.match(schema, /exclude using gist[\s\S]*tstzrange[\s\S]*with &&/i);
});

test("appointment lifecycle remains serialized and only allows valid transitions", async () => {
  const lifecycle = await read("../supabase/migrations/20260730050000_appointment_lifecycle_and_finance.sql");

  assert.match(lifecycle, /where id = target_appointment_id\s+for update/i);
  assert.match(lifecycle, /status = 'pending'[\s\S]*target_status in \('confirmed', 'cancelled'\)/i);
  assert.match(lifecycle, /status = 'confirmed'[\s\S]*target_status in \('in_progress', 'cancelled', 'no_show'\)/i);
  assert.match(lifecycle, /on conflict \(appointment_id\) do nothing/i);
});

test("manual expense corrections are auditable and never rewrite appointment income", async () => {
  const corrections = await read("../supabase/migrations/20260818140000_financial_entry_corrections.sql");

  assert.match(corrections, /create table if not exists public\.financial_entry_events/i);
  assert.match(corrections, /event_type in \('updated', 'voided'\)/i);
  assert.match(corrections, /entry_record\.type <> 'expense' or entry_record\.appointment_id is not null/i);
  assert.match(corrections, /drop policy if exists "Managers can create financial entries"/i);
  assert.match(corrections, /revoke insert on table public\.financial_entries from authenticated/i);
  assert.match(corrections, /for update/i);
  assert.match(corrections, /voided_at = now\(\)/i);
  assert.doesNotMatch(corrections, /delete from public\.financial_entries/i);
});

test("daily financial closings snapshot every payment method and require an audit reason to reopen", async () => {
  const closing = await read("../supabase/migrations/20260818150000_financial_day_closing.sql");

  assert.match(closing, /unique \(establishment_id, business_date\)/i);
  assert.match(closing, /payment_method = 'cash'/i);
  assert.match(closing, /payment_method = 'pix'/i);
  assert.match(closing, /payment_method = 'credit_card'/i);
  assert.match(closing, /payment_method = 'debit_card'/i);
  assert.match(closing, /difference_totals/i);
  assert.match(closing, /event_type in \('closed', 'reopened'\)/i);
  assert.match(closing, /length\(trim\(reason\)\) not between 3 and 240/i);
  assert.doesNotMatch(closing, /delete from public\.financial_day_closings/i);
});

test("role helpers keep operators and professionals in their intended scopes", async () => {
  const access = await read("../supabase/migrations/20260730001500_auth_onboarding_and_access.sql");

  assert.match(access, /can_operate_establishment[\s\S]*in \('owner', 'manager', 'receptionist'\)/i);
  assert.match(access, /can_manage_establishment[\s\S]*in \('owner', 'manager'\)/i);
  assert.match(access, /owns_professional[\s\S]*user_id = \(select auth\.uid\(\)\)/i);
});
