import Stripe from "stripe";
import { env } from "./env.js";

const stripeKey = env.stripeSecretKey || "sk_test_placeholder";

export const stripe = new Stripe(stripeKey, {
  apiVersion: "2024-06-20",
});
