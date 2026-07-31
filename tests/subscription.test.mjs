import assert from "node:assert/strict";
import test from "node:test";
import { getSubscriptionAccess } from "../src/lib/subscription.js";

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
