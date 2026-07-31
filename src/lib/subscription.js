export const subscriptionStatusLabels = {
  trialing: "Período de teste",
  active: "Assinatura ativa",
  past_due: "Pagamento pendente",
  canceled: "Assinatura cancelada",
  expired: "Período encerrado",
};

export const subscriptionPlanLabels = {
  starter: "Starter",
  pro: "Pro",
  max: "Max",
};

function validDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

export function getSubscriptionAccess(subscription, now = new Date()) {
  if (!subscription) {
    return {
      canAccess: false,
      effectiveStatus: "missing",
      daysRemaining: 0,
      accessEndsAt: null,
    };
  }

  const trialEndsAt = validDate(subscription.trial_ends_at);
  const periodEndsAt = validDate(subscription.current_period_ends_at);
  const graceEndsAt = validDate(subscription.grace_period_ends_at);
  let accessEndsAt = null;
  let canAccess = false;

  if (subscription.status === "trialing") {
    accessEndsAt = trialEndsAt;
    canAccess = Boolean(trialEndsAt && trialEndsAt > now);
  } else if (subscription.status === "active") {
    accessEndsAt = periodEndsAt;
    canAccess = !periodEndsAt || periodEndsAt > now;
  } else if (subscription.status === "past_due") {
    accessEndsAt = graceEndsAt;
    canAccess = Boolean(graceEndsAt && graceEndsAt > now);
  }

  const millisecondsRemaining = accessEndsAt ? Math.max(0, accessEndsAt.getTime() - now.getTime()) : 0;

  return {
    canAccess,
    effectiveStatus: canAccess ? subscription.status : "expired",
    daysRemaining: accessEndsAt ? Math.ceil(millisecondsRemaining / 86_400_000) : null,
    accessEndsAt: accessEndsAt?.toISOString() || null,
  };
}
