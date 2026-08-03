import { getAppContext } from "../../../../lib/app-context";
import { getBillingConfiguration, getPriceForPlan } from "../../../../lib/billing/config";
import { billingRedirect, isTrustedBillingRequest } from "../../../../lib/billing/request";
import { getStripe } from "../../../../lib/billing/stripe";

export const runtime = "nodejs";

export async function POST(request) {
  if (!isTrustedBillingRequest(request)) return new Response("Origem inválida.", { status: 403 });

  const { plans, isCheckoutEnabled, isWebhookEnabled } = getBillingConfiguration();
  if (!isCheckoutEnabled || !isWebhookEnabled) return billingRedirect(request, "cobranca", "indisponivel");

  const { supabase, user, membership, establishment } = await getAppContext({ allowRestricted: true });
  if (!["owner", "manager"].includes(membership.role)) return new Response("Acesso negado.", { status: 403 });

  const formData = await request.formData();
  const planCode = String(formData.get("plan") || "");
  const priceId = getPriceForPlan(planCode);
  if (!priceId || !plans.some((plan) => plan.planCode === planCode)) {
    return billingRedirect(request, "cobranca", "plano-invalido");
  }

  const { data: subscription, error: subscriptionError } = await supabase
    .from("establishment_subscriptions")
    .select("id, provider_customer_id, provider_subscription_id")
    .eq("establishment_id", establishment.id)
    .single();

  if (subscriptionError || !subscription) return billingRedirect(request, "cobranca", "erro");
  if (subscription.provider_subscription_id) return billingRedirect(request, "cobranca", "ja-assinante");

  try {
    const stripe = getStripe();
    let customerId = subscription.provider_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: establishment.name,
        metadata: { establishment_id: establishment.id, subscription_id: subscription.id },
      }, { idempotencyKey: `marc-customer-${subscription.id}` });
      customerId = customer.id;

      const { data: linkedCustomerId, error: linkError } = await supabase.rpc("set_subscription_billing_customer", {
        target_establishment_id: establishment.id,
        target_provider_customer_id: customerId,
      });
      if (linkError) throw linkError;
      customerId = linkedCustomerId;
    }

    const returnUrl = new URL("/app/assinatura", request.url);
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: establishment.id,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${returnUrl.toString()}?cobranca=sucesso`,
      cancel_url: `${returnUrl.toString()}?cobranca=cancelada`,
      metadata: { establishment_id: establishment.id, plan_code: planCode },
      subscription_data: { metadata: { establishment_id: establishment.id, plan_code: planCode } },
    });

    if (!checkout.url) throw new Error("Checkout sem URL de redirecionamento.");
    return Response.redirect(checkout.url, 303);
  } catch (error) {
    console.error("billing_checkout_failed", { establishmentId: establishment.id, message: error.message });
    return billingRedirect(request, "cobranca", "erro");
  }
}
