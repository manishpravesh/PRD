import dotenv from "dotenv";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  appOrigin: process.env.APP_ORIGIN ?? "http://localhost:5173",
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  adminSignupCode: process.env.ADMIN_SIGNUP_CODE ?? "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  stripeMonthlyPriceId: process.env.STRIPE_MONTHLY_PRICE_ID ?? "",
  stripeYearlyPriceId: process.env.STRIPE_YEARLY_PRICE_ID ?? "",
  stripeSuccessUrl:
    process.env.STRIPE_SUCCESS_URL ??
    "http://localhost:5173/dashboard?checkout=success",
  stripeCancelUrl:
    process.env.STRIPE_CANCEL_URL ??
    "http://localhost:5173/subscribe?checkout=cancel",
};

export function assertRequiredEnv() {
  const required = [
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_MONTHLY_PRICE_ID",
    "STRIPE_YEARLY_PRICE_ID",
  ];

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0 && env.nodeEnv !== "test") {
    console.warn("[env] Missing environment variables:", missing.join(", "));
  }
}
