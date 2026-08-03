const priceEnvironmentKeys = {
  starter: "STRIPE_PRICE_STARTER",
  pro: "STRIPE_PRICE_PRO",
  max: "STRIPE_PRICE_MAX",
};

export function getConfiguredBillingPlans(environment = process.env) {
  return Object.entries(priceEnvironmentKeys)
    .map(([planCode, environmentKey]) => ({
      planCode,
      priceId: environment[environmentKey]?.trim() || "",
    }))
    .filter(({ priceId }) => priceId.startsWith("price_"));
}

export function getBillingConfiguration(environment = process.env) {
  const plans = getConfiguredBillingPlans(environment);

  return {
    plans,
    secretKey: environment.STRIPE_SECRET_KEY?.trim() || "",
    webhookSecret: environment.STRIPE_WEBHOOK_SECRET?.trim() || "",
    serviceRoleKey: environment.SUPABASE_SERVICE_ROLE_KEY?.trim() || "",
    isCheckoutEnabled: Boolean(environment.STRIPE_SECRET_KEY?.trim() && plans.length),
    isWebhookEnabled: Boolean(
      environment.STRIPE_SECRET_KEY?.trim()
      && environment.STRIPE_WEBHOOK_SECRET?.trim()
      && environment.SUPABASE_SERVICE_ROLE_KEY?.trim(),
    ),
  };
}

export function getPlanForPrice(priceId, environment = process.env) {
  return getConfiguredBillingPlans(environment).find((plan) => plan.priceId === priceId)?.planCode || null;
}

export function getPriceForPlan(planCode, environment = process.env) {
  return getConfiguredBillingPlans(environment).find((plan) => plan.planCode === planCode)?.priceId || null;
}
