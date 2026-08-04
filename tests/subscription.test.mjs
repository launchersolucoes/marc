import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { getSubscriptionAccess } from "../src/lib/subscription.js";

test("new and active trials use the confirmed 14-day period", async () => {
  const migration = await readFile("supabase/migrations/20260804100000_extend_free_trial_to_14_days.sql", "utf8");

  assert.match(migration, /set default \(now\(\) \+ interval '14 days'\)/);
  assert.match(migration, /status = 'trialing'/);
  assert.match(migration, /trial_ends_at > now\(\)/);
  assert.match(migration, /trial_starts_at \+ interval '14 days'/);
  assert.match(migration, /'trial_extended'/);
});

const now = new Date("2026-07-31T12:00:00.000Z");

test("keeps an establishment active during its trial", () => {
  const access = getSubscriptionAccess({
    status: "trialing",
    trial_ends_at: "2026-08-03T12:00:00.000Z",
  }, now);

  assert.equal(access.canAccess, true);
  assert.equal(access.effectiveStatus, "trialing");
  assert.equal(access.daysRemaining, 3);
});

test("locks an expired trial without discarding its original status", () => {
  const access = getSubscriptionAccess({
    status: "trialing",
    trial_ends_at: "2026-07-31T11:59:59.000Z",
  }, now);

  assert.equal(access.canAccess, false);
  assert.equal(access.effectiveStatus, "expired");
  assert.equal(access.daysRemaining, 0);
});

test("allows an active subscription without a period end", () => {
  const access = getSubscriptionAccess({ status: "active" }, now);
  assert.equal(access.canAccess, true);
  assert.equal(access.daysRemaining, null);
});

test("uses the grace period for a pending payment", () => {
  const access = getSubscriptionAccess({
    status: "past_due",
    grace_period_ends_at: "2026-08-01T12:00:00.000Z",
  }, now);

  assert.equal(access.canAccess, true);
  assert.equal(access.daysRemaining, 1);
});

test("locks missing, canceled and overdue subscriptions", () => {
  assert.equal(getSubscriptionAccess(null, now).canAccess, false);
  assert.equal(getSubscriptionAccess({ status: "canceled" }, now).canAccess, false);
  assert.equal(getSubscriptionAccess({
    status: "past_due",
    grace_period_ends_at: "2026-07-31T11:00:00.000Z",
  }, now).canAccess, false);
});
