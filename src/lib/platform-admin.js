export const platformSubscriptionPlans = ["starter", "pro", "max"];
export const platformSubscriptionStatuses = ["trialing", "active", "past_due", "canceled", "expired"];

export function normalizeSubscriptionCommand({ establishmentId, planCode, status, accessDays }) {
  const days = Number(accessDays);
  if (!/^[0-9a-f-]{36}$/i.test(String(establishmentId || ""))) return null;
  if (!platformSubscriptionPlans.includes(planCode)) return null;
  if (!platformSubscriptionStatuses.includes(status)) return null;
  if (!Number.isInteger(days) || days < 1 || days > 365) return null;

  return { establishmentId, planCode, status, accessDays: days };
}
