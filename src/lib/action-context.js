import "server-only";

import { redirect } from "next/navigation";
import { getSubscriptionAccess } from "./subscription";
import { createClient } from "./supabase/server";

export async function getActionContext({ allowRestricted = false } = {}) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/entrar");

  const { data: membership } = await supabase
    .from("establishment_memberships")
    .select("establishment_id, role")
    .eq("user_id", authData.user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!membership) redirect("/onboarding");

  const { data: subscription } = await supabase
    .from("establishment_subscriptions")
    .select("id, plan_code, status, trial_starts_at, trial_ends_at, current_period_starts_at, current_period_ends_at, grace_period_ends_at, cancel_at_period_end")
    .eq("establishment_id", membership.establishment_id)
    .maybeSingle();

  const subscriptionAccess = getSubscriptionAccess(subscription);
  if (!allowRestricted && !subscriptionAccess.canAccess) redirect("/app/assinatura?estado=bloqueado");

  return {
    supabase,
    user: authData.user,
    membership,
    subscription,
    subscriptionAccess,
  };
}
