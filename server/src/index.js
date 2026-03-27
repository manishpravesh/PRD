import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env, assertRequiredEnv } from "./config/env.js";

assertRequiredEnv();

const app = express();

app.use(helmet());
app.use(cors({ origin: env.appOrigin, credentials: true }));
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
  res.status(200).json({
    message: "Golf Charity Platform API is running",
    version: "v1",
  });
});

app.listen(env.port, () => {
  console.log(`[server] listening on http://localhost:${env.port}`);
});
