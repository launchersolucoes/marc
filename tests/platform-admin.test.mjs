import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSubscriptionCommand } from "../src/lib/platform-admin.js";

const establishmentId = "11111111-1111-4111-8111-111111111111";

test("normalizes a valid platform subscription command", () => {
  assert.deepEqual(
    normalizeSubscriptionCommand({ establishmentId, planCode: "pro", status: "active", accessDays: "30" }),
    { establishmentId, planCode: "pro", status: "active", accessDays: 30 },
  );
});

test("rejects unsupported plans, states and access periods", () => {
  assert.equal(normalizeSubscriptionCommand({ establishmentId, planCode: "enterprise", status: "active", accessDays: 30 }), null);
  assert.equal(normalizeSubscriptionCommand({ establishmentId, planCode: "pro", status: "paused", accessDays: 30 }), null);
  assert.equal(normalizeSubscriptionCommand({ establishmentId, planCode: "pro", status: "active", accessDays: 0 }), null);
  assert.equal(normalizeSubscriptionCommand({ establishmentId: "invalid", planCode: "pro", status: "active", accessDays: 30 }), null);
});
