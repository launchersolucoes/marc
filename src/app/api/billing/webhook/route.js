import { getBillingConfiguration } from "../../../../lib/billing/config";
import { getStripe } from "../../../../lib/billing/stripe";
import { mapStripeSubscription } from "../../../../lib/billing/webhook";
import { createAdminClient } from "../../../../lib/supabase/admin";

export const runtime = "nodejs";

const supportedEvents = new Set([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

export async function POST(request) {
  const configuration = getBillingConfiguration();
  if (!configuration.isWebhookEnabled) return new Response("Webhook não configurado.", { status: 503 });

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Assinatura ausente.", { status: 400 });

  let event;
  try {
    const rawBody = await request.text();
    event = getStripe().webhooks.constructEvent(rawBody, signature, configuration.webhookSecret);
  } catch (error) {
    console.warn("billing_webhook_signature_failed", { message: error.message });
    return new Response("Assinatura inválida.", { status: 400 });
  }

  if (!supportedEvents.has(event.type)) return Response.json({ received: true, handled: false });

  const mapped = mapStripeSubscription(event.data.object, event.type);
  const { error } = await createAdminClient().rpc("apply_stripe_subscription_event", {
    target_provider_event_id: event.id,
    target_provider_event_type: mapped.providerEventType,
    target_provider_subscription_id: mapped.providerSubscriptionId,
    target_provider_customer_id: mapped.providerCustomerId,
    target_establishment_id: mapped.establishmentId,
    target_plan_code: mapped.planCode,
    target_status: mapped.status,
    target_current_period_starts_at: mapped.currentPeriodStartsAt,
    target_current_period_ends_at: mapped.currentPeriodEndsAt,
    target_cancel_at_period_end: mapped.cancelAtPeriodEnd,
    target_payload: {
      livemode: event.livemode,
      stripe_status: event.data.object.status,
    },
  });

  if (error) {
    console.error("billing_webhook_apply_failed", { eventId: event.id, message: error.message });
    return new Response("Falha ao aplicar evento.", { status: 500 });
  }

  return Response.json({ received: true, handled: true });
}
