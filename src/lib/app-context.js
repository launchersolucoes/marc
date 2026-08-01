import "server-only";

import { redirect } from "next/navigation";
import { getSubscriptionAccess } from "./subscription";
import { createClient } from "./supabase/server";

export async function getAppContext({ allowRestricted = false } = {}) {
  const supabase = await createClient();
  const [{ data: authData }, { data: context, error: contextError }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.rpc("get_current_app_context"),
  ]);
  if (!authData.user) redirect("/entrar");
  if (contextError) throw contextError;
  if (!context?.establishment) redirect("/onboarding");

  const subscriptionAccess = getSubscriptionAccess(context.subscription);
  if (!allowRestricted && !subscriptionAccess.canAccess) redirect("/app/assinatura?estado=bloqueado");
  const membership = {
    ...context.membership,
    establishment: context.establishment,
    subscription: context.subscription,
    subscriptionAccess,
  };

  return {
    supabase,
    user: authData.user,
    membership,
    establishment: context.establishment,
    professional: context.professional,
    subscription: context.subscription,
    subscriptionAccess,
  };
}
