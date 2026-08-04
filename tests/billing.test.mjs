import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  getBillingConfiguration,
  getConfiguredBillingPlans,
  getPlanForPrice,
  getPriceForPlan,
} from "../src/lib/billing/config.js";
import { isTrustedBillingRequest } from "../src/lib/billing/request.js";
import { mapStripeSubscription } from "../src/lib/billing/webhook.js";
import { commercialPlans } from "../src/lib/subscription.js";

const environment = {
  STRIPE_SECRET_KEY: "sk_test_example",
  STRIPE_WEBHOOK_SECRET: "whsec_example",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-example",
  STRIPE_PRICE_STARTER: "price_starter",
  STRIPE_PRICE_PRO: "price_pro",
  STRIPE_PRICE_MAX: "not_configured",
};

test("commercial catalog keeps the confirmed monthly prices", () => {
  assert.deepEqual(commercialPlans, {
    starter: { monthlyPriceCents: 2990, monthlyPriceLabel: "R$ 29,90" },
    pro: { monthlyPriceCents: 4990, monthlyPriceLabel: "R$ 49,90" },
    max: { monthlyPriceCents: 9990, monthlyPriceLabel: "R$ 99,90" },
  });
});

test("billing only exposes plans backed by valid Stripe price ids", () => {
  assert.deepEqual(getConfiguredBillingPlans(environment), [
    { planCode: "starter", priceId: "price_starter" },
    { planCode: "pro", priceId: "price_pro" },
  ]);
  assert.equal(getPriceForPlan("pro", environment), "price_pro");
  assert.equal(getPlanForPrice("price_starter", environment), "starter");
  assert.equal(getPriceForPlan("max", environment), null);
});

test("checkout and webhook readiness are independently explicit", () => {
  const ready = getBillingConfiguration(environment);
  assert.equal(ready.isCheckoutEnabled, true);
  assert.equal(ready.isWebhookEnabled, true);

  const withoutWebhook = getBillingConfiguration({
    STRIPE_SECRET_KEY: "sk_test_example",
    STRIPE_PRICE_STARTER: "price_starter",
  });
  assert.equal(withoutWebhook.isCheckoutEnabled, true);
  assert.equal(withoutWebhook.isWebhookEnabled, false);
});

test("Stripe subscriptions map to Marc status, plan and item billing period", () => {
  const mapped = mapStripeSubscription({
    id: "sub_123",
    customer: "cus_123",
    status: "active",
    cancel_at_period_end: false,
    metadata: { establishment_id: "00000000-0000-0000-0000-000000000001" },
    items: { data: [{
      price: { id: "price_pro" },
      current_period_start: 1_786_000_000,
      current_period_end: 1_788_592_000,
    }] },
  }, "customer.subscription.updated", environment);

  assert.equal(mapped.status, "active");
  assert.equal(mapped.planCode, "pro");
  assert.equal(mapped.providerCustomerId, "cus_123");
  assert.match(mapped.currentPeriodStartsAt, /^2026-/);
  assert.match(mapped.currentPeriodEndsAt, /^2026-/);
});

test("unsafe subscription states never become active", () => {
  for (const status of ["past_due", "unpaid", "incomplete", "paused", "unknown_status"]) {
    const mapped = mapStripeSubscription({
      id: "sub_123",
      customer: { id: "cus_123" },
      status,
      items: { data: [] },
      metadata: {},
    }, "customer.subscription.updated", environment);
    assert.equal(mapped.status, "past_due");
  }
});

test("billing mutations require a same-origin browser request", () => {
  assert.equal(isTrustedBillingRequest(new Request("https://marc.example/api/billing/checkout", {
    method: "POST",
    headers: { origin: "https://marc.example" },
  })), true);
  assert.equal(isTrustedBillingRequest(new Request("https://marc.example/api/billing/checkout", {
    method: "POST",
    headers: { origin: "https://attacker.example" },
  })), false);
  assert.equal(isTrustedBillingRequest(new Request("https://marc.example/api/billing/checkout", {
    method: "POST",
  })), false);
});

test("webhook keeps the raw body and the database application is idempotent", async () => {
  const [route, migration] = await Promise.all([
    readFile("src/app/api/billing/webhook/route.js", "utf8"),
    readFile("supabase/migrations/20260803200000_stripe_billing_foundation.sql", "utf8"),
  ]);

  assert.match(route, /await request\.text\(\)/);
  assert.match(route, /webhooks\.constructEvent\(rawBody, signature/);
  assert.doesNotMatch(route, /request\.json\(\)/);
  assert.match(migration, /subscription_events_provider_event_idx/);
  assert.match(migration, /already_processed/);
  assert.match(migration, /grant execute[\s\S]+to service_role/);
  assert.match(migration, /revoke all[\s\S]+from public, anon, authenticated/);
});
