import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync("supabase/migrations/20260824230000_configurable_booking_rules.sql", "utf8");
const settings = readFileSync("src/components/settings-forms.jsx", "utf8");
const services = readFileSync("src/components/service-form.jsx", "utf8");
const publicFlow = readFileSync("src/components/public-booking-flow.jsx", "utf8");
const portal = readFileSync("src/components/customer-portal.jsx", "utf8");

test("booking rules have safe defaults and server-side bounds", () => {
  assert.match(migration, /min_booking_notice_minutes integer not null default 120/i);
  assert.match(migration, /max_booking_days integer not null default 60/i);
  assert.match(migration, /cancellation_notice_minutes integer not null default 120/i);
  assert.match(migration, /booking_confirmation_mode text not null default 'automatic'/i);
  assert.match(migration, /member_role not in \('owner', 'manager'\)/i);
});

test("buffers are enforced in the database, not only hidden in the UI", () => {
  assert.match(migration, /appointments_enforce_schedule_rules/i);
  assert.match(migration, /pg_advisory_xact_lock/i);
  assert.match(migration, /occupied\.buffer_before_minutes/i);
  assert.match(migration, /occupied\.buffer_after_minutes/i);
  assert.match(services, /name="bufferBefore"/i);
  assert.match(services, /name="bufferAfter"/i);
});

test("public booking respects notice, window and confirmation policy", () => {
  assert.match(migration, /slot_start_utc >= now\(\) \+ make_interval\(mins => minimum_notice\)/i);
  assert.match(migration, /booking_confirmation_mode = 'manual'/i);
  assert.match(publicFlow, /appointment_status/i);
  assert.match(publicFlow, /Solicitar meu horário/i);
  assert.match(settings, /Antecedência para reservar/i);
});

test("customer self-service closes at the configured deadline", () => {
  assert.match(migration, /Cancellation window closed/g);
  assert.match(portal, /prazo para cancelar online terminou/i);
  assert.match(portal, /cancellation_notice_minutes/i);
});
