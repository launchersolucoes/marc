import "server-only";

import Stripe from "stripe";
import { getBillingConfiguration } from "./config.js";

let stripeClient;

export function getStripe() {
  const { secretKey } = getBillingConfiguration();
  if (!secretKey) throw new Error("Stripe não está configurado.");
  stripeClient ||= new Stripe(secretKey, { appInfo: { name: "Marc", version: "1.0.0" } });
  return stripeClient;
}
