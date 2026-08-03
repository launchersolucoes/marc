import { getPlanForPrice } from "./config.js";

const stripeStatusMap = {
  active: "active",
  trialing: "active",
  past_due: "past_due",
  unpaid: "past_due",
  incomplete: "past_due",
  paused: "past_due",
  canceled: "canceled",
  incomplete_expired: "canceled",
};

function toIsoTimestamp(value) {
  return Number.isFinite(value) ? new Date(value * 1000).toISOString() : null;
}

export function mapStripeSubscription(subscription, eventType, environment = process.env) {
  const item = subscription.items?.data?.[0];
  const customerId = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer?.id;

  return {
    providerEventType: eventType,
    providerSubscriptionId: subscription.id,
    providerCustomerId: customerId || null,
    establishmentId: subscription.metadata?.establishment_id || null,
    planCode: getPlanForPrice(item?.price?.id, environment),
    status: stripeStatusMap[subscription.status] || "past_due",
    currentPeriodStartsAt: toIsoTimestamp(item?.current_period_start ?? subscription.current_period_start),
    currentPeriodEndsAt: toIsoTimestamp(item?.current_period_end ?? subscription.current_period_end),
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
  };
}
