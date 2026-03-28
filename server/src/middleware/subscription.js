import { hasActiveSubscription } from "../modules/subscriptions/subscription.service.js";
import { HttpError } from "../utils/http.js";

export async function requireActiveSubscription(req, _res, next) {
  const profileId = req.auth?.profile?.id;
  if (!profileId) {
    return next(new HttpError(401, "Authentication required"));
  }

  const active = await hasActiveSubscription(profileId);
  if (!active) {
    return next(new HttpError(403, "Active subscription is required"));
  }

  next();
}

export async function requireActiveSubscriptionForSubscriber(req, _res, next) {
  const role = req.auth?.profile?.role;
  if (role === "admin") {
    return next();
  }

  return requireActiveSubscription(req, _res, next);
}
