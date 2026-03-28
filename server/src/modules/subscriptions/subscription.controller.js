import { stripe } from "../../config/stripe.js";
import { env } from "../../config/env.js";
import { asyncHandler, HttpError } from "../../utils/http.js";
import {
  cancelLatestSubscription,
  createCheckoutSession,
  getLatestSubscription,
  processStripeWebhookEvent,
} from "./subscription.service.js";

function validatePlan(plan) {
  if (plan !== "monthly" && plan !== "yearly") {
    throw new HttpError(400, "Plan must be monthly or yearly");
  }
}

export const getSubscriptionStatus = asyncHandler(async (req, res) => {
  const subscription = await getLatestSubscription(req.auth.profile.id);

  res.status(200).json({
    ok: true,
    data: {
      subscription,
      hasAccess: subscription
        ? ["active", "trialing"].includes(subscription.status)
        : false,
    },
  });
});

export const createSubscriptionCheckout = asyncHandler(async (req, res) => {
  const plan = String(req.body?.plan ?? "").toLowerCase();
  validatePlan(plan);

  const session = await createCheckoutSession({
    profile: req.auth.profile,
    plan,
  });

  res.status(201).json({
    ok: true,
    data: {
      checkoutSessionId: session.id,
      checkoutUrl: session.url,
    },
  });
});

export const cancelSubscription = asyncHandler(async (req, res) => {
  const stripeSubscription = await cancelLatestSubscription(
    req.auth.profile.id,
  );

  res.status(200).json({
    ok: true,
    data: {
      stripeSubscriptionId: stripeSubscription.id,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      currentPeriodEnd: new Date(
        stripeSubscription.current_period_end * 1000,
      ).toISOString(),
    },
  });
});

export const stripeWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["stripe-signature"];

  if (!signature) {
    throw new HttpError(400, "Missing stripe-signature header");
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      env.stripeWebhookSecret,
    );
  } catch (error) {
    throw new HttpError(
      400,
      `Webhook signature verification failed: ${error.message}`,
    );
  }

  await processStripeWebhookEvent(event);

  res.status(200).json({ received: true });
});
