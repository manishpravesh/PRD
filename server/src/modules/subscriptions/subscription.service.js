import { supabaseAdmin } from "../../config/supabase.js";
import { env } from "../../config/env.js";
import { stripe } from "../../config/stripe.js";
import { HttpError } from "../../utils/http.js";

const ACTIVE_STATUSES = ["active", "trialing"];
const PLAN_TO_PRICE_ID = {
  monthly: env.stripeMonthlyPriceId,
  yearly: env.stripeYearlyPriceId,
};

function mapStripeStatus(status) {
  if (status === "active") return "active";
  if (status === "trialing") return "trialing";
  if (status === "past_due" || status === "unpaid" || status === "incomplete")
    return "past_due";
  if (status === "canceled") return "canceled";
  return "lapsed";
}

function mapPriceIdToPlan(priceId) {
  if (priceId === env.stripeYearlyPriceId) return "yearly";
  return "monthly";
}

async function getOrCreateStripeCustomer(profile) {
  const customers = await stripe.customers.list({
    email: profile.email,
    limit: 1,
  });

  if (customers.data.length > 0) {
    return customers.data[0];
  }

  return stripe.customers.create({
    email: profile.email,
    name: profile.full_name ?? undefined,
    metadata: {
      profile_id: profile.id,
    },
  });
}

export async function getLatestSubscription(profileId) {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select(
      "id, user_id, stripe_customer_id, stripe_subscription_id, plan, status, amount_inr, charity_percent, current_period_start, current_period_end, cancel_at_period_end, updated_at",
    )
    .eq("user_id", profileId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to fetch subscription status: ${error.message}`);
  }

  return data;
}

export async function createCheckoutSession({ profile, plan }) {
  const priceId = PLAN_TO_PRICE_ID[plan];
  if (!priceId) {
    throw new HttpError(400, "Invalid plan requested");
  }

  const customer = await getOrCreateStripeCustomer(profile);

  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: env.stripeSuccessUrl,
    cancel_url: env.stripeCancelUrl,
    metadata: {
      profile_id: profile.id,
      plan,
    },
    subscription_data: {
      metadata: {
        profile_id: profile.id,
        plan,
      },
    },
  });

  return {
    id: session.id,
    url: session.url,
  };
}

export async function cancelLatestSubscription(profileId) {
  const subscription = await getLatestSubscription(profileId);
  if (!subscription?.stripe_subscription_id) {
    throw new HttpError(404, "No Stripe subscription found to cancel");
  }

  const stripeSubscription = await stripe.subscriptions.update(
    subscription.stripe_subscription_id,
    {
      cancel_at_period_end: true,
    },
  );

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      cancel_at_period_end: true,
      status: mapStripeStatus(stripeSubscription.status),
      current_period_start: new Date(
        stripeSubscription.current_period_start * 1000,
      ).toISOString(),
      current_period_end: new Date(
        stripeSubscription.current_period_end * 1000,
      ).toISOString(),
    })
    .eq("id", subscription.id);

  if (error) {
    throw new Error(
      `Unable to persist subscription cancellation: ${error.message}`,
    );
  }

  return stripeSubscription;
}

async function upsertSubscriptionFromStripe(
  stripeSubscription,
  explicitPlan = null,
) {
  const profileId = stripeSubscription.metadata?.profile_id;
  if (!profileId) {
    return null;
  }

  const price = stripeSubscription.items?.data?.[0]?.price;
  const plan = explicitPlan ?? mapPriceIdToPlan(price?.id);
  const amountInr = price?.unit_amount ?? 0;

  const payload = {
    user_id: profileId,
    stripe_customer_id: String(stripeSubscription.customer),
    stripe_subscription_id: stripeSubscription.id,
    plan,
    status: mapStripeStatus(stripeSubscription.status),
    amount_inr: amountInr,
    charity_percent: 10,
    current_period_start: new Date(
      stripeSubscription.current_period_start * 1000,
    ).toISOString(),
    current_period_end: new Date(
      stripeSubscription.current_period_end * 1000,
    ).toISOString(),
    cancel_at_period_end: Boolean(stripeSubscription.cancel_at_period_end),
    canceled_at: stripeSubscription.canceled_at
      ? new Date(stripeSubscription.canceled_at * 1000).toISOString()
      : null,
  };

  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .upsert(payload, { onConflict: "stripe_subscription_id" })
    .select("id")
    .single();

  if (error) {
    throw new Error(
      `Unable to upsert subscription from Stripe: ${error.message}`,
    );
  }

  return data;
}

async function hasProcessedStripeEvent(eventId) {
  const { data } = await supabaseAdmin
    .from("subscription_transactions")
    .select("id")
    .eq("stripe_event_id", eventId)
    .maybeSingle();

  return Boolean(data);
}

async function logStripeEvent({
  subscriptionId,
  eventId,
  transactionType,
  amountInr = 0,
  status,
}) {
  if (!subscriptionId) return;

  await supabaseAdmin.from("subscription_transactions").insert({
    subscription_id: subscriptionId,
    stripe_event_id: eventId,
    transaction_type: transactionType,
    amount_inr: amountInr,
    status,
  });
}

export async function processStripeWebhookEvent(event) {
  if (await hasProcessedStripeEvent(event.id)) {
    return { ignored: true, reason: "event_already_processed" };
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    if (session.mode !== "subscription" || !session.subscription) {
      return { ignored: true, reason: "not_subscription_checkout" };
    }

    const stripeSubscription = await stripe.subscriptions.retrieve(
      String(session.subscription),
    );
    const upserted = await upsertSubscriptionFromStripe(
      stripeSubscription,
      session.metadata?.plan ?? null,
    );

    await logStripeEvent({
      subscriptionId: upserted?.id,
      eventId: event.id,
      transactionType: "checkout_completed",
      amountInr: stripeSubscription.items?.data?.[0]?.price?.unit_amount ?? 0,
      status: mapStripeStatus(stripeSubscription.status),
    });

    return { ignored: false, type: event.type };
  }

  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const stripeSubscription = event.data.object;
    const upserted = await upsertSubscriptionFromStripe(stripeSubscription);

    await logStripeEvent({
      subscriptionId: upserted?.id,
      eventId: event.id,
      transactionType: event.type,
      amountInr: stripeSubscription.items?.data?.[0]?.price?.unit_amount ?? 0,
      status: mapStripeStatus(stripeSubscription.status),
    });

    return { ignored: false, type: event.type };
  }

  if (
    event.type === "invoice.payment_failed" ||
    event.type === "invoice.paid"
  ) {
    const invoice = event.data.object;
    const stripeSubscriptionId = String(invoice.subscription ?? "");

    if (stripeSubscriptionId) {
      const { data: subscription } = await supabaseAdmin
        .from("subscriptions")
        .select("id")
        .eq("stripe_subscription_id", stripeSubscriptionId)
        .maybeSingle();

      await logStripeEvent({
        subscriptionId: subscription?.id,
        eventId: event.id,
        transactionType: event.type,
        amountInr: invoice.amount_paid ?? invoice.amount_due ?? 0,
        status: invoice.status ?? "unknown",
      });

      if (event.type === "invoice.payment_failed" && subscription?.id) {
        await supabaseAdmin
          .from("subscriptions")
          .update({ status: "past_due" })
          .eq("id", subscription.id);
      }
    }

    return { ignored: false, type: event.type };
  }

  return { ignored: true, reason: "event_not_handled" };
}

export async function hasActiveSubscription(profileId) {
  const subscription = await getLatestSubscription(profileId);
  return Boolean(subscription && ACTIVE_STATUSES.includes(subscription.status));
}
