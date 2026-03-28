import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { pathToFileURL } from "url";
import { env, assertRequiredEnv } from "./config/env.js";
import apiRoutes from "./routes/api.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { stripeWebhook } from "./modules/subscriptions/subscription.controller.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.appOrigin, credentials: true }));
  app.post(
    "/api/v1/subscriptions/webhook",
    express.raw({ type: "application/json" }),
    stripeWebhook,
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(morgan("dev"));

  app.get("/health", (_req, res) => {
    res.status(200).json({
      ok: true,
      service: "golf-charity-server",
      environment: env.nodeEnv,
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/v1", (_req, res) => {
    res.redirect(307, "/api/v1/");
  });

  app.use("/api/v1", apiRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export function startServer() {
  assertRequiredEnv();
  const app = createApp();
  return app.listen(env.port, () => {
    console.log(`[server] listening on http://localhost:${env.port}`);
  });
}

const isDirectRun = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isDirectRun) {
  startServer();
}
