import "server-only";

import { redirect } from "next/navigation";
import { getSubscriptionAccess } from "./subscription";
import { createClient } from "./supabase/server";

export async function getActionContext({ allowRestricted = false } = {}) {
  const supabase = await createClient();
  const [{ data: authData }, { data: context, error: contextError }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.rpc("get_current_app_context"),
  ]);
  if (!authData.user) redirect("/entrar");
  if (contextError) throw contextError;
  if (!context?.membership) redirect("/onboarding");

  const subscriptionAccess = getSubscriptionAccess(context.subscription);
  if (!allowRestricted && !subscriptionAccess.canAccess) redirect("/app/assinatura?estado=bloqueado");

  return {
    supabase,
    user: authData.user,
    membership: context.membership,
    subscription: context.subscription,
    subscriptionAccess,
  };
}
