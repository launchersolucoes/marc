import { getAppContext } from "../../../../lib/app-context";
import { getBillingConfiguration } from "../../../../lib/billing/config";
import { billingRedirect, isTrustedBillingRequest } from "../../../../lib/billing/request";
import { getStripe } from "../../../../lib/billing/stripe";

export const runtime = "nodejs";

export async function POST(request) {
  if (!isTrustedBillingRequest(request)) return new Response("Origem inválida.", { status: 403 });
  if (!getBillingConfiguration().isCheckoutEnabled) return billingRedirect(request, "cobranca", "indisponivel");

  const { supabase, membership, establishment } = await getAppContext({ allowRestricted: true });
  if (!["owner", "manager"].includes(membership.role)) return new Response("Acesso negado.", { status: 403 });

  const { data: subscription, error } = await supabase
    .from("establishment_subscriptions")
    .select("provider_customer_id")
    .eq("establishment_id", establishment.id)
    .single();
  if (error || !subscription?.provider_customer_id) return billingRedirect(request, "cobranca", "sem-cliente");

  try {
    const portal = await getStripe().billingPortal.sessions.create({
      customer: subscription.provider_customer_id,
      return_url: new URL("/app/assinatura", request.url).toString(),
    });
    return Response.redirect(portal.url, 303);
  } catch (portalError) {
    console.error("billing_portal_failed", { establishmentId: establishment.id, message: portalError.message });
    return billingRedirect(request, "cobranca", "erro");
  }
}
